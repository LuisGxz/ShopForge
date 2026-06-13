using ShopForge.Domain.Entities;
using ShopForge.Domain.Enums;
using ShopForge.Domain.Exceptions;

namespace ShopForge.UnitTests.Domain;

public class OrderTests
{
    private static readonly DateTime Now = new(2026, 6, 13, 12, 0, 0, DateTimeKind.Utc);

    private static Order OrderWithTwoLines()
    {
        var order = new Order { OrderNumber = "EMB-TEST01", UserId = Guid.NewGuid(), ContactEmail = "a@b.dev" };
        order.Items.Add(new OrderItem { ProductName = "La Esperanza", ProductSlug = "la-esperanza", VariantSize = "12 oz", Grind = "Whole bean", UnitPrice = 21m, Quantity = 1 });
        order.Items.Add(new OrderItem { ProductName = "Kiamabara AA", ProductSlug = "kiamabara-aa", VariantSize = "12 oz", Grind = "Filter", UnitPrice = 24m, Quantity = 1 });
        return order;
    }

    [Fact]
    public void SetTotals_computes_subtotal_shipping_discount_and_total()
    {
        var order = OrderWithTwoLines();
        order.SetTotals(shippingCost: 6.50m, discountAmount: 5m, couponCode: "FRESHLOT");

        Assert.Equal(45m, order.Subtotal);
        Assert.Equal(6.50m, order.ShippingCost);
        Assert.Equal(5m, order.DiscountAmount);
        Assert.Equal(46.50m, order.Total);
        Assert.Equal("FRESHLOT", order.CouponCode);
    }

    [Fact]
    public void Discount_is_capped_at_subtotal()
    {
        var order = OrderWithTwoLines();
        order.SetTotals(0m, discountAmount: 999m, couponCode: "BIG");
        Assert.Equal(45m, order.DiscountAmount);
        Assert.Equal(0m, order.Total);
    }

    [Fact]
    public void MarkPaid_transitions_from_pending_and_stamps_time()
    {
        var order = OrderWithTwoLines();
        order.MarkPaid(Now);
        Assert.Equal(OrderStatus.Paid, order.Status);
        Assert.Equal(Now, order.PaidAtUtc);
    }

    [Fact]
    public void MarkPaid_twice_throws()
    {
        var order = OrderWithTwoLines();
        order.MarkPaid(Now);
        Assert.Throws<DomainException>(() => order.MarkPaid(Now));
    }

    [Fact]
    public void Fulfilment_must_advance_in_order()
    {
        var order = OrderWithTwoLines();
        order.MarkPaid(Now);
        order.AdvanceTo(OrderStatus.Processing);
        order.AdvanceTo(OrderStatus.Shipped);
        order.AdvanceTo(OrderStatus.Delivered);
        Assert.Equal(OrderStatus.Delivered, order.Status);
    }

    [Fact]
    public void Skipping_a_fulfilment_step_throws()
    {
        var order = OrderWithTwoLines();
        order.MarkPaid(Now);
        Assert.Throws<DomainException>(() => order.AdvanceTo(OrderStatus.Shipped));
    }

    [Fact]
    public void Shipped_order_cannot_be_cancelled()
    {
        var order = OrderWithTwoLines();
        order.MarkPaid(Now);
        order.AdvanceTo(OrderStatus.Processing);
        order.AdvanceTo(OrderStatus.Shipped);
        Assert.Throws<DomainException>(() => order.Cancel(Now));
    }

    [Fact]
    public void Pending_order_can_be_cancelled()
    {
        var order = OrderWithTwoLines();
        order.Cancel(Now);
        Assert.Equal(OrderStatus.Cancelled, order.Status);
        Assert.Equal(Now, order.CancelledAtUtc);
    }
}
