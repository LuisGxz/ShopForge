using ShopForge.Domain.Enums;
using ShopForge.Domain.Exceptions;

namespace ShopForge.Domain.Entities;

/// <summary>Order aggregate root. Owns its line snapshots, money math and status lifecycle.</summary>
public class Order
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public required string OrderNumber { get; init; }   // e.g. "EMB-2A4F9C"
    public required Guid UserId { get; init; }
    public required string ContactEmail { get; init; }
    public OrderStatus Status { get; private set; } = OrderStatus.PendingPayment;

    public ShippingAddress ShippingAddress { get; set; } = null!;

    public decimal Subtotal { get; private set; }
    public decimal ShippingCost { get; private set; }
    public decimal DiscountAmount { get; private set; }
    public decimal Total { get; private set; }
    public string? CouponCode { get; private set; }

    public string? StripePaymentIntentId { get; set; }

    public DateTime PlacedAtUtc { get; init; } = DateTime.UtcNow;
    public DateTime? PaidAtUtc { get; private set; }
    public DateTime? CancelledAtUtc { get; private set; }
    public byte[] RowVersion { get; init; } = [];

    public ICollection<OrderItem> Items { get; init; } = [];

    public void SetTotals(decimal shippingCost, decimal discountAmount, string? couponCode)
    {
        Subtotal = Math.Round(Items.Sum(i => i.LineTotal), 2, MidpointRounding.AwayFromZero);
        ShippingCost = Math.Round(shippingCost, 2, MidpointRounding.AwayFromZero);
        DiscountAmount = Math.Round(Math.Min(discountAmount, Subtotal), 2, MidpointRounding.AwayFromZero);
        CouponCode = couponCode;
        Total = Math.Round(Subtotal + ShippingCost - DiscountAmount, 2, MidpointRounding.AwayFromZero);
        if (Total < 0) Total = 0;
    }

    public void MarkPaid(DateTime nowUtc)
    {
        if (Status != OrderStatus.PendingPayment)
            throw new DomainException($"Only orders awaiting payment can be marked paid (was {Status}).");
        Status = OrderStatus.Paid;
        PaidAtUtc = nowUtc;
    }

    /// <summary>Admin fulfilment progression: Paid → Processing → Shipped → Delivered.</summary>
    public void AdvanceTo(OrderStatus next)
    {
        var allowed = Status switch
        {
            OrderStatus.Paid => next == OrderStatus.Processing,
            OrderStatus.Processing => next == OrderStatus.Shipped,
            OrderStatus.Shipped => next == OrderStatus.Delivered,
            _ => false
        };
        if (!allowed)
            throw new DomainException($"Cannot move an order from {Status} to {next}.");
        Status = next;
    }

    public void Cancel(DateTime nowUtc)
    {
        if (Status is OrderStatus.Shipped or OrderStatus.Delivered or OrderStatus.Cancelled)
            throw new DomainException($"A {Status} order cannot be cancelled.");
        Status = OrderStatus.Cancelled;
        CancelledAtUtc = nowUtc;
    }
}
