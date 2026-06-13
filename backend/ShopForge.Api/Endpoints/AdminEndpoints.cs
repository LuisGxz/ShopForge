using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShopForge.Application.Features.Admin;
using ShopForge.Domain.Enums;

namespace ShopForge.Api.Endpoints;

public static class AdminEndpoints
{
    public record UpdateProductRequest(
        string Name, int CategoryId, bool IsActive, bool IsFeatured,
        string? HeroLabel, string? HeroLabelEs, string FlavorNotes, string Description,
        string? Origin, RoastLevel Roast, ProcessMethod Process);

    public record UpdateVariantRequest(decimal Price, int StockQuantity);

    public static IEndpointRouteBuilder MapAdminEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/admin").WithTags("Admin").RequireAuthorization("Admin");

        group.MapGet("/dashboard", async (ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetDashboardQuery(), ct)));

        group.MapGet("/products", async ([FromQuery] string? search, [FromQuery] int? page, [FromQuery] int? pageSize, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetAdminProductsQuery(search, page ?? 1, pageSize ?? 20), ct)));

        group.MapPut("/products/{id:guid}", async (Guid id, [FromBody] UpdateProductRequest r, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new UpdateProductCommand(
                id, r.Name, r.CategoryId, r.IsActive, r.IsFeatured, r.HeroLabel, r.HeroLabelEs,
                r.FlavorNotes, r.Description, r.Origin, r.Roast, r.Process), ct)));

        group.MapPut("/variants/{id:guid}", async (Guid id, [FromBody] UpdateVariantRequest r, ISender sender, CancellationToken ct) =>
        {
            await sender.Send(new UpdateVariantCommand(id, r.Price, r.StockQuantity), ct);
            return Results.NoContent();
        });

        group.MapGet("/orders", async ([FromQuery] OrderStatus? status, [FromQuery] int? page, [FromQuery] int? pageSize, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetAdminOrdersQuery(status, page ?? 1, pageSize ?? 20), ct)));

        group.MapPost("/orders/{orderNumber}/advance", async (string orderNumber, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new AdvanceOrderCommand(orderNumber), ct)));

        group.MapPost("/orders/{orderNumber}/cancel", async (string orderNumber, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new CancelOrderCommand(orderNumber), ct)));

        return app;
    }
}
