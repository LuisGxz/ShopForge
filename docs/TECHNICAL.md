# ShopForge — Technical deep-dive

ShopForge (*Emberline Roasters*) is a specialty-coffee storefront built end-to-end as a portfolio
piece. It pairs an editorial Angular storefront with a commerce backend that takes the money path
seriously: variant-level pricing, coupon validation, a transactional checkout and an admin console —
all enforced server-side and covered by tests.

This document is the engineering deep-dive. For the reviewer-facing summary see the in-app
[`/about`](https://luisgxz.github.io/ShopForge/about) page.

---

## 1. Scope

- Storefront: editorial home, catalog with URL-driven filters/search/sort and server-side pagination, product detail with variants, gallery and reviews.
- Cart with editable lines, coupon validation and a free-shipping threshold; a **guest cart in localStorage that merges into the account on login**.
- Three-step checkout (Shipping → Payment → Review) with Stripe Elements or a deterministic stub, ending in a transactional order and a receipt.
- Customer account (order history with snapshots, wishlist) and an admin console (sales dashboard, product/variant editor, order fulfilment inbox).
- JWT auth + rotating refresh + lockout + RBAC, bilingual EN/ES, a guided demo layer, 61 unit tests + Playwright E2E + CI, deployed on Azure + GitHub Pages.

---

## 2. Stack

| Layer | Choice |
|-------|--------|
| API | .NET 9 · Minimal API · Clean Architecture + service layer |
| Data | EF Core 9 · SQL Server (serverless on Azure) |
| Payments | Stripe (PaymentIntent + Elements + signed webhook) behind `IPaymentGateway`, deterministic stub fallback |
| App | Angular 20 standalone · signals · OnPush · hand-built SCSS (*Emberline*) |
| Auth | JWT (15 min) + rotating refresh (hashed) + PBKDF2 + RBAC |
| Tests | xUnit on EF Core InMemory (61) · Playwright E2E |
| Delivery | GitHub Actions CI · Azure App Service F1 · GitHub Pages |

---

## 3. Architecture

Clean Architecture with a service layer and a strict inward dependency rule. Dependencies point
inward: `Api → Application → Domain`, with `Infrastructure` implementing Application ports.

```
backend/
├── ShopForge.Domain/         13 entities that own their rules — zero dependencies
│   ├── Catalog (Category, Product, ProductVariant, ProductImage, Review)
│   ├── Ordering (Cart, CartItem, Order, OrderItem, Coupon)
│   └── Identity (User, RefreshToken)
├── ShopForge.Application/    one service per area + ports + DTOs + validation
│   ├── Catalog / Cart / Checkout / Orders / Admin / Auth services
│   └── Abstractions (IPaymentGateway, IClock, OrderFinalizer)
├── ShopForge.Infrastructure/ EF Core, JWT/PBKDF2, Stripe + Stub gateways, DevDataSeeder
└── ShopForge.Api/            Minimal-API endpoint groups, middleware, DI, Serilog
```

### Patterns

- **Domain state machines, not anemic rows.** `Order` moves `PendingPayment → Paid → Fulfilled / Cancelled`; an invalid transition throws in the domain and nothing persists. Cancelling a paid order restocks. `Cart.AddItem()` guards stock; `Coupon.ComputeDiscount()` validates window, minimum and usage.
- **Actor pattern.** Every Application service method takes an explicit `Actor` (user id + role). RBAC decisions are made in the service layer where they are unit-testable — never read ambiently from `HttpContext`.
- **Ports & adapters.** `IPaymentGateway` and `IClock` are Application ports; Infrastructure provides Stripe/Stub and a system clock. Tests run with fakes.
- **Transaction script for money.** `OrderFinalizer` wraps the entire post-payment mutation in one DB transaction.
- **Snapshot on write.** `OrderItem` copies the product name, variant label and unit price at purchase time, so a historical order never changes when the catalog does.

---

## 4. The commerce core

The differentiator is **getting checkout right**, not faking it.

```
client                       API                              domain / db
  │  POST /checkout/intent     │                                    │
  ├───────────────────────────►│  create Order(PendingPayment)      │
  │                            │  + reserve totals + PaymentIntent  │
  │  ◄── clientSecret / orderNo │                                    │
  │  (Stripe Elements or stub) │                                    │
  │  POST /checkout/confirm     │                                    │
  ├───────────────────────────►│  OrderFinalizer (one transaction): │
  │                            │   1. verify payment server-side    │
  │                            │   2. decrement variant stock       │
  │                            │   3. redeem coupon                 │
  │                            │   4. mark Order Paid               │
  │                            │   5. empty the cart                │
  │  ◄── order confirmation     │  commit — or roll the lot back     │
```

- **All-or-nothing.** Any failure inside `OrderFinalizer` rolls back every step — you never end up with decremented stock and an unpaid order, or a redeemed coupon and a failed charge.
- **Idempotent confirm.** Confirming an order that is already `Paid` returns the same confirmation instead of charging or decrementing a second time — safe against retries and the Stripe webhook racing the synchronous confirm.
- **Two payment paths, one port.** Real Stripe keys make the gateway a `StripePaymentGateway` (PaymentIntent + a signed `/checkout/webhook`). With no keys the `StubPaymentGateway` returns deterministic results, so the public demo exercises the full intent→confirm→finalize path without secrets.
- **Pricing lives on the variant.** A product has no price; each `ProductVariant` does. Totals, shipping (free at $60+, else a flat $6.50) and discounts are computed server-side and never trusted from the client.

---

## 5. Catalog & reviews

- **Filtering against the cheapest active variant.** Price filters and price sort resolve each product to its lowest active variant price, so a product surfaces correctly regardless of how many sizes it has.
- **The URL is the source of truth.** Category, roast, process, price, search, sort and page all live in query params; the catalog reads them, so a filtered view is shareable and survives refresh. Pagination and projection are server-side — list endpoints return the card shape, not full entities.
- **Reviews are earned.** One review per user per product (a second attempt returns `409`), allowed only after a verified purchase (checked against the user's paid orders). The product's aggregate rating is recomputed on write. One product is seeded without reviews to exercise the empty state.

---

## 6. Security

- **Access token** JWT, 15 min; **refresh token** rotating, stored only as a hash — each use revokes the previous one.
- **Account lockout** after 5 failed attempts; **PBKDF2** password hashing.
- **No account enumeration** — login returns the same message for an unknown email and a wrong password.
- **Rate limiting** on `/auth` (10/min) partitioned by client IP. `UseForwardedHeaders` is configured so behind the Azure gateway the limiter sees the real `X-Forwarded-For` client IP instead of collapsing every request into one shared bucket.
- **RBAC in the service layer** via the `Admin` policy and the Actor; a customer hitting `/admin/*` gets `403`, and order reads are scoped to the owner.
- Errors as **RFC 7807 ProblemDetails**; CORS locked to the Pages origin; secrets only in Azure app settings, never in the repo.

---

## 7. Data model notes

- **Variant-level pricing** — `Product` is descriptive; `ProductVariant` carries SKU, price and stock.
- **Order snapshots** — `OrderItem` denormalizes name/variant/price at purchase, decoupling historical orders from later catalog edits.
- **`Guid` keys are `ValueGeneratedNever`.** Without this, EF Core marks child entities added through a tracked parent as `Modified`, issuing a zero-row `UPDATE` instead of an `INSERT` when seeding (e.g. reviews under a tracked product). Declaring the keys explicitly fixes the seed.

---

## 8. Frontend

- **Angular 20 standalone + signals + OnPush.** Lazy route per page (verified chunk splitting).
- **Stores** — `CartStore`, `CheckoutStore`, `WishlistStore` hold signal state. The guest cart lives in localStorage and a merge `effect` folds it into the server cart on login (idempotent, construction-timing safe because the login screen renders outside the storefront shell).
- **Silent refresh** — an `authInterceptor` catches `401`, refreshes, and transparently retries; `provideAppInitializer` restores the session on boot so protected views don't flash a `401 → refresh`.
- **Stripe loaded dynamically** — Stripe.js is imported on demand and Elements mounts only when public keys are present; otherwise a presentational test card backs the stub.
- **Emberline design system** — hand-built SCSS tokens (cream/bean/copper, DM Serif Display + Work Sans), buttons/cards/chips/badges/skeletons, focus ring, `prefers-reduced-motion`. Blur-up gradient tones stand in for product imagery, so the storefront has zero image weight and no layout shift.
- **Guided demo** — a first-visit role-aware tour + a floating guide with demo accounts and a role badge (Guest / Customer / Admin), persisted in localStorage.

---

## 9. Internationalization

Bilingual EN/ES across every screen with a hand-written, typed copy object per language (no runtime
i18n framework). Enum labels (roast, process, order status, grind) map through the `LanguageService`,
which also drives date locale. The language choice is persisted.

---

## 10. Testing

- **61 unit tests** (xUnit, EF Core InMemory): domain rules (stock guards, coupon math, order transitions + restock on cancel, cart merge, account lockout) and application flows (checkout intent/confirm/idempotency, admin fulfilment, cart).
- **Playwright E2E**: guest browses → adds to cart → logs in (cart merges) → Stripe-stub checkout → confirmation → order appears in history → wishlist; plus the admin fulfilment path. Verified at 390 / 768 / 1280 with **zero console errors** (any `console.error`, including Angular `NG0xxx`, fails the run).
- **CI** on every push: backend build + tests, frontend production build.

---

## 11. Honest trade-offs

- **Stub payment gateway in the public demo.** A public storefront can't ship live Stripe secrets; the stub keeps the entire intent→confirm→finalize transaction exercised without keys. Real keys swap in by config alone.
- **Order lines are denormalized snapshots.** Costs a little storage to guarantee a customer's receipt never silently changes when a price or product name does.
- **In-process domain over a message bus.** A single storefront doesn't need eventual consistency; the transaction boundary is the `OrderFinalizer`. A real multi-service shop would publish `OrderPaid` and fan out fulfilment/email asynchronously.
- **Refresh token in `localStorage`.** XSS window accepted for an SPA demo; mitigated by 15-min access tokens + rotation. Production would prefer an httpOnly cookie with CSRF defense.
- **Free-tier infrastructure.** Azure F1 cold-starts and serverless SQL auto-pauses, so the first request after idle is slow; a keep-warm ping mitigates it. No Redis/CDN/queue — out of scope for a demo.

---

## 12. What I'd build next

- Move fulfilment + transactional email behind an `OrderPaid` domain event and a queue.
- Inventory reservations with expiry instead of decrement-at-confirm, to handle high-contention drops.
- Full-text search (or a search service) over the current `LIKE`-based catalog search.
- httpOnly refresh cookie + CSRF tokens; optional 2FA for admin.
- Real product photography with responsive `srcset` replacing the gradient placeholders.

---

## 13. Deployment

- **API** → Azure App Service (F1, Linux) in resource group `shopforge-rg`, with serverless SQL. App settings carry the connection string, JWT secret, CORS origin and `SeedDemoData`; secrets never live in the repo.
- **Storefront** → GitHub Pages via `deploy-pages.yml`. The workflow injects `window.SHOPFORGE_API_BASE` into `index.html` before `ng build`, builds with `--base-href /ShopForge/`, and copies `index.html → 404.html` for SPA fallback routing.
- A scheduled `keep-warm.yml` pings `/health` every 15 minutes (with retries) to soften cold starts.
