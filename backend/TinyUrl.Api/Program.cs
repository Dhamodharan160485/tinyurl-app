// =====================================================
// FILE: Program.cs
// PURPOSE: Main entry point of the application
//          - Configures all services
//          - Defines all API routes (endpoints)
//
// DESIGN PATTERN: Minimal API Pattern Routes are defined directly here instead of separate Controller classes
//
// SOLID: Dependency Inversion Principle
//  High level routes depend on abstractions (AppDbContext, ShortCodeGenerator)  not on low level details (raw SQLite)
// =====================================================

using Microsoft.EntityFrameworkCore;
using Serilog;
using TinyUrl.Api.Data;
using TinyUrl.Api.Models;
using TinyUrl.Api.Services;

// -------------------------------------------------------
// Configure Serilog (Logging)
// Logging means recording what happens in the app. Every request, every error gets written to:
// - Console (you see it while running)
// - A log file (logs/tinyurl-20240101.log)
// -------------------------------------------------------
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File(
        "logs/tinyurl-.log",          // file name prefix
        rollingInterval: RollingInterval.Day  // new file each day
    )
    .CreateLogger();

// -------------------------------------------------------
// Create the application builder
// This is where we register all services that the app needs.
// Think of it as a setup/config phase.
// -------------------------------------------------------
var builder = WebApplication.CreateBuilder(args);

// Tell the app to use Serilog for all logging
builder.Host.UseSerilog();

// -------------------------------------------------------
// Register Swagger
// Swagger = auto-generated API documentation
// Visit http://localhost:5000/swagger to see all routes
// -------------------------------------------------------
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("tiny-url-v1", new()
    {
        Title = "Tiny URL API",
        Version = "tiny-url-v1"
    });
});

// -------------------------------------------------------
// Register the Database (SQLite)
//
// DESIGN PATTERN: Dependency Injection
// We register AppDbContext here ONCE. ASP.NET Core will automatically inject it into every route that needs it - we never use "new AppDbContext()"
//
// SOLID: Dependency Inversion Principle Routes depend on AppDbContext abstraction not on SQLite directly
//
// Connection string is read from appsettings.json If not found, it falls back to "tinyurl.db" file
// -------------------------------------------------------
var connectionString = builder.Configuration
    .GetConnectionString("DefaultConnection")
    ?? "Data Source=tinyurl.db";

builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseSqlite(connectionString));

// -------------------------------------------------------
// Configure CORS
// CORS = Cross Origin Resource Sharing Without this, the Angular app (localhost:4200) cannot call this API (localhost:5000) - browser blocks it.
// This tells the API to allow requests from any origin.
// -------------------------------------------------------
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// -------------------------------------------------------
// Build the application
// After this line, we can no longer register services. Below this we define routes and middleware.
// -------------------------------------------------------
var app = builder.Build();

// -------------------------------------------------------
// Auto-create the database on startup EnsureCreated() checks if the database exists.
// If it does NOT exist, it creates it automatically. This means you don't need to run SQL scripts manually.
// -------------------------------------------------------
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    Log.Information("Database is ready.");
}

// -------------------------------------------------------
// Enable Middleware
// Middleware = code that runs on every request. Order matters here!
// -------------------------------------------------------
//CORS Middleware
// Allow Angular app to call this API
app.UseCors();

// Swagger Middleware
// Enable Swagger UI at /swagger
app.UseSwagger();

// Swagger UI Middleware
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint(
        "/swagger/tiny-url-v1/swagger.json",
        "tiny-url-v1"
    );
});

// =====================================================
// API ROUTES
// Each route below handles one specific action.
// Pattern: HTTP Method + URL + Handler function
// =====================================================

// -------------------------------------------------------
// ROUTE 1: POST /api/add
// PURPOSE: Create a new short URL
//
// What happens step by step:
// 1. Client sends { url: "https://google.com", isPrivate: false }
// 2. We validate the URL is not empty
// 3. We generate a random 6-char code e.g. "aB3xKq"
// 4. We check if that code already exists in database
//    (very unlikely but we handle it)
// 5. We save the new entry to database
// 6. We return the full entry including the short URL
// -------------------------------------------------------
app.MapPost("/api/add", async (
    TinyUrlAddDto dto,      // data sent by client (injected from request body)
    AppDbContext db,        // database (injected by DI)
    HttpContext ctx         // http info like host, scheme (injected by DI)
) =>
{
    // Validate - URL must not be empty
    if (string.IsNullOrWhiteSpace(dto.Url))
    {
        return Results.BadRequest("URL is required.");
    }

    // Generate unique 6-character code
    // Loop until we find a code that doesn't exist in DB
    // e.g. first try "aB3xKq" - if exists, try "Tz9mPq"
    string code;
    do
    {
        code = ShortCodeGenerator.Generate();
    }
    while (await db.TinyUrls.AnyAsync(t => t.Code == code));

    // Create new database entry
    var entry = new TinyUrlEntry
    {
        Code = code,
        OriginalUrl = dto.Url,
        IsPrivate = dto.IsPrivate,
        Clicks = 0,                    // always starts at 0
        CreatedAt = DateTime.UtcNow    // server sets this, not client
    };

    // Save to database
    db.TinyUrls.Add(entry);
    await db.SaveChangesAsync();

    // Build the full short URL
    // e.g. "http://localhost:5000/aB3xKq"
    var baseUrl = $"{ctx.Request.Scheme}://{ctx.Request.Host}";

    Log.Information(
        "Created short URL {Code} -> {Url}",
        code,
        dto.Url
    );

    // Return the created entry with short URL
    return Results.Ok(new
    {
        entry.Id,
        entry.Code,
        entry.OriginalUrl,
        entry.IsPrivate,
        entry.Clicks,
        entry.CreatedAt,
        ShortUrl = $"{baseUrl}/{code}"  // the actual short URL
    });
})
.WithTags("tiny-url")
.WithName("AddUrl");

