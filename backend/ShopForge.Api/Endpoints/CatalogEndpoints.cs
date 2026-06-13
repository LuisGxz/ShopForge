using MediatR;
using Microsoft.AspNetCore.Mvc;
using ShopForge.Api.Infrastructure;
using ShopForge.Application.Features.Catalog;
using ShopForge.Application.Features.Reviews;
using ShopForge.Domain.Enums;

namespace ShopForge.Api.Endpoints;

public static class CatalogEndpoints
{
    public record CreateReviewRequest(int Rating, string? Title, string Body);

    public static IEndpointRouteBuilder MapCatalogEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1").WithTags("Catalog");

        group.MapGet("/categories", async (ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetCategoriesQuery(), ct)));

        group.MapGet("/products", async (
                [FromQuery] string? search, [FromQuery] string? category,
                [FromQuery] RoastLevel? roast, [FromQuery] ProcessMethod? process,
                [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice,
                [FromQuery] string? sort, [FromQuery] int? page, [FromQuery] int? pageSize,
                ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetProductsQuery(
                search, category, roast, process, minPrice, maxPrice,
                sort ?? "featured", page ?? 1, pageSize ?? 12), ct)));

        group.MapGet("/products/{slug}", async (string slug, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetProductDetailQuery(slug), ct)));

        group.MapGet("/products/{slug}/reviews", async (
                string slug, [FromQuery] int? page, [FromQuery] int? pageSize, ISender sender, CancellationToken ct) =>
            Results.Ok(await sender.Send(new GetReviewsQuery(slug, page ?? 1, pageSize ?? 10), ct)));

        group.MapPost("/products/{slug}/reviews", async (
                string slug, [FromBody] CreateReviewRequest request, HttpContext http, ISender sender, CancellationToken ct) =>
            {
                var dto = await sender.Send(new CreateReviewCommand(
                    http.User.GetUserId(), slug, request.Rating, request.Title, request.Body), ct);
                return Results.Created($"/api/v1/products/{slug}/reviews/{dto.Id}", dto);
            })
            .RequireAuthorization();

        return app;
    }
}
