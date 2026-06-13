using Microsoft.EntityFrameworkCore;
using Serilog;
using ShopForge.Api.Infrastructure;
using ShopForge.Application;
using ShopForge.Infrastructure;
using ShopForge.Infrastructure.Persistence;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, config) => config
        .ReadFrom.Configuration(context.Configuration)
        .Enrich.FromLogContext()
        .WriteTo.Console());

    builder.Services.AddApplication();
    builder.Services.AddInfrastructure(builder.Configuration);

    builder.Services.AddCors(options => options.AddPolicy("frontend", policy => policy
        .WithOrigins(builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? ["http://localhost:4200"])
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()));

    builder.Services.AddExceptionHandler<GlobalExceptionHandler>();
    builder.Services.AddProblemDetails();
    builder.Services.AddHealthChecks();
    builder.Services.AddOpenApi();

    var app = builder.Build();

    app.UseExceptionHandler();
    app.UseSerilogRequestLogging();
    app.UseCors("frontend");

    if (app.Environment.IsDevelopment())
        app.MapOpenApi();

    // Apply pending migrations on startup; seed the demo catalog when enabled (dev and demo deployments).
    using (var scope = app.Services.CreateScope())
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ShopForgeDbContext>();
        await dbContext.Database.MigrateAsync();

        if (app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("SeedDemoData"))
            await scope.ServiceProvider.GetRequiredService<DevDataSeeder>().SeedAsync();
    }

    app.MapHealthChecks("/health");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "ShopForge API terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
