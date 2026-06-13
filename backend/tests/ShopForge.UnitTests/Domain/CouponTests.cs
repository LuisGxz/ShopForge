using ShopForge.Domain.Entities;
using ShopForge.Domain.Enums;

namespace ShopForge.UnitTests.Domain;

public class CouponTests
{
    private static readonly DateTime Now = new(2026, 6, 13, 12, 0, 0, DateTimeKind.Utc);

    [Fact]
    public void Percentage_discount_is_computed_and_rounded()
    {
        var coupon = new Coupon { Code = "WELCOME10", Description = "10%", Type = CouponType.Percentage, Value = 10m, MinSubtotal = 25m };
        Assert.Equal(4.55m, coupon.ComputeDiscount(45.50m));
    }

    [Fact]
    public void Fixed_discount_never_exceeds_subtotal()
    {
        var coupon = new Coupon { Code = "FRESHLOT", Description = "$5", Type = CouponType.FixedAmount, Value = 5m, MinSubtotal = 0m };
        Assert.Equal(3m, coupon.ComputeDiscount(3m));
        Assert.Equal(5m, coupon.ComputeDiscount(50m));
    }

    [Fact]
    public void Below_minimum_subtotal_is_rejected()
    {
        var coupon = new Coupon { Code = "FRESHLOT", Description = "$5", Type = CouponType.FixedAmount, Value = 5m, MinSubtotal = 30m };
        Assert.False(coupon.CanBeApplied(20m, Now, out var reason));
        Assert.NotNull(reason);
    }

    [Fact]
    public void Expired_coupon_is_rejected()
    {
        var coupon = new Coupon { Code = "OLD", Description = "x", Type = CouponType.FixedAmount, Value = 5m, MinSubtotal = 0m, ExpiresAtUtc = Now.AddDays(-1) };
        Assert.False(coupon.CanBeApplied(50m, Now, out _));
    }

    [Fact]
    public void Valid_coupon_is_accepted()
    {
        var coupon = new Coupon { Code = "FRESHLOT", Description = "$5", Type = CouponType.FixedAmount, Value = 5m, MinSubtotal = 30m };
        Assert.True(coupon.CanBeApplied(45m, Now, out var reason));
        Assert.Null(reason);
    }

    [Fact]
    public void Redemption_limit_blocks_further_use()
    {
        var coupon = new Coupon { Code = "ONCE", Description = "x", Type = CouponType.FixedAmount, Value = 5m, MinSubtotal = 0m, MaxRedemptions = 1 };
        coupon.RegisterRedemption();
        Assert.False(coupon.CanBeApplied(50m, Now, out _));
    }
}