// -------------------------------------------------------
// ROUTE 2: GET /api/public
// PURPOSE: Get all public URLs (shown in the list)
//
// What happens:
// 1. Filter only URLs where IsPrivate = false
// 2. If search term provided, filter by code or original URL
// 3. Return list ordered by newest first
// -------------------------------------------------------
app.MapGet("/api/public", async (
    AppDbContext db,
    HttpContext ctx,
    string? search      // optional search query e.g. /api/public?search=google
) =>
{
    var baseUrl = $"{ctx.Request.Scheme}://{ctx.Request.Host}";

    // Start with only public URLs
    var query = db.TinyUrls.Where(t => !t.IsPrivate);

    // If search term provided, filter results
    // Search checks both the short code and the original URL
    if (!string.IsNullOrWhiteSpace(search))
    {
        query = query.Where(t =>
            t.Code.Contains(search) ||
            t.OriginalUrl.Contains(search)
        );
    }

    // Execute query and build response
    var items = await query
        .OrderByDescending(t => t.CreatedAt)  // newest first
        .Select(t => new
        {
            t.Id,
            t.Code,
            t.OriginalUrl,
            t.IsPrivate,
            t.Clicks,
            t.CreatedAt,
            ShortUrl = $"{baseUrl}/{t.Code}"
        })
        .ToListAsync();

    return Results.Ok(items);
})
.WithTags("tiny-url")
.WithName("GetPublicUrls");

// -------------------------------------------------------
// ROUTE 3: DELETE /api/delete/{code}
// PURPOSE: Delete a specific short URL by its code
//
// What happens:
// 1. Find the entry with matching code in database
// 2. If not found, return 404 Not Found
// 3. If found, delete it and return 200 OK
// -------------------------------------------------------
app.MapDelete("/api/delete/{code}", async (
    string code,        // taken from URL e.g. /api/delete/aB3xKq
    AppDbContext db
) =>
{
    // Find the entry by code
    var entry = await db.TinyUrls
        .FirstOrDefaultAsync(t => t.Code == code);

    // Return 404 if not found
    if (entry is null)
    {
        return Results.NotFound("Short URL not found.");
    }

    // Delete and save
    db.TinyUrls.Remove(entry);
    await db.SaveChangesAsync();

    Log.Information("Deleted short URL {Code}", code);
    return Results.Ok();
})
.WithTags("tiny-url")
.WithName("DeleteUrl");

// -------------------------------------------------------
// ROUTE 4: DELETE /api/delete-all
// PURPOSE: Delete ALL short URLs
// This is also called by the Azure Function every hour
// -------------------------------------------------------
app.MapDelete("/api/delete-all", async (AppDbContext db) =>
{
    // Remove everything from the TinyUrls table
    db.TinyUrls.RemoveRange(db.TinyUrls);
    await db.SaveChangesAsync();

    Log.Information("Deleted all URLs");
    return Results.Ok();
})
.WithTags("tiny-url")
.WithName("DeleteAllUrls");

// -------------------------------------------------------
// ROUTE 5: PUT /api/update/{code}
// PURPOSE: Update an existing short URL
//
// What happens:
// 1. Find entry by code
// 2. Update the URL and IsPrivate fields
// 3. Save and return updated entry
// -------------------------------------------------------
app.MapPut("/api/update/{code}", async (
    string code,
    TinyUrlUpdateDto dto,
    AppDbContext db
) =>
{
    var entry = await db.TinyUrls
        .FirstOrDefaultAsync(t => t.Code == code);

    if (entry is null)
    {
        return Results.NotFound("Short URL not found.");
    }

    // Update only the fields that are allowed to change
    // Code, Id, Clicks, CreatedAt stay the same
    entry.OriginalUrl = dto.Url;
    entry.IsPrivate = dto.IsPrivate;

    await db.SaveChangesAsync();

    Log.Information("Updated short URL {Code}", code);
    return Results.Ok(entry);
})
.WithTags("tiny-url")
.WithName("UpdateUrl");

// -------------------------------------------------------
// ROUTE 6: GET /{code}
// PURPOSE: Redirect short URL to original URL
//          This is the CORE feature of TinyURL!
//
// What happens:
// 1. User visits http://localhost:5000/aB3xKq
// 2. We find the entry with code "aB3xKq"
// 3. We increment the click count by 1
// 4. We redirect user to the original URL
//    e.g. https://www.google.com
// -------------------------------------------------------
app.MapGet("/{code}", async (string code, AppDbContext db) =>
{
    // Find entry by code
    var entry = await db.TinyUrls
        .FirstOrDefaultAsync(t => t.Code == code);

    // Return 404 if code doesn't exist
    if (entry is null)
    {
        return Results.NotFound("Short URL not found.");
    }

    // Increment click count
    // This tracks how many times the short URL was visited
    entry.Clicks++;
    await db.SaveChangesAsync();

    Log.Information(
        "Redirecting {Code} -> {Url} | Total clicks: {Clicks}",
        code,
        entry.OriginalUrl,
        entry.Clicks
    );

    // Redirect to original URL
    // HTTP 302 = temporary redirect
    return Results.Redirect(entry.OriginalUrl);
})
.WithTags("tiny-url")
.WithName("RedirectUrl")
.ExcludeFromDescription(); // hide from Swagger UI

// -------------------------------------------------------
// Start the application
// Everything above was setup/configuration.
// This line actually starts listening for requests.
// -------------------------------------------------------
app.Run();