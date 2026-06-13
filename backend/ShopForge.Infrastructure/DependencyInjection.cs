using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Infrastructure.Common;
using ShopForge.Infrastructure.Persistence;

namespace ShopForge.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Default")
            ?? throw new InvalidOperationException("Connection string 'Default' is not configured.");

        services.AddDbContext<ShopForgeDbContext>(options =>
            options.UseSqlServer(connectionString, sql => sql.EnableRetryOnFailure(3)));
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<ShopForgeDbContext>());

        services.AddScoped<DevDataSeeder>();
        services.AddSingleton<IClock, Clock>();

        return services;
    }
}
