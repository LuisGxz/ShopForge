import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { IconComponent } from '../../shared/icon.component';

interface PatternRow { pattern: string; where: string; why: string; }

interface AboutCopy {
  title: string;
  leadHtml: string;
  tryDemo: string;
  sourceCode: string;
  demoCreds: string;
  scopeTitle: string;
  scope: string[];
  archTitle: string;
  archIntro: string;
  archBullets: string[];
  patternsTitle: string;
  patternsHead: [string, string, string];
  patterns: PatternRow[];
  authTitle: string;
  auth: string[];
  dataTitle: string;
  data: string[];
  catalogTitle: string;
  catalog: string[];
  payTitle: string;
  pay: string[];
  perfTitle: string;
  perf: string[];
  testTitle: string;
  test: string[];
  tradeTitle: string;
  trade: string[];
  deepDive: string;
  footer: string;
}

const EN: AboutCopy = {
  title: 'About this project',
  leadHtml: `ShopForge is a <strong>portfolio project</strong> built end-to-end by
    <a href="https://github.com/LuisGxz" target="_blank" rel="noreferrer">Luis Chiquito Vera</a> —
    a specialty-coffee storefront (<em>Emberline Roasters</em>) with a full commerce backend: catalog,
    cart, Stripe checkout, transactional orders and an admin console, engineered with production practices.
    This page is the technical summary for reviewers and interviewers.`,
  tryDemo: 'Try the live demo',
  sourceCode: 'Source code',
  demoCreds: 'Demo credentials:',
  scopeTitle: 'Scope',
  scope: [
    'Storefront: editorial home, catalog with URL-driven filters (category, roast, process, price), search, sort and server-side pagination',
    'Product detail with size/grind variants, gallery, quantity stepper, wishlist and verified-purchase reviews',
    'Cart with editable lines, coupon validation, free-shipping threshold — guest cart in localStorage that merges into the account on login',
    'Three-step checkout (Shipping → Payment → Review) with Stripe Elements, or a deterministic stub so the demo runs without keys',
    'Transactional order finalization: stock decremented, coupon redeemed, cart emptied, payment verified server-side — all-or-nothing',
    'Account: order history with line snapshots and shipping address · wishlist',
    'Admin console: sales dashboard (KPIs, chart, top products, low stock), product/variant editor, order fulfilment inbox',
    'Guided demo (role-aware tour + role badge), JWT auth + rotating refresh + lockout + RBAC, bilingual EN/ES, 61 unit tests + Playwright E2E + CI'
  ],
  archTitle: 'Architecture',
  archIntro: 'Clean Architecture with a service layer and a strict inward dependency rule — the Angular storefront talks to a thin Minimal-API surface over a rich domain:',
  archBullets: [
    '<strong>Domain</strong> — 13 entities that own their rules, not anemic rows: <code>Cart.AddItem()</code> guards stock, <code>Coupon.ComputeDiscount()</code> validates window and minimums, <code>Order</code> is a state machine (PendingPayment → Paid → Fulfilled / Cancelled) with restock on cancel. Zero dependencies.',
    '<strong>Application</strong> — one service per area (Catalog, Cart, Checkout, Orders, Admin, Auth) taking an explicit <code>Actor</code> for RBAC; ports (<code>IPaymentGateway</code>, <code>IClock</code>) implemented by Infrastructure; <code>OrderFinalizer</code> wraps the money path in a single transaction.',
    '<strong>Frontend</strong> — Angular 20 standalone with signals and a hand-built SCSS design system (<em>Emberline</em>); stores (<code>CartStore</code>, <code>CheckoutStore</code>, <code>WishlistStore</code>) hold state, an interceptor does silent refresh, guards gate checkout/account/admin.'
  ],
  patternsTitle: 'Design patterns',
  patternsHead: ['Pattern', 'Where', 'Why'],
  patterns: [
    { pattern: 'Actor pattern', where: 'Every Application service method', why: 'RBAC decisions are explicit and testable — never read from HttpContext' },
    { pattern: 'Domain state machine', where: 'Order / Cart / Coupon', why: 'Invalid transitions are unrepresentable; rules live with the data' },
    { pattern: 'Strategy (gateway)', where: 'IPaymentGateway: Stripe / Stub', why: 'The demo runs without Stripe keys; real keys swap in by config alone' },
    { pattern: 'Transaction script', where: 'OrderFinalizer', why: 'Stock, coupon, payment and cart move together or not at all — idempotent on retry' },
    { pattern: 'Snapshot on write', where: 'OrderItem (name/price/variant)', why: 'A past order never changes when the catalog does — historically accurate' },
    { pattern: 'Options pattern', where: 'JwtOptions', why: 'The app refuses to boot misconfigured' },
    { pattern: 'Interceptor + silent refresh', where: 'Angular authInterceptor', why: '401 → refresh → transparent retry; session survives expiry and F5' }
  ],
  authTitle: 'Authentication & security',
  auth: [
    '<strong>Access token</strong> JWT, 15 min · <strong>refresh token</strong> rotating, stored only as a hash — rotation revokes the old one on every use.',
    'Account lockout after 5 failed attempts · PBKDF2 password hashing · login returns the <em>same</em> message for unknown email and wrong password (no account enumeration).',
    'Per-client-IP rate limiting on <code>/auth</code> (10/min) — <code>UseForwardedHeaders</code> so the limiter sees the real client IP behind the Azure gateway, not one shared bucket.',
    '<strong>RBAC in the service layer</strong>: admin endpoints require the <code>Admin</code> policy; a customer hitting <code>/admin/*</code> gets <strong>403</strong>, and a user can only read their own orders.',
    'Errors as RFC 7807 ProblemDetails · CORS locked to the Pages origin · secrets only in Azure app settings, never in the repo.'
  ],
  dataTitle: 'Domain rules & order integrity',
  data: [
    '<strong>Checkout is all-or-nothing</strong> — <code>OrderFinalizer</code> verifies the payment server-side, then decrements stock, redeems the coupon and empties the cart inside one DB transaction; a failure rolls everything back.',
    '<strong>Idempotent confirm</strong> — confirming an already-paid order returns the same result instead of charging or decrementing twice.',
    '<strong>Reviews are earned</strong> — one per user per product (second attempt → 409), only after a verified purchase; the product rating is recomputed on write.',
    'Price lives on the <strong>variant</strong>, not the product · order lines are <strong>snapshots</strong> · Guid keys are <code>ValueGeneratedNever</code> so seeding writes children through tracked parents without phantom UPDATEs.'
  ],
  catalogTitle: 'Catalog & reviews',
  catalog: [
    'Search across name, tasting notes and origin · filters (category, roast, process, price) applied against each product’s <em>cheapest active variant</em>.',
    'Sort by featured / price / rating / newest, all server-side with real pagination — the URL is the source of truth, so filtered views are shareable and survive refresh.',
    'Detail returns variants ordered, a gallery and a paginated review feed with an empty state for the one product seeded without reviews.'
  ],
  payTitle: 'Checkout & payments',
  pay: [
    '<code>POST /checkout/intent</code> creates a <code>PendingPayment</code> order plus a PaymentIntent; <code>POST /checkout/confirm</code> verifies and finalizes; a signed Stripe <code>webhook</code> is the alternate path.',
    'The frontend loads Stripe.js dynamically and mounts Elements only when public keys are present — otherwise it shows a presentational test card backed by the deterministic stub gateway.',
    'Shipping is free at $60+, otherwise a flat $6.50; coupons validate window, minimum and usage before they touch the total.'
  ],
  perfTitle: 'Performance',
  perf: [
    'Lazy route per page (verified chunk splitting) · signals over zone-heavy state · OnPush throughout.',
    'Server-side pagination and projection — list endpoints never ship full entities, just the card shape the grid needs.',
    'Blur-up gradient tones stand in for product imagery, so the storefront has zero image-weight cost and no layout shift.'
  ],
  testTitle: 'Testing',
  test: [
    '<strong>61 unit tests</strong>: domain (stock guards, coupon math, order transitions + restock, cart merge, lockout) and application checkout/admin/cart flows on EF Core InMemory.',
    '<strong>Playwright E2E</strong>: guest browses → adds to cart → logs in (cart merges) → Stripe checkout → confirmation → sees the order in history → wishlist; plus the admin fulfilment path. Verified at 390 / 768 / 1280 with zero console errors.',
    'CI on every push: backend build + tests, frontend production build.'
  ],
  tradeTitle: 'Trade-offs (made consciously)',
  trade: [
    'Stub payment gateway behind the <code>IPaymentGateway</code> port — a public demo can’t ship live Stripe secrets, and the stub keeps the full intent→confirm→finalize path exercised without keys.',
    'Order lines are denormalized snapshots — costs a little storage to guarantee a customer’s receipt never silently changes when a price or name does.',
    'In-process domain over a message bus — a single storefront doesn’t need eventual consistency; the transaction boundary is the <code>OrderFinalizer</code>.',
    'Refresh token in <code>localStorage</code> — XSS window accepted for the SPA demo; mitigated by 15-min access tokens + rotation.'
  ],
  deepDive: 'Full deep-dive:',
  footer: 'Built by <a href="https://github.com/LuisGxz" target="_blank" rel="noreferrer">Luis Chiquito Vera</a> · Software Engineer · Guayaquil, Ecuador'
};

