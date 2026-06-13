using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using ShopForge.Application.Common.Behaviors;
using ShopForge.Application.Features.Auth;
using ShopForge.Application.Features.Checkout;

namespace ShopForge.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(DependencyInjection).Assembly));
        services.AddValidatorsFromAssembly(typeof(DependencyInjection).Assembly);
        services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
        services.AddScoped<AuthTokenIssuer>();
        services.AddScoped<OrderFinalizer>();
        return services;
    }
}
