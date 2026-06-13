using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Application.Common.Models;
using ShopForge.Domain.Enums;

namespace ShopForge.Application.Features.Catalog;

public record GetProductsQuery(
    string? Search = null,
    string? Category = null,
    RoastLevel? Roast = null,
    ProcessMethod? Process = null,
    decimal? MinPrice = null,
    decimal? MaxPrice = null,
    string Sort = "featured",
    int Page = 1,
    int PageSize = 12) : IRequest<PagedResult<ProductListItemDto>>;

public class GetProductsValidator : AbstractValidator<GetProductsQuery>
{
    private static readonly string[] AllowedSorts = ["featured", "price-asc", "price-desc", "rating", "newest"];

    public GetProductsValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 48);
        RuleFor(x => x.Sort).Must(s => AllowedSorts.Contains(s)).WithMessage("Unknown sort option.");
        RuleFor(x => x.MaxPrice).GreaterThanOrEqualTo(x => x.MinPrice).When(x => x.MinPrice.HasValue && x.MaxPrice.HasValue);
    }
}

public class GetProductsHandler(IAppDbContext db) : IRequestHandler<GetProductsQuery, PagedResult<ProductListItemDto>>
{
    public async Task<PagedResult<ProductListItemDto>> Handle(GetProductsQuery request, CancellationToken ct)
    {
        var query = db.Products.Where(p => p.IsActive);

        if (!string.IsNullOrWhiteSpace(request.Category))
            query = query.Where(p => p.Category!.Slug == request.Category);
        if (request.Roast.HasValue)
            query = query.Where(p => p.RoastLevel == request.Roast);
        if (request.Process.HasValue)
            query = query.Where(p => p.Process == request.Process);
        if (request.MinPrice.HasValue)
            query = query.Where(p => p.Variants.Min(v => v.Price) >= request.MinPrice);
        if (request.MaxPrice.HasValue)
            query = query.Where(p => p.Variants.Min(v => v.Price) <= request.MaxPrice);
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(p =>
                p.Name.Contains(term) ||
                p.FlavorNotes.Contains(term) ||
                (p.Origin != null && p.Origin.Contains(term)));
        }

        query = request.Sort switch
        {
            "price-asc" => query.OrderBy(p => p.Variants.Min(v => v.Price)),
            "price-desc" => query.OrderByDescending(p => p.Variants.Min(v => v.Price)),
            "rating" => query.OrderByDescending(p => p.AverageRating).ThenByDescending(p => p.ReviewCount),
            "newest" => query.OrderByDescending(p => p.CreatedAtUtc),
            _ => query.OrderByDescending(p => p.IsFeatured).ThenByDescending(p => p.ReviewCount)
        };

        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new ProductListItemDto(
                p.Id, p.Slug, p.Name, p.Category!.Slug,
                p.Origin, p.OriginEs, p.RoastLevel.ToString(), p.Process.ToString(),
                p.FlavorNotes, p.FlavorNotesEs, p.HeroLabel, p.HeroLabelEs,
                p.AverageRating, p.ReviewCount,
                p.Variants.Min(v => v.Price),
                p.Images.OrderBy(i => i.SortOrder).Select(i => i.Url).FirstOrDefault(),
                p.Images.OrderBy(i => i.SortOrder).Select(i => i.Tone).FirstOrDefault(),
                p.IsFeatured,
                p.Variants.Any(v => v.StockQuantity > 0)))
            .ToListAsync(ct);

        return new PagedResult<ProductListItemDto>(items, request.Page, request.PageSize, total);
    }
}
