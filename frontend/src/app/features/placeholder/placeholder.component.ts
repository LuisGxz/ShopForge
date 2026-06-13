import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { IconComponent } from '../../shared/icon.component';

/**
 * Temporary on-brand stand-in for storefront sections built in the next phase (F6).
 * Keeps every nav destination reachable with an intentional empty state — no dead links.
 */
@Component({
  selector: 'sf-placeholder',
  imports: [RouterLink, IconComponent],
  template: `
    <section class="ph container fade-in">
      <span class="mark"><sf-icon name="flame" [size]="26" /></span>
      <h1 class="serif">{{ title }}</h1>
      <p class="muted">{{ isEs() ? 'Estamos terminando esta sección. Vuelve pronto.' : 'We’re putting this section together. Check back soon.' }}</p>
      <a routerLink="/" class="btn btn-ghost btn-sm">{{ isEs() ? '← Volver al inicio' : '← Back home' }}</a>
    </section>
  `,
  styles: `
    .ph { min-height: 50vh; display: grid; place-content: center; justify-items: center; text-align: center; gap: 0.75rem; padding-block: 4rem; }
    .mark { width: 3.5rem; height: 3.5rem; border-radius: var(--radius-pill); background: var(--bean-900); color: var(--copper-400); display: grid; place-items: center; margin-bottom: 0.5rem; }
    h1 { font-size: 2rem; }
    .btn { margin-top: 0.75rem; }
  `
})
export class PlaceholderComponent {
  private readonly lang = inject(LanguageService);
  private readonly route = inject(ActivatedRoute);
  protected readonly isEs = this.lang.isEs;
  protected get title(): string { return (this.route.snapshot.data['title'] as string) ?? 'Coming soon'; }
}
