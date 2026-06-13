using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Application.Features.Cart;
using ShopForge.Application.Features.Checkout;
using ShopForge.Domain.Entities;
using ShopForge.Domain.Enums;
using ShopForge.Infrastructure.Persistence;

namespace ShopForge.UnitTests.Features.Commerce;

public class FixedClock : IClock { public DateTime UtcNow { get; set; } = new(2026, 6, 13, 12, 0, 0, DateTimeKind.Utc); }

/// <summary>Configurable payment gateway double for checkout tests.</summary>
public class FakeGateway : IPaymentGateway
{
    public bool Succeeded { get; set; } = true;
    public PaymentWebhookResult? WebhookResult { get; set; }

    public bool IsLive => false;
    public string PublishableKey => "pk_test_fake";

    public Task<PaymentIntentResult> CreatePaymentIntentAsync(decimal amount, string currency, string orderNumber, string email, CancellationToken ct) =>
        Task.FromResult(new PaymentIntentResult($"pi_test_{orderNumber}", $"pi_test_{orderNumber}_secret"));

    public Task<bool> IsPaymentSucceededAsync(string paymentIntentId, CancellationToken ct) => Task.FromResult(Succeeded);

    public PaymentWebhookResult? ParseWebhook(string payload, string signatureHeader) => WebhookResult;
}

public class CommerceFixture
{
    public ShopForgeDbContext Db { get; }
    public FixedClock Clock { get; } = new();
    public FakeGateway Gateway { get; } = new();
    public OrderFinalizer Finalizer { get; }

    public CommerceFixture()
    {
        var options = new DbContextOptionsBuilder<ShopForgeDbContext>()
            .UseInMemoryDatabase($"commerce-{Guid.NewGuid()}")
            .ConfigureWarnings(w => w.Ignore(InMemoryEventId.TransactionIgnoredWarning))
            .Options;
        Db = new ShopForgeDbContext(options);
        Finalizer = new OrderFinalizer(Db, Clock);
    }

    public async Task<User> AddUserAsync(string email = "buyer@test.dev")
    {
        var user = new User { Email = email, FullName = "Buyer One", PasswordHash = "x" };
        Db.Users.Add(user);
        await Db.SaveChangesAsync();
        return user;
    }

    public async Task<ProductVariant> AddProductAsync(decimal price, int stock, string slug = "test-coffee")
    {
        var category = await Db.Categories.FirstOrDefaultAsync(c => c.Id == 1)
            ?? Db.Categories.Add(new Category { Id = 1, Slug = "coffee", Name = "Coffee", Description = "x" }).Entity;
        var product = new Product
        {
            Slug = slug, Name = "Test Coffee", CategoryId = category.Id,
            FlavorNotes = "notes", Description = "desc", IsActive = true
        };
        var variant = new ProductVariant { ProductId = product.Id, Size = "12 oz", Sku = $"{slug}-12oz", Price = price, SortOrder = 1 };
        variant.SetStock(stock);
        product.Variants.Add(variant);
        product.Images.Add(new ProductImage { ProductId = product.Id, Url = $"assets/{slug}.svg", AltText = "x", Tone = "copper", SortOrder = 1 });
        Db.Products.Add(product);
        await Db.SaveChangesAsync();
        return variant;
    }

    public async Task AddToCartAsync(Guid userId, Guid variantId, int qty, string grind = "Whole bean")
    {
        await new AddCartItemHandler(Db, Clock).Handle(new AddCartItemCommand(userId, variantId, grind, qty), default);
    }

    public static ShippingAddressInput Address() =>
        new("Buyer One", "1 Bean St", null, "Portland", "OR", "97201", "USA", null);
}
