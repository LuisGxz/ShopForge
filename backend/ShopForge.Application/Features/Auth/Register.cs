using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using ShopForge.Application.Common.Exceptions;
using ShopForge.Application.Common.Interfaces;
using ShopForge.Domain.Entities;

namespace ShopForge.Application.Features.Auth;

public record RegisterCommand(string Email, string Password, string FullName) : IRequest<AuthResponse>;

public class RegisterValidator : AbstractValidator<RegisterCommand>
{
    public RegisterValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.FullName).NotEmpty().MaximumLength(120);
        RuleFor(x => x.Password)
            .NotEmpty().MinimumLength(8).MaximumLength(128)
            .Matches("[A-Z]").WithMessage("Password must contain an uppercase letter.")
            .Matches("[a-z]").WithMessage("Password must contain a lowercase letter.")
            .Matches("[0-9]").WithMessage("Password must contain a digit.");
    }
}

public class RegisterHandler(IAppDbContext db, IPasswordHasherService hasher, AuthTokenIssuer tokenIssuer)
    : IRequestHandler<RegisterCommand, AuthResponse>
{
    public async Task<AuthResponse> Handle(RegisterCommand request, CancellationToken ct)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        if (await db.Users.AnyAsync(u => u.Email == email, ct))
            throw new ConflictException("An account with this email already exists.");

        var user = new User
        {
            Email = email,
            FullName = request.FullName.Trim(),
            PasswordHash = hasher.Hash(request.Password)
        };
        db.Users.Add(user);

        var response = tokenIssuer.Issue(user);
        await db.SaveChangesAsync(ct);
        return response;
    }
}
