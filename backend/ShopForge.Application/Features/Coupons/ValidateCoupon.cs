using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Interfaces;

namespace ShopForge.Application.Features.Coupons;

public record CouponValidationResult(bool IsValid, string Code, decimal Discount, string Message);

public record ValidateCouponQuery(string Code, decimal Subtotal) : IRequest<CouponValidationResult>;

public class ValidateCouponValidator : AbstractValidator<ValidateCouponQuery>
{
    public ValidateCouponValidator()
    {
        RuleFor(x => x.Code).NotEmpty().MaximumLength(40);
        RuleFor(x => x.Subtotal).GreaterThanOrEqualTo(0);
    }
}

public class ValidateCouponHandler(IAppDbContext db, IClock clock) : IRequestHandler<ValidateCouponQuery, CouponValidationResult>
{
    public async Task<CouponValidationResult> Handle(ValidateCouponQuery request, CancellationToken ct)
    {
        var code = request.Code.Trim().ToUpperInvariant();
        var coupon = await db.Coupons.FirstOrDefaultAsync(c => c.Code == code, ct);

        if (coupon is null)
            return new CouponValidationResult(false, code, 0m, "That code isn't recognised.");

        if (!coupon.CanBeApplied(request.Subtotal, clock.UtcNow, out var reason))
            return new CouponValidationResult(false, code, 0m, reason!);

        var discount = coupon.ComputeDiscount(request.Subtotal);
        return new CouponValidationResult(true, code, discount, coupon.Description);
    }
}
