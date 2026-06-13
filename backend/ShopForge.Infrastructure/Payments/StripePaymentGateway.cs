using Microsoft.Extensions.Logging;
using Stripe;
using ShopForge.Application.Common.Interfaces;

namespace ShopForge.Infrastructure.Payments;

/// <summary>Real Stripe integration (test or live mode), used when a Stripe secret key is configured.</summary>
public class StripePaymentGateway : IPaymentGateway
{
    private readonly StripeOptions _options;
    private readonly ILogger<StripePaymentGateway> _logger;
    private readonly PaymentIntentService _intents = new();

    public StripePaymentGateway(StripeOptions options, ILogger<StripePaymentGateway> logger)
    {
        _options = options;
        _logger = logger;
        StripeConfiguration.ApiKey = options.SecretKey;
    }

    public bool IsLive => true;
    public string PublishableKey => _options.PublishableKey;

    public async Task<PaymentIntentResult> CreatePaymentIntentAsync(
        decimal amount, string currency, string orderNumber, string email, CancellationToken ct)
    {
        var intent = await _intents.CreateAsync(new PaymentIntentCreateOptions
        {
            Amount = (long)Math.Round(amount * 100m, MidpointRounding.AwayFromZero),
            Currency = currency.ToLowerInvariant(),
            ReceiptEmail = email,
            Metadata = new Dictionary<string, string> { ["orderNumber"] = orderNumber },
            AutomaticPaymentMethods = new PaymentIntentAutomaticPaymentMethodsOptions { Enabled = true }
        }, cancellationToken: ct);

        return new PaymentIntentResult(intent.Id, intent.ClientSecret);
    }

    public async Task<bool> IsPaymentSucceededAsync(string paymentIntentId, CancellationToken ct)
    {
        var intent = await _intents.GetAsync(paymentIntentId, cancellationToken: ct);
        return intent.Status == "succeeded";
    }

    public PaymentWebhookResult? ParseWebhook(string payload, string signatureHeader)
    {
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(payload, signatureHeader, _options.WebhookSecret);
            var intentId = (stripeEvent.Data.Object as PaymentIntent)?.Id;
            return new PaymentWebhookResult(stripeEvent.Type, intentId);
        }
        catch (StripeException ex)
        {
            _logger.LogWarning(ex, "Rejected an unverifiable Stripe webhook.");
            return null;
        }
    }
}
