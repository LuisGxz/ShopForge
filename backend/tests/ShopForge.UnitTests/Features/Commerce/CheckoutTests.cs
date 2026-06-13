using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Features.Checkout;
using ShopForge.Domain.Entities;
using ShopForge.Domain.Enums;
using ShopForge.Domain.Exceptions;

namespace ShopForge.UnitTests.Features.Commerce;

public class CheckoutTests
{
    private readonly CommerceFixture _f = new();

    private CreateCheckoutIntentHandler IntentHandler() => new(_f.Db, _f.Clock, _f.Gateway);
    private ConfirmCheckoutHandler ConfirmHandler() => new(_f.Db, _f.Gateway, _f.Finalizer);

    [Fact]
    public async Task Create_intent_builds_pending_order_with_flat_shipping_and_does_not_touch_stock()
    {
        var user = await _f.AddUserAsync();
        var variant = await _f.AddProductAsync(price: 21m, stock: 10);
        await _f.AddToCartAsync(user.Id, variant.Id, 2);                 // subtotal 42 -> under free-shipping threshold

        var result = await IntentHandler().Handle(
            new CreateCheckoutIntentCommand(user.Id, "buyer@test.dev", CommerceFixture.Address(), null), default);

        Assert.Equal(48.50m, result.Total);                              // 42 + 6.50 shipping
        Assert.StartsWith("EMB-", result.OrderNumber);
        Assert.NotEmpty(result.ClientSecret);

        var order = await _f.Db.Orders.Include(o => o.Items).FirstAsync();
        Assert.Equal(OrderStatus.PendingPayment, order.Status);
        Assert.Equal(42m, order.Subtotal);

        var freshVariant = await _f.Db.ProductVariants.FirstAsync(v => v.Id == variant.Id);
        Assert.Equal(10, freshVariant.StockQuantity);                    // not decremented yet
    }

    [Fact]
    public async Task Free_shipping_over_threshold()
    {
        var user = await _f.AddUserAsync();
        var variant = await _f.AddProductAsync(price: 35m, stock: 10);
        await _f.AddToCartAsync(user.Id, variant.Id, 2);                 // subtotal 70 -> free shipping

        var result = await IntentHandler().Handle(
            new CreateCheckoutIntentCommand(user.Id, "buyer@test.dev", CommerceFixture.Address(), null), default);

        Assert.Equal(70m, result.Total);
    }

    [Fact]
    public async Task Coupon_discount_is_applied_to_the_order()
    {
        var user = await _f.AddUserAsync();
        var variant = await _f.AddProductAsync(price: 20m, stock: 10);
        await _f.AddToCartAsync(user.Id, variant.Id, 2);                 // subtotal 40
        _f.Db.Coupons.Add(new Coupon { Code = "FRESHLOT", Description = "$5", Type = CouponType.FixedAmount, Value = 5m, MinSubtotal = 30m });
        await _f.Db.SaveChangesAsync();

        var result = await IntentHandler().Handle(
            new CreateCheckoutIntentCommand(user.Id, "buyer@test.dev", CommerceFixture.Address(), "freshlot"), default);

        // 40 - 5 discount = 35; under 60 so +6.50 shipping = 41.50
        Assert.Equal(41.50m, result.Total);
        var order = await _f.Db.Orders.FirstAsync();
        Assert.Equal(5m, order.DiscountAmount);
        Assert.Equal("FRESHLOT", order.CouponCode);
    }

    [Fact]
    public async Task Empty_cart_cannot_check_out()
    {
        var user = await _f.AddUserAsync();
        await Assert.ThrowsAsync<DomainException>(() => IntentHandler().Handle(
            new CreateCheckoutIntentCommand(user.Id, "buyer@test.dev", CommerceFixture.Address(), null), default));
    }

    [Fact]
    public async Task Confirm_finalizes_order_decrements_stock_redeems_coupon_and_clears_cart()
    {
        var user = await _f.AddUserAsync();
        var variant = await _f.AddProductAsync(price: 20m, stock: 10);
        await _f.AddToCartAsync(user.Id, variant.Id, 3);
        _f.Db.Coupons.Add(new Coupon { Code = "WELCOME10", Description = "10%", Type = CouponType.Percentage, Value = 10m, MinSubtotal = 25m });
        await _f.Db.SaveChangesAsync();

        var intent = await IntentHandler().Handle(
            new CreateCheckoutIntentCommand(user.Id, "buyer@test.dev", CommerceFixture.Address(), "WELCOME10"), default);

        var detail = await ConfirmHandler().Handle(new ConfirmCheckoutCommand(user.Id, intent.OrderNumber), default);

        Assert.Equal("Paid", detail.Status);
        Assert.Equal(7, (await _f.Db.ProductVariants.FirstAsync(v => v.Id == variant.Id)).StockQuantity);  // 10 - 3
        Assert.Equal(0, await _f.Db.CartItems.CountAsync());                                                 // cart cleared
        Assert.Equal(1, (await _f.Db.Coupons.FirstAsync()).TimesRedeemed);                                   // coupon redeemed
    }

    [Fact]
    public async Task Confirm_is_idempotent_and_does_not_decrement_twice()
    {
        var user = await _f.AddUserAsync();
        var variant = await _f.AddProductAsync(price: 20m, stock: 10);
        await _f.AddToCartAsync(user.Id, variant.Id, 3);
        var intent = await IntentHandler().Handle(
            new CreateCheckoutIntentCommand(user.Id, "buyer@test.dev", CommerceFixture.Address(), null), default);

        await ConfirmHandler().Handle(new ConfirmCheckoutCommand(user.Id, intent.OrderNumber), default);
        await ConfirmHandler().Handle(new ConfirmCheckoutCommand(user.Id, intent.OrderNumber), default);  // second time = no-op

        Assert.Equal(7, (await _f.Db.ProductVariants.FirstAsync(v => v.Id == variant.Id)).StockQuantity);
    }

    [Fact]
    public async Task Confirm_fails_when_payment_did_not_succeed()
    {
        var user = await _f.AddUserAsync();
        var variant = await _f.AddProductAsync(price: 20m, stock: 10);
        await _f.AddToCartAsync(user.Id, variant.Id, 1);
        var intent = await IntentHandler().Handle(
            new CreateCheckoutIntentCommand(user.Id, "buyer@test.dev", CommerceFixture.Address(), null), default);

        _f.Gateway.Succeeded = false;
        await Assert.ThrowsAsync<ConflictException>(() =>
            ConfirmHandler().Handle(new ConfirmCheckoutCommand(user.Id, intent.OrderNumber), default));

        Assert.Equal(OrderStatus.PendingPayment, (await _f.Db.Orders.FirstAsync()).Status);
    }
}
