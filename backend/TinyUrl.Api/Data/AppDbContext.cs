// =====================================================
// FILE: Data/AppDbContext.cs
// PURPOSE: Connects our app to the SQLite database
// DESIGN PATTERN: Repository Pattern
// SOLID: Single Responsibility - only manages DB access

// AppDbContext is the BRIDGE between C# and the database.
//
// Why Repository Pattern?
// Instead of writing raw SQL everywhere in your code,
// all database operations go through ONE central place
// (AppDbContext). If you change your database tomorrow,
// you only change this file - nothing else.
// =====================================================

using Microsoft.EntityFrameworkCore;
using TinyUrl.Api.Models;

namespace TinyUrl.Api.Data
{
    public class AppDbContext : DbContext
    {
        // -------------------------------------------------------
        // Constructor - receives database configuration
        // from Program.cs via Dependency Injection.
        // We don't create this manually anywhere - ASP.NET
        // Core automatically injects it where needed.
        // SOLID: Dependency Inversion Principle
        // → We depend on DbContextOptions abstraction,
        //   not on a specific database directly
        // -------------------------------------------------------
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // -------------------------------------------------------
        // DbSet = represents the TinyUrls TABLE in the database
        // Each TinyUrlEntry object = one ROW in that table
        //
        // How to use it:
        // db.TinyUrls.ToListAsync()     → SELECT * FROM TinyUrls
        // db.TinyUrls.Add(entry)        → INSERT INTO TinyUrls
        // db.TinyUrls.Remove(entry)     → DELETE FROM TinyUrls
        // db.TinyUrls.Where(...)        → SELECT WHERE ...
        // -------------------------------------------------------
        public DbSet<TinyUrlEntry> TinyUrls => Set<TinyUrlEntry>();

        // -------------------------------------------------------
        // OnModelCreating - configures the database table structure
        // This runs once when the database is first created
        // -------------------------------------------------------
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Make the Code column UNIQUE in the database
            // This means no two URLs can have the same short code
            // e.g. you can't have two rows with Code = "aB3xKq"
            modelBuilder.Entity<TinyUrlEntry>()
                .HasIndex(t => t.Code)
                .IsUnique();
        }
    }
}