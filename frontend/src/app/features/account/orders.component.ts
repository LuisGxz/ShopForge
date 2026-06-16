import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { STATUS_BADGE } from '../../core/i18n';
import { LanguageService } from '../../core/language.service';
import { OrderListItem } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'sf-orders',
  imports: [RouterLink, CurrencyPipe, DatePipe, IconComponent],
  template: `
    <div class="container orders fade-in">
      <h1 class="serif">{{ t().account.ordersTitle }}</h1>

      @if (loading()) {
        <div class="list">@for (i of [1,2,3]; track i) { <div class="skeleton sk-row"></div> }</div>
      } @else if (error()) {
        <div class="state card"><sf-icon name="alert-triangle" [size]="26" /><p class="muted">{{ t().common.error }}</p><button class="btn btn-ghost btn-sm" (click)="load(page())">{{ t().common.retry }}</button></div>
      } @else if (orders().length === 0) {
        <div class="state card">
          <span class="mark"><sf-icon name="inbox" [size]="26" /></span>
          <h2 class="serif">{{ t().account.ordersEmpty }}</h2>
          <p class="muted">{{ t().account.ordersEmptyBody }}</p>
          <a routerLink="/shop" [queryParams]="{ category: 'coffee' }" class="btn btn-primary btn-sm">{{ t().cart.startShopping }}</a>
        </div>
      } @else {
        <div class="list">
          @for (o of orders(); track o.orderNumber) {
            <a [routerLink]="['/account/orders', o.orderNumber]" class="row card">
              <div class="ro-main">
                <span class="ro-num num">{{ o.orderNumber }}</span>
                <span class="ro-date muted">{{ o.placedAtUtc | date:'mediumDate':undefined:lang.dateLocale() }} · {{ o.itemCount }} {{ o.itemCount === 1 ? t().cart.item : t().cart.items }}</span>
              </div>
              <span class="badge" [class]="badge(o.status)">{{ lang.status(o.status) }}</span>
              <span class="ro-total num">{{ o.total | currency }}</span>
              <sf-icon name="chevron-right" [size]="18" />
            </a>
          }
        </div>
        @if (totalPages() > 1) {
          <nav class="pager">
            <button class="pg" [disabled]="page() <= 1" (click)="load(page() - 1)"><sf-icon name="chevron-left" [size]="16" /> {{ t().common.prev }}</button>
            <span class="pg-info num">{{ page() }} / {{ totalPages() }}</span>
            <button class="pg" [disabled]="page() >= totalPages()" (click)="load(page() + 1)">{{ t().common.next }} <sf-icon name="chevron-right" [size]="16" /></button>
          </nav>
        }
      }
    </div>
  `,
  styles: `
    .orders { padding-block: 2rem 4rem; }
    .orders > h1 { font-size: clamp(1.9rem, 4vw, 2.4rem); margin-bottom: 1.5rem; }
    .list { display: flex; flex-direction: column; gap: 0.85rem; }
    .row { display: grid; grid-template-columns: 1fr auto auto auto; gap: 1rem; align-items: center; padding: 1rem 1.25rem; transition: border-color 150ms ease, transform 120ms ease; }
    .row:hover { border-color: var(--border-strong); transform: translateX(2px); }
    .ro-main { display: flex; flex-direction: column; min-width: 0; }
    .ro-num { font-weight: 700; }
    .ro-date { font-size: 0.85rem; }
    .ro-total { font-weight: 700; }
    .row sf-icon { color: var(--bean-400); }
    .state { display: grid; place-items: center; gap: 0.75rem; text-align: center; padding: 3rem 1.5rem; }
    .state .mark { width: 3.25rem; height: 3.25rem; border-radius: var(--radius-pill); background: var(--cream-100); color: var(--copper-600); display: grid; place-items: center; }
    .state h2 { font-size: 1.5rem; }
    .sk-row { height: 4rem; border-radius: var(--radius-card); }
    .pager { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 2rem; }
    .pg { display: inline-flex; align-items: center; gap: 0.3rem; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-pill); padding: 0.5rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
    .pg:disabled { opacity: 0.4; cursor: not-allowed; }
    .pg-info { font-size: 0.85rem; color: var(--bean-500); }
    @media (max-width: 560px) {
      .row { grid-template-columns: 1fr auto; grid-template-areas: 'main total' 'badge badge'; }
      .ro-main { grid-area: main; } .ro-total { grid-area: total; } .badge { grid-area: badge; justify-self: start; }
      .row sf-icon { display: none; }
    }
  `
})
export class OrdersComponent {
  private readonly api = inject(ApiService);
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;

  protected readonly orders = signal<OrderListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);

  constructor() { void this.load(1); }

  protected async load(page: number) {
    this.loading.set(true); this.error.set(false);
    try {
      const res = await firstValueFrom(this.api.getOrders(page));
      this.orders.set(res.items); this.page.set(res.page); this.totalPages.set(res.totalPages);
    } catch { this.error.set(true); } finally { this.loading.set(false); }
  }

  protected badge(status: string) { return STATUS_BADGE[status] ?? 'badge-neutral'; }
}
