using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Application.Features.Orders;
using ShopForge.Domain.Enums;

namespace ShopForge.Application.Features.Checkout;

/// <summary>
/// Called by the client after Stripe.js confirms the card. The server independently verifies
/// the PaymentIntent really succeeded (so it can't be spoofed) and then finalizes the order.
/// Idempotent: confirming an already-paid order just returns it.
/// </summary>
public record ConfirmCheckoutCommand(Guid UserId, string OrderNumber) : IRequest<OrderDetailDto>;

public class ConfirmCheckoutHandler(IAppDbContext db, IPaymentGateway gateway, OrderFinalizer finalizer)
    : IRequestHandler<ConfirmCheckoutCommand, OrderDetailDto>
{
    public async Task<OrderDetailDto> Handle(ConfirmCheckoutCommand request, CancellationToken ct)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.OrderNumber == request.OrderNumber && o.UserId == request.UserId, ct)
            ?? throw new NotFoundException("Order", request.OrderNumber);

        if (order.Status == OrderStatus.Cancelled)
            throw new ConflictException("This order was cancelled.");

        if (order.Status == OrderStatus.PendingPayment)
        {
            if (order.StripePaymentIntentId is null ||
                !await gateway.IsPaymentSucceededAsync(order.StripePaymentIntentId, ct))
                throw new ConflictException("Payment has not been completed for this order.");

            await finalizer.FinalizeAsync(order, ct);
        }

        return OrderDetailDto.From(order);
    }
}
