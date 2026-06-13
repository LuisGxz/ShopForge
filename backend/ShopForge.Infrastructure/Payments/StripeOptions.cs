namespace ShopForge.Infrastructure.Payments;

public class StripeOptions
{
    public const string SectionName = "Stripe";

    public string PublishableKey { get; init; } = string.Empty;
    public string SecretKey { get; init; } = string.Empty;
    public string WebhookSecret { get; init; } = string.Empty;

    /// <summary>A real, usable Stripe secret key is present (not the placeholder).</summary>
    public bool IsConfigured =>
        !string.IsNullOrWhiteSpace(SecretKey) && SecretKey.StartsWith("sk_") && !SecretKey.Contains("replace_me");
}
