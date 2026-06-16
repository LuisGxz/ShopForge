import { CurrencyPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { CheckoutStore } from '../../core/checkout.store';
import { toneClass } from '../../core/catalog.util';
import { LanguageService } from '../../core/language.service';
import { OrderDetail } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'sf-confirmation',
  imports: [RouterLink, CurrencyPipe, IconComponent],
  template: `
    <div class="container confirm fade-in">
      @if (loading()) {
        <div class="state"><sf-icon name="flame" [size]="28" class="spin" /></div>
      } @else if (order(); as o) {
        <div class="hero">
          <span class="tick"><sf-icon name="check" [size]="34" /></span>
          <h1 class="serif">{{ t().confirmation.title }}</h1>
          <p class="muted">{{ t().confirmation.subtitle }}</p>
          <p class="order-no">{{ t().confirmation.orderNumber }}: <strong class="num">{{ o.orderNumber }}</strong></p>
          @if (o.contactEmail) { <p class="muted small">{{ t().confirmation.emailedTo }} {{ o.contactEmail }}</p> }
        </div>

        <div class="card receipt">
          <ul class="items">
            @for (it of o.items; track it.productSlug + it.variantSize + it.grind) {
              <li>
                <span class="thumb tone" [class]="toneClass(undefined)"></span>
                <span class="body">
                  <span class="name">{{ it.productName }}</span>
                  <span class="meta muted">{{ it.variantSize }} · {{ lang.grind(it.grind) }} · ×{{ it.quantity }}</span>
                </span>
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

        <div class="next card">
          <h2 class="serif">{{ t().confirmation.whatNext }}</h2>
          <p class="muted">{{ t().confirmation.nextBody }}</p>
        </div>

        <div class="actions">
          <a routerLink="/account/orders" class="btn btn-primary">{{ t().confirmation.viewOrders }}</a>
          <a routerLink="/shop" [queryParams]="{ category: 'coffee' }" class="btn btn-ghost">{{ t().confirmation.keepShopping }}</a>
        </div>
      } @else {
        <div class="state">
          <p class="muted">{{ t().common.error }}</p>
          <a routerLink="/account/orders" class="btn btn-ghost btn-sm">{{ t().confirmation.viewOrders }}</a>
        </div>
      }
    </div>
  `,
  styles: `
    .confirm { max-width: 40rem; margin-inline: auto; padding-block: 3rem 4rem; display: flex; flex-direction: column; gap: 1.25rem; }
    .state { display: grid; place-items: center; gap: 1rem; padding: 4rem 0; color: var(--copper-500); }
    .hero { text-align: center; }
    .tick { width: 4.5rem; height: 4.5rem; border-radius: var(--radius-pill); background: var(--leaf-soft); color: var(--leaf-600); display: grid; place-items: center; margin: 0 auto 1rem; animation: pop 360ms ease both; }
    @keyframes pop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.08); } 100% { transform: scale(1); opacity: 1; } }
    .hero h1 { font-size: clamp(1.9rem, 4vw, 2.5rem); }
    .order-no { margin-top: 0.85rem; font-size: 1rem; }
    .small { font-size: 0.85rem; }
    .receipt { padding: 1.4rem; }
    .items { list-style: none; margin: 0 0 1rem; padding: 0; display: flex; flex-direction: column; gap: 0.85rem; }
    .items li { display: flex; gap: 0.75rem; align-items: center; }
    .thumb { width: 3rem; height: 3rem; border-radius: var(--radius-sm); flex-shrink: 0; }
    .body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .name { font-weight: 600; font-size: 0.92rem; }
    .meta { font-size: 0.8rem; }
    .price { font-weight: 600; }
    .totals { border-top: 1px solid var(--border); padding-top: 0.9rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .totals div { display: flex; justify-content: space-between; font-size: 0.92rem; }
    .totals dt { color: var(--bean-500); } .totals dd { margin: 0; font-weight: 600; }
    .totals .disc dd { color: var(--copper-600); }
    .grand { border-top: 1px solid var(--border); padding-top: 0.7rem; margin-top: 0.2rem; }
    .grand dt, .grand dd { font-size: 1.05rem; font-weight: 700; color: var(--bean-900); }
    .next { padding: 1.4rem; } .next h2 { font-size: 1.3rem; margin-bottom: 0.5rem; }
    .actions { display: flex; gap: 0.75rem; flex-wrap: wrap; justify-content: center; }
  `
})
export class ConfirmationComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly store = inject(CheckoutStore);
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;
  protected readonly toneClass = toneClass;

  protected readonly order = signal<OrderDetail | null>(null);
  protected readonly loading = signal(true);

  constructor() {
    const number = this.route.snapshot.paramMap.get('orderNumber') ?? '';
    const cached = this.store.lastOrder();
    if (cached && cached.orderNumber === number) {
      this.order.set(cached); this.loading.set(false);
    } else {
      void this.fetch(number);
    }
  }

  private async fetch(number: string) {
    this.loading.set(true);
    try { this.order.set(await firstValueFrom(this.api.getOrder(number))); }
    catch { this.order.set(null); }
    finally { this.loading.set(false); }
  }
}
