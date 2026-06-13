using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Interfaces;

namespace ShopForge.Application.Features.Checkout;

/// <summary>
/// Production-grade payment confirmation path: Stripe calls this with a signed event.
/// On a verified payment_intent.succeeded we finalize the matching order (idempotent with
/// the client-side confirm path — whichever arrives first wins, the other is a no-op).
/// </summary>
public record HandleStripeWebhookCommand(string Payload, string Signature) : IRequest;

public class HandleStripeWebhookHandler(IAppDbContext db, IPaymentGateway gateway, OrderFinalizer finalizer)
    : IRequestHandler<HandleStripeWebhookCommand>
{
    public async Task Handle(HandleStripeWebhookCommand request, CancellationToken ct)
    {
        var result = gateway.ParseWebhook(request.Payload, request.Signature);
        if (result is null || result.EventType != "payment_intent.succeeded" || result.PaymentIntentId is null)
            return;

        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.StripePaymentIntentId == result.PaymentIntentId, ct);

        if (order is not null)
            await finalizer.FinalizeAsync(order, ct);
    }
}
