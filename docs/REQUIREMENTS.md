# ShopForge — Requerimientos y Arquitectura

> Tienda de café de especialidad **Emberline Roasters**. Proyecto flagship #5 del portfolio (E-commerce).
> Stack: Angular (standalone + signals) · .NET 9 Web API (Clean Architecture) · SQL Server · Stripe (test) · JWT + RBAC.
> Diseño: `../../docs/portfolio-designs/05-shopforge.html` (cream/bean/copper, DM Serif Display + Work Sans, editorial/aspiracional).

---

## 1. Requerimientos funcionales

### RF-01 Autenticación y seguridad
- Registro con email + contraseña (hash vía ASP.NET Identity `PasswordHasher`).
- Login → access token JWT (15 min) + refresh token rotativo (7 días, persistido y revocable).
- Roles: `Customer`, `Admin` (RBAC en endpoints de administración).
- Lockout tras 5 intentos fallidos (15 min).

### RF-02 Catálogo
- Productos = cafés de origen, mezclas, equipos (brew gear) y suscripción, agrupados por categoría.
- Cada café tiene metadata de origen (región, altitud, tueste, proceso) y notas de cata.
- Listado paginado server-side con: búsqueda por texto, filtro por categoría / tueste / proceso, rango de precio, orden (destacados, precio, rating, novedad).
- Detalle por slug: galería, variantes de tamaño (12 oz / 2 lb / 5 lb) con precio y stock propios, selector de molienda, reseñas.
- Rating denormalizado (`AverageRating`, `ReviewCount`) recalculado al publicar reseña.

### RF-03 Reseñas
- Usuarios autenticados publican reseña (1–5★ + título + cuerpo) por producto.
- Marca de "compra verificada" si el usuario compró el producto.
- Listado paginado por producto; el rating del producto se recalcula al publicar.

### RF-04 Carrito
- Carrito **persistente por usuario** (un carrito por usuario). Líneas = variante + molienda + cantidad.
- Merge de líneas idénticas; máximo 20 por línea. Precio leído en vivo de la variante.
- Carrito de invitado en `localStorage`, fusionado al iniciar sesión.

### RF-05 Cupones
- Códigos promo: porcentaje o monto fijo, con mínimo de subtotal, expiración y límite de canjes.
- Validación y cálculo de descuento en el dominio (`Coupon`). Aplicación en checkout.

### RF-06 Checkout y pagos (Stripe test mode)
- Checkout en pasos: Envío → Pago → Confirmar.
- `PaymentIntent` de Stripe + Stripe Elements (tarjeta `4242…`). Webhook confirma el pago.
- Creación de orden **transaccional**: valida stock, decrementa stock de cada variante, registra cupón, persiste orden con snapshots de líneas — todo en una transacción de BD.
- Número de orden legible (`EMB-XXXXXX`). Estados: PendingPayment → Paid → Processing → Shipped → Delivered (+ Cancelled).

### RF-07 Cuenta del cliente
- Historial de órdenes con detalle y estado. Wishlist (favoritos) por usuario.

### RF-08 Panel de administración (rol Admin)
- CRUD de productos y variantes (precio, stock, activo/destacado).
- Bandeja de órdenes con filtros, avance de estado de fulfilment.
- Dashboard de ventas: ingresos, órdenes, ticket medio, top productos, ventas por día (gráfico), stock bajo.

### RF-09 Bilingüe e i18n
- App completa EN/ES (toggle persistido, auto-detección por `navigator.language`); catálogo con campos `*Es` y mapas de display para enums.

---

## 2. Modelo de datos (SQL Server)

```
User           (Id PK, Email UQ, PasswordHash, FullName, Role[Customer|Admin], FailedLoginCount, LockoutEndUtc?, CreatedAtUtc)
RefreshToken   (Id PK, UserId FK, TokenHash UQ, ExpiresAtUtc, RevokedAtUtc?, ReplacedByTokenHash?, CreatedAtUtc)
Category       (Id PK, Slug UQ, Name, NameEs?, Description, DescriptionEs?, SortOrder)
Product        (Id PK, Slug UQ, Name, CategoryId FK, Origin?, Region?, AltitudeMeters?, RoastLevel, Process,
                FlavorNotes, Description, HeroLabel?, IsFeatured, IsActive, AverageRating, ReviewCount, CreatedAtUtc)  [+ *Es]
ProductVariant (Id PK, ProductId FK, Size, Sku UQ, Price decimal(18,2), StockQuantity, SortOrder, RowVersion)
ProductImage   (Id PK, ProductId FK, Url, AltText, Tone, SortOrder)
Review         (Id PK, ProductId FK, UserId FK, AuthorName, Rating, Title?, Body, IsVerifiedPurchase, CreatedAtUtc)
Cart           (Id PK, UserId FK UQ, CreatedAtUtc, UpdatedAtUtc)
CartItem       (Id PK, CartId FK, ProductVariantId FK, Grind, Quantity)
Coupon         (Id PK, Code UQ, Description, Type[Percentage|FixedAmount], Value, MinSubtotal, IsActive, ExpiresAtUtc?, MaxRedemptions?, TimesRedeemed)
Order          (Id PK, OrderNumber UQ, UserId FK, ContactEmail, Status, ShippingAddress[owned], Subtotal, ShippingCost,
                DiscountAmount, Total, CouponCode?, StripePaymentIntentId?, PlacedAtUtc, PaidAtUtc?, CancelledAtUtc?, RowVersion)
OrderItem      (Id PK, OrderId FK, ProductId, ProductVariantId, ProductName, ProductSlug, ImageUrl?, VariantSize, Grind, UnitPrice, Quantity)  -- snapshots
WishlistItem   (Id PK, UserId FK, ProductId FK, CreatedAtUtc, UQ(UserId,ProductId))
```

