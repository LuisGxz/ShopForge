using ShopForge.Domain.Enums;
using ShopForge.Domain.Exceptions;

namespace ShopForge.Domain.Entities;

/// <summary>A promo code applied at checkout. Validation and discount math live here.</summary>
public class Coupon
{
    public int Id { get; init; }
    public required string Code { get; init; }          // stored upper-cased
    public required string Description { get; init; }
    public CouponType Type { get; init; }
    public decimal Value { get; init; }                 // percentage points (0..100) or fixed amount
    public decimal MinSubtotal { get; init; }
    public bool IsActive { get; set; } = true;
    public DateTime? ExpiresAtUtc { get; init; }
    public int? MaxRedemptions { get; init; }
    public int TimesRedeemed { get; private set; }

    public bool CanBeApplied(decimal subtotal, DateTime nowUtc, out string? reason)
    {
        if (!IsActive) { reason = "This code is no longer active."; return false; }
        if (ExpiresAtUtc is not null && ExpiresAtUtc <= nowUtc) { reason = "This code has expired."; return false; }
        if (MaxRedemptions is not null && TimesRedeemed >= MaxRedemptions) { reason = "This code has reached its redemption limit."; return false; }
        if (subtotal < MinSubtotal) { reason = $"Spend at least {MinSubtotal:C} to use this code."; return false; }
        reason = null;
        return true;
    }

    /// <summary>Discount for a subtotal, never exceeding the subtotal itself.</summary>
    public decimal ComputeDiscount(decimal subtotal)
    {
        var raw = Type == CouponType.Percentage
            ? subtotal * (Value / 100m)
            : Value;
        return Math.Round(Math.Min(raw, subtotal), 2, MidpointRounding.AwayFromZero);
    }

    public void RegisterRedemption()
    {
        if (MaxRedemptions is not null && TimesRedeemed >= MaxRedemptions)
            throw new DomainException("Coupon redemption limit reached.");
        TimesRedeemed++;
    }
}
