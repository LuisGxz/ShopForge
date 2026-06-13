import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'sf-home',
  imports: [RouterLink, IconComponent],
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
  `
})
export class HomeComponent {
  private readonly lang = inject(LanguageService);
  protected readonly isEs = this.lang.isEs;
}
