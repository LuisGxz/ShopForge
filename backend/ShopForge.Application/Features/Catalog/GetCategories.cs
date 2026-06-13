using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Interfaces;

namespace ShopForge.Application.Features.Catalog;

public record GetCategoriesQuery : IRequest<IReadOnlyList<CategoryDto>>;

public class GetCategoriesHandler(IAppDbContext db) : IRequestHandler<GetCategoriesQuery, IReadOnlyList<CategoryDto>>
{
    public async Task<IReadOnlyList<CategoryDto>> Handle(GetCategoriesQuery request, CancellationToken ct) =>
        await db.Categories
            .OrderBy(c => c.SortOrder)
            .Select(c => new CategoryDto(
                c.Id, c.Slug, c.Name, c.NameEs, c.Description, c.DescriptionEs, c.SortOrder,
                c.Products.Count(p => p.IsActive)))
            .ToListAsync(ct);
}
