using ShopForge.Application.Common.Interfaces;

namespace ShopForge.Infrastructure.Payments;

/// <summary>
/// Deterministic, keyless payment gateway used when Stripe is not configured.
/// It mints a fake PaymentIntent whose client secret encodes the intent id, and treats
/// every such intent as "succeeded" — so the full checkout flow works in the demo without
/// real Stripe credentials. The frontend renders a simulated card form in this mode.
/// </summary>
public class StubPaymentGateway : IPaymentGateway
{
    public bool IsLive => false;
    public string PublishableKey => string.Empty;

    public Task<PaymentIntentResult> CreatePaymentIntentAsync(
        decimal amount, string currency, string orderNumber, string email, CancellationToken ct)
    {
        var id = $"pi_stub_{orderNumber}";
        return Task.FromResult(new PaymentIntentResult(id, $"{id}_secret_demo"));
    }

    public Task<bool> IsPaymentSucceededAsync(string paymentIntentId, CancellationToken ct) =>
        Task.FromResult(paymentIntentId.StartsWith("pi_stub_"));

    public PaymentWebhookResult? ParseWebhook(string payload, string signatureHeader) => null;
}
