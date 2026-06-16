import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { ProductListItem } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';
import { ProductCardComponent } from '../../shared/product-card.component';

@Component({
  selector: 'sf-home',
  imports: [RouterLink, IconComponent, ProductCardComponent],
  template: `
    <section class="hero container">
      <div class="copy fade-in">
        <p class="eyebrow">{{ isEs() ? 'Cosecha de junio · Tueste fresco semanal' : 'June harvest · Roasted fresh weekly' }}</p>
        <h1 class="serif headline">{{ isEs() ? 'Café de origen, tostado a seis cuadras de tu taza.' : 'Single-origin coffee, roasted six blocks from your cup.' }}</h1>
        <p class="muted lead">{{ isEs()
          ? 'Lotes pequeños de fincas con las que trabajamos directamente. Tostamos los lunes; llega a tu puerta el miércoles.'
          : 'Small lots from farms we work with directly. Roasted on Mondays, on your doorstep by Wednesday.' }}</p>
        <div class="cta">
          <a routerLink="/shop" [queryParams]="{ category: 'coffee' }" class="btn btn-primary">{{ isEs() ? 'Comprar cafés' : 'Shop coffee' }} <sf-icon name="arrow-right" [size]="16" /></a>
          <a routerLink="/shop" [queryParams]="{ category: 'subscription' }" class="btn btn-ghost">{{ isEs() ? 'Arma tu suscripción' : 'Build a subscription' }}</a>
        </div>
      </div>
      <div class="art tone tone-copper" role="img" [attr.aria-label]="isEs() ? 'Café de filtro con luz de mañana' : 'Pour-over coffee in morning light'">
        <span class="art-label">pour-over · morning light</span>
      </div>
    </section>

    <section class="promo container">
      <div class="promo-item"><sf-icon name="flame" [size]="22" /><div><strong>{{ isEs() ? 'Tueste de lotes pequeños' : 'Small-batch roasting' }}</strong><p class="muted">{{ isEs() ? 'Cada lunes, nunca antes' : 'Every Monday, never before' }}</p></div></div>
      <div class="promo-item"><sf-icon name="package" [size]="22" /><div><strong>{{ isEs() ? 'Envío en 2 días' : '2-day shipping' }}</strong><p class="muted">{{ isEs() ? 'Gratis sobre $60' : 'Free over $60' }}</p></div></div>
      <div class="promo-item"><sf-icon name="shield" [size]="22" /><div><strong>{{ isEs() ? 'Comercio directo' : 'Direct trade' }}</strong><p class="muted">{{ isEs() ? 'Relaciones con cada finca' : 'Relationships at every farm' }}</p></div></div>
    </section>

    <section class="featured container">
      <div class="head">
        <div>
          <h2 class="serif">{{ t().home.featuredTitle }}</h2>
          <p class="muted sub">{{ t().home.featuredSub }}</p>
        </div>
        <a routerLink="/shop" [queryParams]="{ category: 'coffee' }" class="view-all">{{ t().home.viewAll }}</a>
      </div>

      @if (loading()) {
        <div class="grid">
          @for (i of [1,2,3,4]; track i) { <div class="sk"><div class="sk-art skeleton"></div><div class="sk-line skeleton"></div><div class="sk-line short skeleton"></div></div> }
        </div>
      } @else if (error()) {
        <div class="state"><p class="muted">{{ t().common.error }}</p><button class="btn btn-ghost btn-sm" (click)="reload()">{{ t().common.retry }}</button></div>
      } @else if (products().length === 0) {
        <p class="muted">{{ t().home.empty }}</p>
      } @else {
        <div class="grid">
          @for (p of products(); track p.id) { <sf-product-card [p]="p" /> }
        </div>
      }
    </section>
  `,
  styles: `
    .hero { display: grid; gap: 2.5rem; align-items: center; padding-block: 3rem 4rem; }
    @media (min-width: 900px) { .hero { grid-template-columns: 1fr 1fr; } }
    .headline { font-size: clamp(2.4rem, 5vw, 3.6rem); line-height: 1.05; margin: 1rem 0; }
    .lead { max-width: 30rem; font-size: 1.05rem; margin-bottom: 1.75rem; }
    .cta { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .art { border-radius: var(--radius-lg); aspect-ratio: 4/5; max-height: 30rem; }
    @media (min-width: 900px) { .art { aspect-ratio: auto; height: 30rem; } }
    .art-label { position: absolute; bottom: 0.6rem; left: 0.8rem; font-family: monospace; font-size: 0.65rem; color: rgba(255,255,255,0.8); letter-spacing: 0.05em; }
    .promo { display: grid; gap: 1rem; grid-template-columns: 1fr; padding-bottom: 1rem; }
    @media (min-width: 640px) { .promo { grid-template-columns: repeat(3, 1fr); } }
    .promo-item { display: flex; align-items: center; gap: 0.85rem; padding: 1.1rem 1.25rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-card); color: var(--copper-600); }
    .promo-item strong { display: block; color: var(--bean-900); font-size: 0.95rem; }
    .promo-item p { margin: 0.1rem 0 0; font-size: 0.85rem; }

    .featured { padding-block: 2.5rem 1rem; }
    .head { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
    .head h2 { font-size: clamp(1.7rem, 3vw, 2.1rem); }
    .head .sub { margin: 0.3rem 0 0; font-size: 0.9rem; }
    .view-all { color: var(--copper-600); font-weight: 600; font-size: 0.9rem; white-space: nowrap; }
    .view-all:hover { text-decoration: underline; }
    .grid { display: grid; gap: 1.25rem; grid-template-columns: 1fr; }
    @media (min-width: 560px) { .grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 920px) { .grid { grid-template-columns: repeat(4, 1fr); } }
    .sk-art { aspect-ratio: 4/5; border-radius: var(--radius-card); }
    .sk-line { height: 0.8rem; margin-top: 0.6rem; border-radius: 4px; }
    .sk-line.short { width: 55%; }
    .state { display: grid; place-items: center; gap: 0.75rem; padding: 2.5rem 0; }
  `
})
export class HomeComponent {
  private readonly api = inject(ApiService);
  private readonly lang = inject(LanguageService);
  protected readonly isEs = this.lang.isEs;
  protected readonly t = this.lang.t;

  protected readonly products = signal<ProductListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  constructor() { void this.reload(); }

  protected async reload() {
    this.loading.set(true); this.error.set(false);
    try {
      const res = await firstValueFrom(this.api.getProducts({ sort: 'featured', pageSize: 4, page: 1 }));
      this.products.set(res.items);
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }
}
