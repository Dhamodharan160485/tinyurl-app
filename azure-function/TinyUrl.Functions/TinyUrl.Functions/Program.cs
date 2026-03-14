// =====================================================
// FILE: Program.cs
// PURPOSE: Entry point for Azure Functions app
// =====================================================

using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

var host = new HostBuilder()
    .ConfigureFunctionsWorkerDefaults()
    .ConfigureServices(services =>
    {
        // Register HttpClient for dependency injection
        // Used by DeleteAllUrlsFunction to call the API
        services.AddHttpClient();
    })
    .Build();

host.Run();