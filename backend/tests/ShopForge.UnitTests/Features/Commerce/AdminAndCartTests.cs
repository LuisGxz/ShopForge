using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Features.Admin;
using ShopForge.Application.Features.Cart;
using ShopForge.Application.Features.Checkout;
using ShopForge.Domain.Enums;
using ShopForge.Domain.Exceptions;

namespace ShopForge.UnitTests.Features.Commerce;

public class AdminAndCartTests
{
    private readonly CommerceFixture _f = new();

    private async Task<string> PlaceAndPayAsync(Guid userId, Guid variantId, int qty)
    {
        await _f.AddToCartAsync(userId, variantId, qty);
        var intent = await new CreateCheckoutIntentHandler(_f.Db, _f.Clock, _f.Gateway)
            .Handle(new CreateCheckoutIntentCommand(userId, "buyer@test.dev", CommerceFixture.Address(), null), default);
        await new ConfirmCheckoutHandler(_f.Db, _f.Gateway, _f.Finalizer)
            .Handle(new ConfirmCheckoutCommand(userId, intent.OrderNumber), default);
        return intent.OrderNumber;
    }

    [Fact]
    public async Task Admin_advances_order_through_fulfilment_steps()
    {
        var user = await _f.AddUserAsync();
        var variant = await _f.AddProductAsync(price: 30m, stock: 10);
        var orderNumber = await PlaceAndPayAsync(user.Id, variant.Id, 1);

        var advance = new AdvanceOrderHandler(_f.Db);
        Assert.Equal("Processing", (await advance.Handle(new AdvanceOrderCommand(orderNumber), default)).Status);
        Assert.Equal("Shipped", (await advance.Handle(new AdvanceOrderCommand(orderNumber), default)).Status);
        Assert.Equal("Delivered", (await advance.Handle(new AdvanceOrderCommand(orderNumber), default)).Status);

        // No step after Delivered.
        await Assert.ThrowsAsync<DomainException>(() => advance.Handle(new AdvanceOrderCommand(orderNumber), default));
    }

    [Fact]
    public async Task Cancelling_a_paid_order_restores_stock()
    {
        var user = await _f.AddUserAsync();
        var variant = await _f.AddProductAsync(price: 30m, stock: 10);
        var orderNumber = await PlaceAndPayAsync(user.Id, variant.Id, 4);

        Assert.Equal(6, (await _f.Db.ProductVariants.FirstAsync(v => v.Id == variant.Id)).StockQuantity);

        var detail = await new CancelOrderHandler(_f.Db, _f.Clock).Handle(new CancelOrderCommand(orderNumber), default);

        Assert.Equal("Cancelled", detail.Status);
        Assert.Equal(10, (await _f.Db.ProductVariants.FirstAsync(v => v.Id == variant.Id)).StockQuantity);  // restored
    }

    [Fact]
    public async Task Shipped_order_cannot_be_cancelled()
    {
        var user = await _f.AddUserAsync();
        var variant = await _f.AddProductAsync(price: 30m, stock: 10);
        var orderNumber = await PlaceAndPayAsync(user.Id, variant.Id, 1);

        var advance = new AdvanceOrderHandler(_f.Db);
        await advance.Handle(new AdvanceOrderCommand(orderNumber), default);  // Processing
        await advance.Handle(new AdvanceOrderCommand(orderNumber), default);  // Shipped

        await Assert.ThrowsAsync<DomainException>(() =>
            new CancelOrderHandler(_f.Db, _f.Clock).Handle(new CancelOrderCommand(orderNumber), default));
    }

    [Fact]
    public async Task Dashboard_reports_revenue_and_top_products()
    {
        var user = await _f.AddUserAsync();
        var variant = await _f.AddProductAsync(price: 30m, stock: 20);
        await PlaceAndPayAsync(user.Id, variant.Id, 2);   // 60 subtotal, free shipping -> total 60

        var dash = await new GetDashboardHandler(_f.Db, _f.Clock).Handle(new GetDashboardQuery(), default);

        Assert.Equal(1, dash.PaidOrders);
        Assert.Equal(60m, dash.TotalRevenue);
        Assert.Equal("Test Coffee", dash.TopProducts[0].ProductName);
        Assert.Equal(2, dash.TopProducts[0].UnitsSold);
    }

    [Fact]
    public async Task Cart_add_beyond_stock_is_rejected()
    {
        var user = await _f.AddUserAsync();
        var variant = await _f.AddProductAsync(price: 20m, stock: 3);

        await Assert.ThrowsAsync<DomainException>(() =>
            new AddCartItemHandler(_f.Db, _f.Clock).Handle(new AddCartItemCommand(user.Id, variant.Id, "Whole bean", 5), default));
    }

    [Fact]
    public async Task Cart_get_returns_subtotal_and_item_count()
    {
        var user = await _f.AddUserAsync();
        var variant = await _f.AddProductAsync(price: 20m, stock: 10);
        await _f.AddToCartAsync(user.Id, variant.Id, 2);

        var cart = await new GetCartHandler(_f.Db).Handle(new GetCartQuery(user.Id), default);
        Assert.Equal(40m, cart.Subtotal);
        Assert.Equal(2, cart.ItemCount);
        Assert.Single(cart.Items);
    }
}
