// =====================================================
// FILE: DeleteAllUrlsFunction.cs
// PURPOSE: Azure Function that runs every hour
//          and deletes all short URLs
//
// DESIGN PATTERN: Serverless / Event-driven
// → No server to manage
// → Runs automatically on a schedule
// → Azure manages the infrastructure
//
// What is a Timer Trigger?
// Timer trigger runs the function on a schedule
// defined by a CRON expression
//
// CRON expression: "0 0 * * * *"
// → Second: 0
// → Minute: 0
// → Hour:   * (every hour)
// → Day:    * (every day)
// → Month:  * (every month)
// → WeekDay:* (every weekday)
// Means: run at minute 0 of every hour
// e.g. 1:00, 2:00, 3:00, 4:00...
// =====================================================

using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace TinyUrl.Functions
{
    public class DeleteAllUrlsFunction
    {
        // -------------------------------------------------------
        // Logger - writes messages to Azure Function logs
        // -------------------------------------------------------
        private readonly ILogger<DeleteAllUrlsFunction> _logger;

        // -------------------------------------------------------
        // HttpClient - makes HTTP calls to our backend API
        // Injected by dependency injection from Program.cs
        // -------------------------------------------------------
        private readonly IHttpClientFactory _httpClientFactory;

        // -------------------------------------------------------
        // Constructor - receives dependencies via DI
        // SOLID: Dependency Inversion Principle
        // → Depends on IHttpClientFactory abstraction
        //   not on HttpClient directly
        // -------------------------------------------------------
        public DeleteAllUrlsFunction(
            ILogger<DeleteAllUrlsFunction> logger,
            IHttpClientFactory httpClientFactory)
        {
            _logger = logger;
            _httpClientFactory = httpClientFactory;
        }

        // -------------------------------------------------------
        // Run() - main function that executes on schedule
        //
        // [Function] attribute marks this as Azure Function
        // [TimerTrigger] defines when it runs
        // "0 0 * * * *" = every hour at minute 0
        //
        // TimerInfo contains info about the timer:
        // → IsPastDue: true if function ran late
        // → ScheduleStatus: last/next run times
        // -------------------------------------------------------
        [Function("DeleteAllUrls")]
        public async Task Run(
            [TimerTrigger("0 0 * * * *")] TimerInfo timer)
        {
            _logger.LogInformation(
                "DeleteAllUrls function triggered at: {Time}",
                DateTime.UtcNow
            );

            // Get API base URL from environment variable
            // Set in local.settings.json locally
            // Set in Azure Function App Settings in production
            var apiBaseUrl = Environment.GetEnvironmentVariable("ApiBaseUrl")
                ?? "https://tinyurl-api-dhamo.azurewebsites.net";

            try
            {
                // Create HttpClient from factory
                var client = _httpClientFactory.CreateClient();

                // Call DELETE /api/delete-all on our backend API
                var response = await client.DeleteAsync(
                    $"{apiBaseUrl}/api/delete-all"
                );

                if (response.IsSuccessStatusCode)
                {
                    _logger.LogInformation(
                        "Successfully deleted all URLs at {Time}",
                        DateTime.UtcNow
                    );
                }
                else
                {
                    _logger.LogError(
                        "Failed to delete URLs. Status: {Status}",
                        response.StatusCode
                    );
                }
            }
            catch (Exception ex)
            {
                // Log any unexpected errors
                _logger.LogError(
                    "Error deleting URLs: {Error}",
                    ex.Message
                );
            }
        }
    }
}