const ES: AboutCopy = {
  title: 'Sobre este proyecto',
  leadHtml: `ShopForge es un <strong>proyecto de portafolio</strong> construido de punta a punta por
    <a href="https://github.com/LuisGxz" target="_blank" rel="noreferrer">Luis Chiquito Vera</a> —
    una tienda de café de especialidad (<em>Emberline Roasters</em>) con un backend de comercio completo: catálogo,
    carrito, checkout con Stripe, órdenes transaccionales y consola de administración, desarrollada con prácticas de producción.
    Esta página es el resumen técnico para revisores y entrevistadores.`,
  tryDemo: 'Probar la demo',
  sourceCode: 'Código fuente',
  demoCreds: 'Credenciales de demo:',
  scopeTitle: 'Alcance',
  scope: [
    'Tienda: home editorial, catálogo con filtros en la URL (categoría, tueste, proceso, precio), búsqueda, orden y paginación server-side',
    'Detalle de producto con variantes de tamaño/molienda, galería, stepper de cantidad, wishlist y reseñas con compra verificada',
    'Carrito con líneas editables, validación de cupón, umbral de envío gratis — carrito de invitado en localStorage que se fusiona a la cuenta al iniciar sesión',
    'Checkout en 3 pasos (Envío → Pago → Revisar) con Stripe Elements, o un stub determinista para que la demo corra sin claves',
    'Finalización transaccional de la orden: descuenta stock, redime cupón, vacía el carrito, verifica el pago server-side — todo o nada',
    'Cuenta: historial de órdenes con snapshots de líneas y dirección de envío · wishlist',
    'Consola admin: dashboard de ventas (KPIs, gráfico, top productos, stock bajo), editor de productos/variantes, bandeja de fulfilment',
    'Demo guiada (tour por rol + role badge), auth JWT + refresh rotativo + bloqueo + RBAC, bilingüe EN/ES, 61 tests unitarios + E2E Playwright + CI'
  ],
  archTitle: 'Arquitectura',
  archIntro: 'Clean Architecture con capa de servicios y regla estricta de dependencias hacia adentro — la tienda Angular habla con una superficie Minimal-API delgada sobre un dominio rico:',
  archBullets: [
    '<strong>Domain</strong> — 13 entidades dueñas de sus reglas, no filas anémicas: <code>Cart.AddItem()</code> resguarda el stock, <code>Coupon.ComputeDiscount()</code> valida ventana y mínimos, <code>Order</code> es una máquina de estados (PendingPayment → Paid → Fulfilled / Cancelled) con restock al cancelar. Cero dependencias.',
    '<strong>Application</strong> — un servicio por área (Catalog, Cart, Checkout, Orders, Admin, Auth) que recibe un <code>Actor</code> explícito para RBAC; puertos (<code>IPaymentGateway</code>, <code>IClock</code>) implementados por Infrastructure; <code>OrderFinalizer</code> envuelve el flujo del dinero en una sola transacción.',
    '<strong>Frontend</strong> — Angular 20 standalone con signals y un sistema de diseño SCSS hecho a mano (<em>Emberline</em>); los stores (<code>CartStore</code>, <code>CheckoutStore</code>, <code>WishlistStore</code>) guardan el estado, un interceptor hace refresh silencioso, los guards protegen checkout/cuenta/admin.'
  ],
  patternsTitle: 'Patrones de diseño',
  patternsHead: ['Patrón', 'Dónde', 'Por qué'],
  patterns: [
    { pattern: 'Patrón Actor', where: 'Cada método de servicio de Application', why: 'Las decisiones RBAC son explícitas y testeables — nunca se lee de HttpContext' },
    { pattern: 'Máquina de estados de dominio', where: 'Order / Cart / Coupon', why: 'Las transiciones inválidas son irrepresentables; las reglas viven con los datos' },
    { pattern: 'Strategy (gateway)', where: 'IPaymentGateway: Stripe / Stub', why: 'La demo corre sin claves de Stripe; las reales entran solo por configuración' },
    { pattern: 'Transaction script', where: 'OrderFinalizer', why: 'Stock, cupón, pago y carrito se mueven juntos o nada — idempotente ante reintentos' },
    { pattern: 'Snapshot al escribir', where: 'OrderItem (nombre/precio/variante)', why: 'Una orden pasada no cambia cuando cambia el catálogo — históricamente exacta' },
    { pattern: 'Patrón Options', where: 'JwtOptions', why: 'La app se niega a arrancar mal configurada' },
    { pattern: 'Interceptor + renovación silenciosa', where: 'authInterceptor de Angular', why: '401 → refresh → reintento transparente; la sesión sobrevive a la expiración y a F5' }
  ],
  authTitle: 'Autenticación y seguridad',
  auth: [
    '<strong>Access token</strong> JWT de 15 min · <strong>refresh token</strong> rotativo, almacenado solo como hash — la rotación revoca el anterior en cada uso.',
    'Bloqueo de cuenta tras 5 intentos fallidos · hash de contraseñas PBKDF2 · el login devuelve el <em>mismo</em> mensaje para email inexistente y contraseña incorrecta (sin enumeración de cuentas).',
    'Rate limiting por IP real del cliente en <code>/auth</code> (10/min) — <code>UseForwardedHeaders</code> para que el limiter vea la IP real tras el gateway de Azure, no un único bucket compartido.',
    '<strong>RBAC en la capa de servicios</strong>: los endpoints admin exigen la policy <code>Admin</code>; un cliente que pega a <code>/admin/*</code> recibe <strong>403</strong>, y un usuario solo puede leer sus propias órdenes.',
    'Errores como ProblemDetails RFC 7807 · CORS restringido al origen de Pages · los secretos solo en app settings de Azure, nunca en el repo.'
  ],
  dataTitle: 'Reglas de dominio e integridad de órdenes',
  data: [
    '<strong>El checkout es todo-o-nada</strong> — <code>OrderFinalizer</code> verifica el pago server-side, luego descuenta stock, redime el cupón y vacía el carrito dentro de una sola transacción de BD; un fallo revierte todo.',
    '<strong>Confirm idempotente</strong> — confirmar una orden ya pagada devuelve el mismo resultado en vez de cobrar o descontar dos veces.',
    '<strong>Las reseñas se ganan</strong> — una por usuario por producto (segundo intento → 409), solo tras una compra verificada; el rating del producto se recalcula al escribir.',
    'El precio vive en la <strong>variante</strong>, no en el producto · las líneas de orden son <strong>snapshots</strong> · las claves Guid son <code>ValueGeneratedNever</code> para que el seed escriba hijos vía padres rastreados sin UPDATEs fantasma.'
  ],
  catalogTitle: 'Catálogo y reseñas',
  catalog: [
    'Búsqueda en nombre, notas de cata y origen · filtros (categoría, tueste, proceso, precio) aplicados sobre la <em>variante activa más barata</em> de cada producto.',
    'Orden por destacados / precio / rating / recientes, todo server-side con paginación real — la URL es la fuente de verdad, así las vistas filtradas son compartibles y sobreviven al refresh.',
    'El detalle devuelve las variantes ordenadas, una galería y un feed de reseñas paginado con empty state para el único producto sembrado sin reseñas.'
  ],
  payTitle: 'Checkout y pagos',
  pay: [
    '<code>POST /checkout/intent</code> crea una orden <code>PendingPayment</code> más un PaymentIntent; <code>POST /checkout/confirm</code> verifica y finaliza; un <code>webhook</code> firmado de Stripe es el camino alterno.',
    'El frontend carga Stripe.js dinámicamente y monta Elements solo cuando hay claves públicas — si no, muestra una tarjeta de prueba presentacional respaldada por el gateway stub determinista.',
    'El envío es gratis desde $60, si no una tarifa fija de $6.50; los cupones validan ventana, mínimo y uso antes de tocar el total.'
  ],
  perfTitle: 'Performance',
  perf: [
    'Ruta lazy por página (división de chunks verificada) · signals para el estado · OnPush en todo.',
    'Paginación y proyección server-side — los endpoints de listado nunca envían entidades completas, solo la forma de card que la grilla necesita.',
    'Tonos de gradiente blur-up en lugar de imágenes de producto, así la tienda tiene cero peso de imágenes y ningún layout shift.'
  ],
  testTitle: 'Testing',
  test: [
    '<strong>61 tests unitarios</strong>: dominio (resguardos de stock, matemática de cupones, transiciones de orden + restock, merge de carrito, bloqueo) y flujos de aplicación checkout/admin/cart sobre EF Core InMemory.',
    '<strong>E2E con Playwright</strong>: invitado navega → agrega al carrito → inicia sesión (el carrito se fusiona) → checkout Stripe → confirmación → ve la orden en el historial → wishlist; más el camino de fulfilment del admin. Verificado en 390 / 768 / 1280 con cero errores de consola.',
    'CI en cada push: build + tests del backend, build de producción del frontend.'
  ],
  tradeTitle: 'Decisiones de compromiso (conscientes)',
  trade: [
    'Gateway de pago stub tras el puerto <code>IPaymentGateway</code> — una demo pública no puede publicar secretos reales de Stripe, y el stub mantiene todo el camino intent→confirm→finalize ejercitado sin claves.',
    'Las líneas de orden son snapshots denormalizados — cuesta un poco de almacenamiento para garantizar que el recibo del cliente nunca cambie en silencio cuando cambia un precio o un nombre.',
    'Dominio en proceso en vez de un bus de mensajes — una sola tienda no necesita consistencia eventual; la frontera transaccional es el <code>OrderFinalizer</code>.',
    'Refresh token en <code>localStorage</code> — se acepta la ventana de XSS para esta demo SPA; mitigado con access tokens de 15 min + rotación.'
  ],
  deepDive: 'Análisis completo:',
  footer: 'Construido por <a href="https://github.com/LuisGxz" target="_blank" rel="noreferrer">Luis Chiquito Vera</a> · Software Engineer · Guayaquil, Ecuador'
};