Notas:
- **Precio en la variante**, no en el producto (12 oz / 2 lb / 5 lb cada una con precio y stock).
- `OrderItem` guarda **snapshots** del producto (nombre, slug, imagen, talla, precio) → las órdenes históricas no cambian si el catálogo cambia. Sin FK al catálogo a propósito.
- `Account/Order.RowVersion` (`rowversion` SQL Server) para concurrencia optimista en stock.
- Stock se decrementa dentro de la transacción de creación de orden; `ProductVariant.DecrementStock` valida disponibilidad.

---

## 3. API (prefijo `/api/v1`)

### Auth
| Método | Ruta | Descripción |
|---|---|---|
| POST | /auth/register | Crear cliente |
| POST | /auth/login | Login → tokens |
| POST | /auth/refresh | Rota refresh token |
| POST | /auth/logout | Revoca refresh token |
| GET  | /auth/me | Perfil actual |

### Catálogo (público)
| GET | /categories | Catálogo de categorías |
| GET | /products?search&category&roast&process&minPrice&maxPrice&sort&page&pageSize | Listado paginado |
| GET | /products/{slug} | Detalle + variantes + imágenes |
| GET | /products/{slug}/reviews?page | Reseñas paginadas |
| POST | /products/{slug}/reviews | Publicar reseña (auth) |

### Carrito / cupones / checkout (auth Customer)
| GET | /cart · POST /cart/items · PUT /cart/items/{id} · DELETE /cart/items/{id} | Carrito |
| POST | /coupons/validate | Valida código contra un subtotal |
| POST | /checkout/intent | Crea orden PendingPayment + Stripe PaymentIntent → clientSecret |
| POST | /checkout/webhook | Webhook de Stripe (payment_intent.succeeded → MarkPaid) |
| GET | /orders · GET /orders/{number} | Órdenes del usuario |
| GET/POST/DELETE | /wishlist | Favoritos |

### Admin (`Admin` role)
| GET/POST/PUT | /admin/products … | CRUD de productos y variantes |
| GET | /admin/orders?status&page · POST /admin/orders/{id}/advance | Bandeja y fulfilment |
| GET | /admin/dashboard | Métricas de ventas |

Convenciones: DTOs con FluentValidation, errores RFC 7807 (ProblemDetails con `errors` por campo), paginación `{ items, page, pageSize, totalCount }`, rate limiting en `/auth/*`.

---

## 4. Arquitectura

```
backend/
├── ShopForge.Domain/         entidades, enums, excepciones de dominio (stock, cupón, totales, transiciones de orden)
├── ShopForge.Application/    casos de uso (MediatR), DTOs, validadores, interfaces (IClock, IJwtTokenService, IPaymentGateway…)
├── ShopForge.Infrastructure/ EF Core (DbContext, configs, migraciones), Identity/JWT, Stripe, seed
└── ShopForge.Api/            endpoints (minimal APIs por feature), middleware, DI, Serilog
backend/tests/
└── ShopForge.UnitTests/      dominio + handlers críticos (checkout/stock, cupones, reviews, auth)
frontend/                     Angular standalone + signals + Tailwind + Stripe.js
docker-compose.yml            SQL Server 2022 (dev)
```

- **Patrón**: Clean Architecture + vertical slices dentro de Application (`Features/Checkout/CreateCheckoutIntent/…`).
- **Checkout**: handler ejecuta en `ExecuteInTransactionAsync` — valida + decrementa stock + registra cupón + persiste orden con snapshots, atómico.
- **Pagos**: `IPaymentGateway` (interfaz en Application) implementada por `StripePaymentGateway` (Infrastructure). Modo test, webhook firmado.
- **Frontend**: rutas lazy por feature (`catalog`, `product`, `cart`, `checkout`, `account`, `admin`, `auth`, `about`), interceptor JWT con auto-refresh, guard de auth + rol, store de carrito con signals, Stripe Elements.
- **Diseño**: cream/bean/copper, DM Serif Display + Work Sans, fotografía/gradiente protagonista, microinteracciones (hover en cards, animación "añadir al carrito"), modo claro elegante.

---

## 5. Fases (ver PHASES.md para estado)

1. **F1 — Fundaciones backend**: solución, Domain completo, EF Core + migración inicial, docker SQL, seed de catálogo (16 productos, 42 variantes, cupones), tests de dominio.
2. **F2 — Auth**: register/login/refresh/logout, JWT, lockout, RBAC, seed de usuarios demo + reseñas, tests de auth.
3. **F3 — Catálogo y reseñas**: endpoints de categorías/productos (búsqueda, filtros, orden, paginación), detalle, reseñas, tests.
4. **F4 — Carrito, checkout, Stripe, órdenes, admin**: carrito persistente, cupones, PaymentIntent + webhook, orden transaccional con stock, panel admin + dashboard.
5. **F5 — Frontend base**: scaffold Angular + Tailwind + tema Emberline, i18n EN/ES, auth UI, shell/header, interceptores, guards.
6. **F6 — Frontend features**: home, catálogo con filtros, detalle con variantes y reseñas, carrito, checkout en pasos con Stripe Elements, confirmación, cuenta/órdenes, wishlist, admin, capa de Demo Guiada (tour + role badge + demo guide), prerender SSG.
7. **F7 — Pulido y entrega**: /about bilingüe a paridad de FinPulse, TECHNICAL.md, README+capturas, CI verde, deploy (repo + Azure + Pages), E2E en producción, card en el portfolio.
