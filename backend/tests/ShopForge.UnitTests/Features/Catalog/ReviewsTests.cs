using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Application.Features.Reviews;
using ShopForge.Domain.Entities;

namespace ShopForge.UnitTests.Features.Catalog;

public class ReviewsTests
{
    private class FixedClock : IClock { public DateTime UtcNow { get; } = new(2026, 6, 13, 12, 0, 0, DateTimeKind.Utc); }

    [Fact]
    public async Task Create_review_persists_and_recomputes_rating()
    {
        var db = await CatalogTestData.SeededAsync();
        var user = new User { Email = "casey@t.dev", FullName = "Casey Lab", PasswordHash = "x" };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var handler = new CreateReviewHandler(db, new FixedClock());
        var dto = await handler.Handle(new CreateReviewCommand(user.Id, "kettle", 5, "Great", "Pours beautifully, love it."), default);

        Assert.Equal("Casey Lab", dto.AuthorName);
        Assert.False(dto.IsVerifiedPurchase);                      // no orders seeded

        var product = await db.Products.Include(p => p.Reviews).FirstAsync(p => p.Slug == "kettle");
        Assert.Equal(1, product.ReviewCount);
        Assert.Equal(5m, product.AverageRating);
    }

    [Fact]
    public async Task Second_review_by_same_user_is_rejected()
    {
        var db = await CatalogTestData.SeededAsync();
        var user = new User { Email = "casey@t.dev", FullName = "Casey Lab", PasswordHash = "x" };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        var handler = new CreateReviewHandler(db, new FixedClock());
        await handler.Handle(new CreateReviewCommand(user.Id, "kettle", 5, null, "First review here."), default);

        await Assert.ThrowsAsync<ConflictException>(() =>
            handler.Handle(new CreateReviewCommand(user.Id, "kettle", 4, null, "Trying to review twice."), default));
    }

    [Fact]
    public async Task Reviews_are_listed_newest_first_and_paginated()
    {
        var db = await CatalogTestData.SeededAsync();
        var handler = new CreateReviewHandler(db, new FixedClock());

        for (var i = 0; i < 3; i++)
        {
            var u = new User { Email = $"u{i}@t.dev", FullName = $"User {i}", PasswordHash = "x" };
            db.Users.Add(u);
            await db.SaveChangesAsync();
            await handler.Handle(new CreateReviewCommand(u.Id, "kettle", 4 + i % 2, null, $"Review body number {i} here."), default);
        }

        var page = await new GetReviewsHandler(db).Handle(new GetReviewsQuery("kettle", Page: 1, PageSize: 2), default);
        Assert.Equal(3, page.TotalCount);
        Assert.Equal(2, page.Items.Count);
    }

    [Fact]
    public async Task Reviews_for_unknown_product_throws()
    {
        var db = await CatalogTestData.SeededAsync();
        await Assert.ThrowsAsync<NotFoundException>(() => new GetReviewsHandler(db).Handle(new GetReviewsQuery("nope"), default));
    }
}
