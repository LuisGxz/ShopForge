namespace ShopForge.Application.Common.Interfaces;

public record PaymentIntentResult(string PaymentIntentId, string ClientSecret);

public record PaymentWebhookResult(string EventType, string? PaymentIntentId);

/// <summary>
/// Abstracts the payment processor. Backed by Stripe in production; a deterministic
/// stub is used when Stripe keys are not configured, so the demo always runs end-to-end.
/// </summary>
public interface IPaymentGateway
{
    /// <summary>True when a real Stripe key is configured; false for the local/demo stub.</summary>
    bool IsLive { get; }

    /// <summary>Publishable key for Stripe.js on the client (empty in stub mode).</summary>
    string PublishableKey { get; }

    Task<PaymentIntentResult> CreatePaymentIntentAsync(
        decimal amount, string currency, string orderNumber, string email, CancellationToken ct);

    /// <summary>Server-side verification that a payment actually succeeded (cannot be spoofed by the client).</summary>
    Task<bool> IsPaymentSucceededAsync(string paymentIntentId, CancellationToken ct);

    /// <summary>Parses and verifies a Stripe webhook payload. Returns null if it can't be verified.</summary>
    PaymentWebhookResult? ParseWebhook(string payload, string signatureHeader);
}
