import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { toneClass } from '../../core/catalog.util';
import { STATUS_BADGE } from '../../core/i18n';
import { LanguageService } from '../../core/language.service';
import { OrderDetail } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'sf-order-detail',
  imports: [RouterLink, CurrencyPipe, DatePipe, IconComponent],
  template: `
    <div class="container od fade-in">
      <a routerLink="/account/orders" class="back muted">{{ t().account.backToOrders }}</a>

      @if (loading()) {
        <div class="skeleton sk-head"></div><div class="skeleton sk-block"></div>
      } @else if (order(); as o) {
        <header class="od-head">
          <div>
            <h1 class="serif num">{{ o.orderNumber }}</h1>
            <p class="muted">{{ t().account.placedOn }} {{ o.placedAtUtc | date:'mediumDate':undefined:lang.dateLocale() }}
              @if (o.paidAtUtc) { · {{ t().account.paidOn }} {{ o.paidAtUtc | date:'mediumDate':undefined:lang.dateLocale() }} }</p>
          </div>
          <span class="badge" [class]="badge(o.status)">{{ lang.status(o.status) }}</span>
        </header>

        <div class="od-grid">
          <div class="card pad">
            <h2 class="serif sec">{{ t().account.itemsHeading }}</h2>
            <ul class="items">
              @for (it of o.items; track it.productSlug + it.variantSize + it.grind) {
                <li>
                  <a [routerLink]="['/product', it.productSlug]" class="thumb tone" [class]="toneClass(undefined)" [attr.aria-label]="it.productName"></a>
                  <div class="body">
                    <a [routerLink]="['/product', it.productSlug]" class="name">{{ it.productName }}</a>
                    <span class="meta muted">{{ it.variantSize }} · {{ lang.grind(it.grind) }} · ×{{ it.quantity }}</span>
                  </div>
                  <span class="num price">{{ it.lineTotal | currency }}</span>
                </li>
              }
            </ul>
            <dl class="totals">
              <div><dt>{{ t().common.subtotal }}</dt><dd class="num">{{ o.subtotal | currency }}</dd></div>
              <div><dt>{{ t().common.shipping }}</dt><dd class="num">{{ o.shippingCost === 0 ? t().common.free : (o.shippingCost | currency) }}</dd></div>
              @if (o.discountAmount > 0) { <div class="disc"><dt>{{ t().common.discount }} @if (o.couponCode) { · {{ o.couponCode }} }</dt><dd class="num">−{{ o.discountAmount | currency }}</dd></div> }
              <div class="grand"><dt>{{ t().common.total }}</dt><dd class="num">{{ o.total | currency }}</dd></div>
            </dl>
          </div>

          <aside class="card pad">
            <h2 class="serif sec">{{ t().account.shippingHeading }}</h2>
            <p class="addr">
              {{ o.shippingAddress.fullName }}<br>
              {{ o.shippingAddress.line1 }}@if (o.shippingAddress.line2) {, {{ o.shippingAddress.line2 }}}<br>
              {{ o.shippingAddress.city }}, {{ o.shippingAddress.state }} {{ o.shippingAddress.postalCode }}<br>
              {{ o.shippingAddress.country }}
            </p>
            <p class="muted small">{{ o.contactEmail }}</p>
            @if (o.shippingAddress.phone) { <p class="muted small">{{ o.shippingAddress.phone }}</p> }
          </aside>
        </div>
      } @else {
        <div class="state card"><sf-icon name="alert-triangle" [size]="26" /><p class="muted">{{ isEs() ? 'No encontramos ese pedido.' : "We couldn't find that order." }}</p></div>
      }
    </div>
  `,
  styles: `
    .od { padding-block: 2rem 4rem; }
    .back { display: inline-block; font-size: 0.85rem; margin-bottom: 1rem; }
    .back:hover { color: var(--copper-600); }
    .od-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .od-head h1 { font-size: clamp(1.6rem, 3.5vw, 2.1rem); }
    .od-head p { margin: 0.3rem 0 0; font-size: 0.88rem; }
    .od-grid { display: grid; gap: 1.5rem; align-items: start; }
    @media (min-width: 820px) { .od-grid { grid-template-columns: 1fr 18rem; } }
    .pad { padding: 1.4rem; }
    .sec { font-size: 1.2rem; margin-bottom: 1rem; }
    .items { list-style: none; margin: 0 0 1rem; padding: 0; display: flex; flex-direction: column; gap: 0.85rem; }
    .items li { display: flex; gap: 0.75rem; align-items: center; }
    .thumb { width: 3rem; height: 3rem; border-radius: var(--radius-sm); flex-shrink: 0; display: block; }
    .body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .name { font-weight: 600; font-size: 0.92rem; color: var(--bean-900); }
    .name:hover { color: var(--copper-600); }
    .meta { font-size: 0.8rem; }
    .price { font-weight: 600; }
    .totals { border-top: 1px solid var(--border); padding-top: 0.9rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .totals div { display: flex; justify-content: space-between; font-size: 0.92rem; }
    .totals dt { color: var(--bean-500); } .totals dd { margin: 0; font-weight: 600; }
    .totals .disc dd { color: var(--copper-600); }
    .grand { border-top: 1px solid var(--border); padding-top: 0.7rem; }
    .grand dt, .grand dd { font-size: 1.05rem; font-weight: 700; color: var(--bean-900); }
    .addr { line-height: 1.6; margin: 0 0 0.5rem; }
    .small { font-size: 0.85rem; margin: 0.2rem 0 0; }
    .state { display: grid; place-items: center; gap: 0.75rem; padding: 3rem; color: var(--bean-500); }
    .sk-head { height: 3rem; width: 50%; border-radius: 6px; margin-bottom: 1.5rem; }
    .sk-block { height: 18rem; border-radius: var(--radius-card); }
  `
})
export class OrderDetailComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;
  protected readonly isEs = this.lang.isEs;
  protected readonly toneClass = toneClass;

  protected readonly order = signal<OrderDetail | null>(null);
  protected readonly loading = signal(true);

  constructor() {
    const number = this.route.snapshot.paramMap.get('orderNumber') ?? '';
    void this.load(number);
  }

  private async load(number: string) {
    this.loading.set(true);
    try { this.order.set(await firstValueFrom(this.api.getOrder(number))); }
    catch { this.order.set(null); } finally { this.loading.set(false); }
  }

  protected badge(status: string) { return STATUS_BADGE[status] ?? 'badge-neutral'; }
}
