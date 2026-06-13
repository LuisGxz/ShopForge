using FluentValidation;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Domain.Exceptions;

namespace ShopForge.Api.Infrastructure;

/// <summary>Maps application/domain exceptions to RFC 7807 ProblemDetails responses.</summary>
public class GlobalExceptionHandler(IProblemDetailsService problemDetailsService, ILogger<GlobalExceptionHandler> logger)
    : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken ct)
    {
        var problem = exception switch
        {
            ValidationException ex => new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Validation failed",
                Extensions =
                {
                    ["errors"] = ex.Errors
                        .GroupBy(e => e.PropertyName)
                        .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())
                }
            },
            UnauthorizedException ex => new ProblemDetails { Status = StatusCodes.Status401Unauthorized, Title = "Unauthorized", Detail = ex.Message },
            NotFoundException ex => new ProblemDetails { Status = StatusCodes.Status404NotFound, Title = "Not found", Detail = ex.Message },
            ConflictException ex => new ProblemDetails { Status = StatusCodes.Status409Conflict, Title = "Conflict", Detail = ex.Message },
            DomainException ex => new ProblemDetails { Status = StatusCodes.Status422UnprocessableEntity, Title = "Business rule violated", Detail = ex.Message },
            _ => null
        };

        if (problem is null)
        {
            logger.LogError(exception, "Unhandled exception");
            problem = new ProblemDetails { Status = StatusCodes.Status500InternalServerError, Title = "An unexpected error occurred" };
        }

        httpContext.Response.StatusCode = problem.Status!.Value;
        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            ProblemDetails = problem,
            Exception = exception
        });
    }
}
