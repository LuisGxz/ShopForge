using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Domain.Entities;
using ShopForge.Domain.Enums;

namespace ShopForge.Application.Features.Checkout;

/// <summary>
/// Turns a paid PendingPayment order into a confirmed order, atomically:
/// decrements stock for every line, marks the order paid, redeems the coupon and
/// clears the buyer's cart — all inside one DB transaction. Idempotent per order.
/// </summary>
public class OrderFinalizer(IAppDbContext db, IClock clock)
{
    public async Task<bool> FinalizeAsync(Order order, CancellationToken ct)
    {
        if (order.Status != OrderStatus.PendingPayment)
            return false; // already finalized (or cancelled) — nothing to do

        await db.ExecuteInTransactionAsync(async innerCt =>
        {
            var variantIds = order.Items.Select(i => i.ProductVariantId).ToList();
            var variants = await db.ProductVariants
                .Where(v => variantIds.Contains(v.Id))
                .ToDictionaryAsync(v => v.Id, innerCt);

            foreach (var item in order.Items)
                if (variants.TryGetValue(item.ProductVariantId, out var variant))
                    variant.DecrementStock(item.Quantity);

            if (order.CouponCode is not null)
            {
                var coupon = await db.Coupons.FirstOrDefaultAsync(c => c.Code == order.CouponCode, innerCt);
                coupon?.RegisterRedemption();
            }

            order.MarkPaid(clock.UtcNow);

            // Empty the buyer's cart now that it has been ordered.
            var cart = await db.Carts.Include(c => c.Items).FirstOrDefaultAsync(c => c.UserId == order.UserId, innerCt);
            if (cart is not null && cart.Items.Count > 0)
                db.CartItems.RemoveRange(cart.Items);

            await db.SaveChangesAsync(innerCt);
        }, ct);

        return true;
    }
}
