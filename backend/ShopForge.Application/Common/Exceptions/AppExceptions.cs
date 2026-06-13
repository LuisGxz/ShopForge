namespace ShopForge.Application.Common.Exceptions;

/// <summary>Maps to 404.</summary>
public class NotFoundException(string entity, object key) : Exception($"{entity} '{key}' was not found.");

/// <summary>Maps to 401. Message is safe to expose to clients.</summary>
public class UnauthorizedException(string message) : Exception(message);

/// <summary>Maps to 409.</summary>
public class ConflictException(string message) : Exception(message);
