# ShopForge — Emberline Roasters

> Specialty-coffee e-commerce: catalog, cart, Stripe checkout, customer accounts and an admin panel.
> Angular (standalone + signals) · .NET 9 Clean Architecture · SQL Server · Stripe (test mode).

Flagship project #5 of [Luis Chiquito Vera's portfolio](https://github.com/LuisGxz). Quality bar: FinPulse.

## Status

Work in progress — see [`docs/PHASES.md`](docs/PHASES.md). **F1 (backend foundations) complete.**

## Stack

- **Frontend:** Angular 20 (standalone, signals), Tailwind CSS, Stripe.js — *(from F5)*
- **Backend:** .NET 9 Web API, Clean Architecture + vertical slices, MediatR, FluentValidation, EF Core
- **DB:** SQL Server (rich catalog, transactional checkout, optimistic concurrency on stock)
- **Payments:** Stripe (test mode) — PaymentIntent + Elements + signed webhook
- **Auth:** JWT + rotating refresh tokens + RBAC (Customer / Admin)

## Run locally

```bash
# DB: local SQL Server (Windows auth) or:  docker compose up -d
dotnet run --project backend/ShopForge.Api --urls http://localhost:5230
# the API migrates + seeds the demo catalog on startup (Development)
dotnet test backend/ShopForge.sln
```

## Architecture

```
backend/
├── ShopForge.Domain/         entities, enums, domain rules (stock, coupons, order totals & lifecycle)
├── ShopForge.Application/    use cases (MediatR), DTOs, validators, interfaces
├── ShopForge.Infrastructure/ EF Core, Identity/JWT, Stripe, seed
└── ShopForge.Api/            minimal-API endpoints, middleware, DI, Serilog
frontend/                     Angular standalone + signals + Tailwind  (from F5)
```

See [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) for the full data model, API surface and phase plan.
