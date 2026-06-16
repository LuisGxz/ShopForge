import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'sf-admin',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent],
  template: `
    <div class="container admin">
      <header class="admin-head">
        <span class="mark"><sf-icon name="layout" [size]="18" /></span>
        <h1 class="serif">{{ t().admin.title }}</h1>
      </header>
      <nav class="tabs">
        <a routerLink="/admin" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }"><sf-icon name="bar-chart" [size]="16" /> {{ t().admin.navDashboard }}</a>
        <a routerLink="/admin/products" routerLinkActive="on"><sf-icon name="coffee" [size]="16" /> {{ t().admin.navProducts }}</a>
        <a routerLink="/admin/orders" routerLinkActive="on"><sf-icon name="package" [size]="16" /> {{ t().admin.navOrders }}</a>
      </nav>
      <router-outlet />
    </div>
  `,
  styles: `
    .admin { padding-block: 2rem 4rem; }
    .admin-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; }
    .admin-head .mark { width: 2.25rem; height: 2.25rem; border-radius: var(--radius-pill); background: var(--bean-900); color: var(--copper-400); display: grid; place-items: center; }
    .admin-head h1 { font-size: clamp(1.7rem, 3.5vw, 2.2rem); }
    .tabs { display: flex; gap: 0.5rem; border-bottom: 1px solid var(--border); margin-bottom: 1.75rem; overflow-x: auto; }
    .tabs a { display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.65rem 0.9rem; font-weight: 600; font-size: 0.9rem; color: var(--bean-500); border-bottom: 2px solid transparent; white-space: nowrap; transition: color 150ms ease, border-color 150ms ease; }
    .tabs a:hover { color: var(--bean-900); }
    .tabs a.on { color: var(--bean-900); border-bottom-color: var(--copper-600); }
  `
})
export class AdminLayoutComponent {
  private readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;
}
