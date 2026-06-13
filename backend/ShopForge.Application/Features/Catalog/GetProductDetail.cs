using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Common.Interfaces;

namespace ShopForge.Application.Features.Catalog;

public record GetProductDetailQuery(string Slug) : IRequest<ProductDetailDto>;

public class GetProductDetailHandler(IAppDbContext db) : IRequestHandler<GetProductDetailQuery, ProductDetailDto>
{
    public async Task<ProductDetailDto> Handle(GetProductDetailQuery request, CancellationToken ct)
    {
        var dto = await db.Products
            .Where(p => p.Slug == request.Slug && p.IsActive)
            .Select(p => new ProductDetailDto(
                p.Id, p.Slug, p.Name, p.CategoryId, p.Category!.Slug, p.Category.Name, p.Category.NameEs,
                p.Origin, p.OriginEs, p.Region, p.AltitudeMeters,
                p.RoastLevel.ToString(), p.Process.ToString(),
                p.FlavorNotes, p.FlavorNotesEs, p.Description, p.DescriptionEs,
                p.HeroLabel, p.HeroLabelEs, p.AverageRating, p.ReviewCount,
                p.Variants.OrderBy(v => v.SortOrder)
                    .Select(v => new ProductVariantDto(v.Id, v.Size, v.SizeEs, v.Sku, v.Price, v.StockQuantity, v.StockQuantity > 0, v.SortOrder))
                    .ToList(),
                p.Images.OrderBy(i => i.SortOrder)
                    .Select(i => new ProductImageDto(i.Id, i.Url, i.AltText, i.Tone, i.SortOrder))
                    .ToList()))
            .FirstOrDefaultAsync(ct);

        return dto ?? throw new NotFoundException("Product", request.Slug);
    }
}
