namespace ShopForge.Domain.Exceptions;

/// <summary>Raised when a business invariant is violated. Maps to HTTP 422.</summary>
public class DomainException(string message) : Exception(message);
