# ShopForge — Estado de fases

> Leer este archivo al iniciar sesión de trabajo. Detalle de cada fase en REQUIREMENTS.md §5.
> Vara de calidad: **FinPulse** (NO NEGOCIABLE — ver PORTFOLIO_PROJECTS.md §2 "Quality gate").

| Fase | Alcance | Estado |
|------|---------|--------|
| F1 | Fundaciones backend (solución, Domain, EF Core + migración, docker SQL, seed catálogo) | ✅ |
| F2 | Auth (JWT + refresh + lockout + RBAC), seed usuarios demo + reseñas | ⬜ |
| F3 | Catálogo y reseñas (listado con filtros/orden/paginación, detalle, reviews) | ⬜ |
| F4 | Carrito, checkout, Stripe, órdenes transaccionales, admin + dashboard | ⬜ |
| F5 | Frontend base (scaffold, tema Emberline, i18n, auth UI, shell, interceptores) | ⬜ |
| F6 | Frontend features (home, catálogo, detalle, carrito, checkout, cuenta, admin, demo guiada) | ⬜ |
| F7 | Pulido y entrega (/about, TECHNICAL, README, CI, deploy, E2E prod, card portfolio) | ⬜ |

## Log
- 2026-06-13 · Repo creado, requerimientos y arquitectura definidos (REQUIREMENTS.md).
- 2026-06-13 · **F1 ✅** Solución Clean Architecture (Domain/Application/Infrastructure/Api + tests), 13 entidades de dominio con lógica (stock, cupones, totales y transiciones de orden, lockout, merge de carrito), EF Core + configs + migración `InitialCreate`, docker-compose SQL Server, seed de catálogo realista (3 categorías, 16 productos, 42 variantes, 55 imágenes, 3 cupones). 25 tests de dominio verdes. Smoke test contra SQL Server local OK (migra + siembra + /health).

## Cómo correr (dev)
- DB: SQL Server local (Windows auth, connection string en `appsettings.Development.json`) — alternativa: `docker compose up -d` y apuntar la connection string al puerto 14333.
- API migra y siembra catálogo demo automáticamente al arrancar en Development.
- `dotnet run --project backend/ShopForge.Api --urls http://localhost:5230`
- Tests: `dotnet test backend/ShopForge.sln`
- Demo (desde F2): admin@shopforge.dev / Admin1234! · demo@shopforge.dev / Demo1234!
