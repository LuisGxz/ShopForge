using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Application.Common.Models;

namespace ShopForge.Application.Features.Reviews;

public record ReviewDto(Guid Id, string AuthorName, int Rating, string? Title, string Body, bool IsVerifiedPurchase, DateTime CreatedAtUtc);

public record GetReviewsQuery(string Slug, int Page = 1, int PageSize = 10) : IRequest<PagedResult<ReviewDto>>;

public class GetReviewsValidator : AbstractValidator<GetReviewsQuery>
{
    public GetReviewsValidator()
    {
        RuleFor(x => x.Page).GreaterThanOrEqualTo(1);
        RuleFor(x => x.PageSize).InclusiveBetween(1, 50);
    }
}

public class GetReviewsHandler(IAppDbContext db) : IRequestHandler<GetReviewsQuery, PagedResult<ReviewDto>>
{
    public async Task<PagedResult<ReviewDto>> Handle(GetReviewsQuery request, CancellationToken ct)
    {
        var product = await db.Products
            .Where(p => p.Slug == request.Slug)
            .Select(p => new { p.Id })
            .FirstOrDefaultAsync(ct)
            ?? throw new NotFoundException("Product", request.Slug);

        var query = db.Reviews.Where(r => r.ProductId == product.Id);

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .Select(r => new ReviewDto(r.Id, r.AuthorName, r.Rating, r.Title, r.Body, r.IsVerifiedPurchase, r.CreatedAtUtc))
            .ToListAsync(ct);

        return new PagedResult<ReviewDto>(items, request.Page, request.PageSize, total);
    }
}
