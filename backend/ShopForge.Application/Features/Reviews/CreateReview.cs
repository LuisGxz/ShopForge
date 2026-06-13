using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Domain.Entities;
using ShopForge.Domain.Enums;

namespace ShopForge.Application.Features.Reviews;

public record CreateReviewCommand(Guid UserId, string Slug, int Rating, string? Title, string Body) : IRequest<ReviewDto>;

public class CreateReviewValidator : AbstractValidator<CreateReviewCommand>
{
    public CreateReviewValidator()
    {
        RuleFor(x => x.Rating).InclusiveBetween(1, 5);
        RuleFor(x => x.Title).MaximumLength(120);
        RuleFor(x => x.Body).NotEmpty().MinimumLength(10).MaximumLength(2000);
    }
}

public class CreateReviewHandler(IAppDbContext db, IClock clock) : IRequestHandler<CreateReviewCommand, ReviewDto>
{
    public async Task<ReviewDto> Handle(CreateReviewCommand request, CancellationToken ct)
    {
        var product = await db.Products
            .Include(p => p.Reviews)
            .FirstOrDefaultAsync(p => p.Slug == request.Slug && p.IsActive, ct)
            ?? throw new NotFoundException("Product", request.Slug);

        if (product.Reviews.Any(r => r.UserId == request.UserId))
            throw new ConflictException("You have already reviewed this product.");

        var user = await db.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, ct)
            ?? throw new NotFoundException("User", request.UserId);

        // Verified purchase = the user has a non-cancelled, paid-or-later order containing this product.
        var verified = await db.Orders.AnyAsync(o =>
            o.UserId == request.UserId &&
            o.Status != OrderStatus.PendingPayment &&
            o.Status != OrderStatus.Cancelled &&
            o.Items.Any(i => i.ProductId == product.Id), ct);

        var review = new Review
        {
            ProductId = product.Id,
            UserId = user.Id,
            AuthorName = user.FullName,
            Rating = request.Rating,
            Title = string.IsNullOrWhiteSpace(request.Title) ? null : request.Title.Trim(),
            Body = request.Body.Trim(),
            IsVerifiedPurchase = verified,
            CreatedAtUtc = clock.UtcNow
        };

        product.Reviews.Add(review);
        product.RecomputeRating();
        await db.SaveChangesAsync(ct);

        return new ReviewDto(review.Id, review.AuthorName, review.Rating, review.Title, review.Body, review.IsVerifiedPurchase, review.CreatedAtUtc);
    }
}