@Component({
  selector: 'sf-about',
  imports: [RouterLink, IconComponent],
  template: `
    <article class="about container fade-in">
      <a routerLink="/" class="back"><sf-icon name="arrow-left" [size]="16" /> {{ isEs() ? 'Volver a la tienda' : 'Back to the store' }}</a>

      <header class="head">
        <span class="mark"><sf-icon name="flame" [size]="26" /></span>
        <h1 class="serif">{{ t().title }}</h1>
        <p class="lead muted" [innerHTML]="t().leadHtml"></p>

        <div class="chips">
          @for (s of stack; track s) { <span class="chip">{{ s }}</span> }
        </div>

        <div class="actions">
          <a href="https://luisgxz.github.io/ShopForge" target="_blank" rel="noreferrer" class="btn btn-primary">
            <sf-icon name="shopping-bag" [size]="16" /> {{ t().tryDemo }}
          </a>
          <a href="https://github.com/LuisGxz/ShopForge" target="_blank" rel="noreferrer" class="btn btn-ghost">
            <sf-icon name="arrow-up-right" [size]="16" /> {{ t().sourceCode }}
          </a>
        </div>

        <p class="creds"><strong>{{ t().demoCreds }}</strong>
          <code>admin&#64;shopforge.dev / Admin1234!</code> ·
          <code>demo&#64;shopforge.dev / Demo1234!</code>
        </p>
      </header>

      <section class="block">
        <h2 class="serif">{{ t().scopeTitle }}</h2>
        <ul class="ticks">
          @for (item of t().scope; track item) { <li><sf-icon name="check" [size]="15" /><span>{{ item }}</span></li> }
        </ul>
      </section>

      <section class="block">
        <h2 class="serif">{{ t().archTitle }}</h2>
        <p class="muted">{{ t().archIntro }}</p>
        <ul class="prose">
          @for (b of t().archBullets; track b) { <li [innerHTML]="b"></li> }
        </ul>
      </section>

      <section class="block">
        <h2 class="serif">{{ t().patternsTitle }}</h2>
        <div class="table-wrap card">
          <table class="patterns">
            <thead>
              <tr><th>{{ t().patternsHead[0] }}</th><th>{{ t().patternsHead[1] }}</th><th>{{ t().patternsHead[2] }}</th></tr>
            </thead>
            <tbody>
              @for (p of t().patterns; track p.pattern) {
                <tr><td><strong>{{ p.pattern }}</strong></td><td><code>{{ p.where }}</code></td><td class="muted">{{ p.why }}</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <div class="cols">
        <section class="block">
          <h2 class="serif"><sf-icon name="lock" [size]="20" /> {{ t().authTitle }}</h2>
          <ul class="prose"> @for (a of t().auth; track a) { <li [innerHTML]="a"></li> } </ul>
        </section>
        <section class="block">
          <h2 class="serif"><sf-icon name="shield" [size]="20" /> {{ t().dataTitle }}</h2>
          <ul class="prose"> @for (d of t().data; track d) { <li [innerHTML]="d"></li> } </ul>
        </section>
        <section class="block">
          <h2 class="serif"><sf-icon name="search" [size]="20" /> {{ t().catalogTitle }}</h2>
          <ul class="prose"> @for (c of t().catalog; track c) { <li [innerHTML]="c"></li> } </ul>
        </section>
        <section class="block">
          <h2 class="serif"><sf-icon name="credit-card" [size]="20" /> {{ t().payTitle }}</h2>
          <ul class="prose"> @for (p of t().pay; track p) { <li [innerHTML]="p"></li> } </ul>
        </section>
        <section class="block">
          <h2 class="serif"><sf-icon name="trending-up" [size]="20" /> {{ t().perfTitle }}</h2>
          <ul class="prose"> @for (p of t().perf; track p) { <li [innerHTML]="p"></li> } </ul>
        </section>
        <section class="block">
          <h2 class="serif"><sf-icon name="check" [size]="20" /> {{ t().testTitle }}</h2>
          <ul class="prose"> @for (x of t().test; track x) { <li [innerHTML]="x"></li> } </ul>
        </section>
      </div>

      <section class="block">
        <h2 class="serif">{{ t().tradeTitle }}</h2>
        <ul class="prose"> @for (x of t().trade; track x) { <li [innerHTML]="x"></li> } </ul>
      </section>

      <footer class="foot">
        <p class="deep muted">{{ t().deepDive }}
          <a href="https://github.com/LuisGxz/ShopForge/blob/master/docs/TECHNICAL.md" target="_blank" rel="noreferrer">docs/TECHNICAL.md</a>
        </p>
        <p class="sign muted" [innerHTML]="t().footer"></p>
      </footer>
    </article>
  `,
  styles: `
    .about { max-width: 60rem; padding-block: 2rem 4rem; }
    .back { display: inline-flex; align-items: center; gap: 0.4rem; color: var(--copper-600); font-weight: 600; font-size: 0.88rem; margin-bottom: 1.5rem; }
    .back:hover { text-decoration: underline; }

    .head { text-align: center; max-width: 44rem; margin-inline: auto; }
    .mark { width: 3.5rem; height: 3.5rem; border-radius: var(--radius-pill); background: var(--bean-900); color: var(--copper-400); display: inline-grid; place-items: center; margin-bottom: 0.75rem; }
    .head h1 { font-size: clamp(2rem, 4vw, 2.8rem); }
    .lead { font-size: 1.05rem; margin: 0.85rem auto 1.5rem; }
    .lead ::ng-deep a, .prose ::ng-deep a, .sign ::ng-deep a, .deep a { color: var(--copper-600); font-weight: 600; }
    .lead ::ng-deep a:hover { text-decoration: underline; }
    .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; justify-content: center; margin-bottom: 1.5rem; }
    .actions { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
    .creds { margin-top: 1.25rem; font-size: 0.85rem; }
    .creds code { background: var(--cream-100); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 0.2rem 0.5rem; font-size: 0.8rem; white-space: nowrap; }

    .block { margin-top: 3rem; }
    .block > h2 { display: flex; align-items: center; gap: 0.55rem; font-size: 1.5rem; margin-bottom: 1rem; }
    .block > h2 sf-icon { color: var(--copper-600); }

    .ticks { list-style: none; padding: 0; margin: 0; display: grid; gap: 0.7rem; }
    @media (min-width: 720px) { .ticks { grid-template-columns: 1fr 1fr; } }
    .ticks li { display: flex; gap: 0.6rem; align-items: flex-start; font-size: 0.92rem; }
    .ticks sf-icon { color: var(--leaf-600); margin-top: 0.15rem; flex-shrink: 0; }

    .prose { margin: 0; padding-left: 1.1rem; display: grid; gap: 0.8rem; }
    .prose li { font-size: 0.92rem; line-height: 1.6; }
    .prose ::ng-deep code, .creds code, .patterns ::ng-deep code, .patterns code { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 0.84em; color: var(--bean-700); }
    .prose ::ng-deep strong { color: var(--bean-900); }
    .lead ::ng-deep em, .prose ::ng-deep em { color: var(--bean-700); font-style: italic; }

    .table-wrap { overflow-x: auto; }
    .patterns { width: 100%; border-collapse: collapse; font-size: 0.88rem; min-width: 38rem; }
    .patterns th, .patterns td { text-align: left; padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); vertical-align: top; }
    .patterns thead th { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--copper-600); }
    .patterns tbody tr:last-child td { border-bottom: 0; }
    .patterns :global(code) { white-space: nowrap; }

    .cols { display: grid; gap: 0; }
    @media (min-width: 760px) { .cols { grid-template-columns: 1fr 1fr; column-gap: 2.5rem; } }

    .foot { margin-top: 3.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); text-align: center; }
    .deep { font-size: 0.9rem; margin-bottom: 0.5rem; }
    .deep a { font-weight: 600; }
    .deep a:hover, .sign ::ng-deep a:hover { text-decoration: underline; }
    .sign { font-size: 0.85rem; }
  `
})
export class AboutComponent {
  private readonly language = inject(LanguageService);
  protected readonly isEs = this.language.isEs;
  protected readonly t = computed<AboutCopy>(() => this.isEs() ? ES : EN);

  protected readonly stack = [
    'Angular 20 · Signals', '.NET 9 · Clean Architecture', 'EF Core 9', 'SQL Server',
    'Stripe', 'JWT + RBAC', 'SCSS', 'Playwright E2E', 'Azure'
  ];
}
