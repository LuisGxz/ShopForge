using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Application.Common.Models;
using ShopForge.Application.Features.Catalog;
using ShopForge.Domain.Entities;
using ShopForge.Domain.Enums;

namespace ShopForge.Application.Features.Admin;

public record AdminProductListItemDto(
    Guid Id, string Slug, string Name, string CategoryName, bool IsActive, bool IsFeatured,
    decimal AverageRating, int ReviewCount, decimal FromPrice, int TotalStock, int VariantCount);

public record GetAdminProductsQuery(string? Search = null, int Page = 1, int PageSize = 20)
    : IRequest<PagedResult<AdminProductListItemDto>>;

public class GetAdminProductsHandler(IAppDbContext db) : IRequestHandler<GetAdminProductsQuery, PagedResult<AdminProductListItemDto>>
{
    public async Task<PagedResult<AdminProductListItemDto>> Handle(GetAdminProductsQuery request, CancellationToken ct)
    {
        var query = db.Products.AsQueryable();
        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var term = request.Search.Trim();
            query = query.Where(p => p.Name.Contains(term) || p.Slug.Contains(term));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderBy(p => p.Name)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(p => new AdminProductListItemDto(
                p.Id, p.Slug, p.Name, p.Category!.Name, p.IsActive, p.IsFeatured,
                p.AverageRating, p.ReviewCount,
                p.Variants.Min(v => v.Price), p.Variants.Sum(v => v.StockQuantity), p.Variants.Count))
            .ToListAsync(ct);

        return new PagedResult<AdminProductListItemDto>(items, request.Page, request.PageSize, total);
    }
}

public record UpdateProductCommand(
    Guid Id, string Name, int CategoryId, bool IsActive, bool IsFeatured,
    string? HeroLabel, string? HeroLabelEs, string FlavorNotes, string Description,
    string? Origin, RoastLevel Roast, ProcessMethod Process) : IRequest<ProductDetailDto>;

public class UpdateProductValidator : AbstractValidator<UpdateProductCommand>
{
    public UpdateProductValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(120);
        RuleFor(x => x.FlavorNotes).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).NotEmpty().MaximumLength(2000);
    }
}

public class UpdateProductHandler(IAppDbContext db) : IRequestHandler<UpdateProductCommand, ProductDetailDto>
{
    public async Task<ProductDetailDto> Handle(UpdateProductCommand request, CancellationToken ct)
    {
        var product = await db.Products.FirstOrDefaultAsync(p => p.Id == request.Id, ct)
            ?? throw new NotFoundException("Product", request.Id);

        if (!await db.Categories.AnyAsync(c => c.Id == request.CategoryId, ct))
            throw new NotFoundException("Category", request.CategoryId);

        product.Name = request.Name.Trim();
        product.CategoryId = request.CategoryId;
        product.IsActive = request.IsActive;
        product.IsFeatured = request.IsFeatured;
        product.HeroLabel = string.IsNullOrWhiteSpace(request.HeroLabel) ? null : request.HeroLabel.Trim();
        product.HeroLabelEs = string.IsNullOrWhiteSpace(request.HeroLabelEs) ? null : request.HeroLabelEs.Trim();
        product.FlavorNotes = request.FlavorNotes.Trim();
        product.Description = request.Description.Trim();
        product.Origin = string.IsNullOrWhiteSpace(request.Origin) ? null : request.Origin.Trim();
        product.RoastLevel = request.Roast;
        product.Process = request.Process;

        await db.SaveChangesAsync(ct);
        return await new GetProductDetailHandler(db).Handle(new GetProductDetailQuery(product.Slug), ct);
    }
}

public record UpdateVariantCommand(Guid VariantId, decimal Price, int StockQuantity) : IRequest;

public class UpdateVariantValidator : AbstractValidator<UpdateVariantCommand>
{
    public UpdateVariantValidator()
    {
        RuleFor(x => x.Price).GreaterThan(0);
        RuleFor(x => x.StockQuantity).GreaterThanOrEqualTo(0);
    }
}

public class UpdateVariantHandler(IAppDbContext db) : IRequestHandler<UpdateVariantCommand>
{
    public async Task Handle(UpdateVariantCommand request, CancellationToken ct)
    {
        var variant = await db.ProductVariants.FirstOrDefaultAsync(v => v.Id == request.VariantId, ct)
            ?? throw new NotFoundException("Product variant", request.VariantId);

        variant.Price = request.Price;
        variant.SetStock(request.StockQuantity);
        await db.SaveChangesAsync(ct);
    }
}
