import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { LanguageService } from '../../core/language.service';
import { DashboardDto } from '../../core/models';
import { IconComponent } from '../../shared/icon.component';

@Component({
  selector: 'sf-admin-dashboard',
  imports: [CurrencyPipe, DatePipe, IconComponent],
  template: `
    @if (loading()) {
      <div class="kpis">@for (i of [1,2,3,4]; track i) { <div class="skeleton sk-kpi"></div> }</div>
      <div class="skeleton sk-chart"></div>
    } @else if (error()) {
      <div class="state card"><sf-icon name="alert-triangle" [size]="26" /><p class="muted">{{ t().common.error }}</p><button class="btn btn-ghost btn-sm" (click)="load()">{{ t().common.retry }}</button></div>
    } @else if (data(); as d) {
      <div class="kpis">
        <div class="kpi card"><span class="ic"><sf-icon name="trending-up" [size]="18" /></span><p class="lbl">{{ t().admin.revenue }}</p><p class="val num">{{ d.totalRevenue | currency }}</p></div>
        <div class="kpi card"><span class="ic"><sf-icon name="package" [size]="18" /></span><p class="lbl">{{ t().admin.paidOrders }}</p><p class="val num">{{ d.paidOrders }}</p></div>
        <div class="kpi card"><span class="ic"><sf-icon name="bar-chart" [size]="18" /></span><p class="lbl">{{ t().admin.aov }}</p><p class="val num">{{ d.averageOrderValue | currency }}</p></div>
        <div class="kpi card"><span class="ic"><sf-icon name="inbox" [size]="18" /></span><p class="lbl">{{ t().admin.pending }}</p><p class="val num">{{ d.pendingOrders }}</p></div>
      </div>

      <div class="card chart">
        <h2 class="serif sec">{{ t().admin.salesByDay }}</h2>
        @if (d.salesByDay.length === 0) { <p class="muted small">—</p> }
        @else {
          <div class="bars">
            @for (s of d.salesByDay; track s.date) {
              <div class="bar-col" [title]="(s.date | date:'MMM d') + ' · ' + (s.revenue | currency)">
                <div class="bar" [style.height.%]="barPct(s.revenue)"></div>
                <span class="bx">{{ s.date | date:'d' }}</span>
              </div>
            }
          </div>
        }
      </div>

      <div class="cols">
        <div class="card panel">
          <h2 class="serif sec">{{ t().admin.topProducts }}</h2>
          @for (p of d.topProducts; track p.productName) {
            <div class="li"><span class="li-name">{{ p.productName }}</span><span class="li-meta muted num">{{ p.unitsSold }} {{ t().admin.unitsSold }} · {{ p.revenue | currency }}</span></div>
          } @empty { <p class="muted small">—</p> }
        </div>

        <div class="card panel">
          <h2 class="serif sec">{{ t().admin.ordersByStatus }}</h2>
          @for (s of d.ordersByStatus; track s.status) {
            <div class="li"><span class="badge badge-neutral">{{ lang.status(s.status) }}</span><span class="num">{{ s.count }}</span></div>
          } @empty { <p class="muted small">—</p> }
        </div>

        <div class="card panel">
          <h2 class="serif sec">{{ t().admin.lowStock }}</h2>
          @for (l of d.lowStock; track l.productName + l.variantSize) {
            <div class="li"><span class="li-name">{{ l.productName }} <span class="muted">· {{ l.variantSize }}</span></span><span class="badge" [class]="l.stockQuantity <= 3 ? 'badge-danger' : 'badge-warn'">{{ l.stockQuantity }}</span></div>
          } @empty { <p class="muted small">{{ t().admin.allGood }}</p> }
        </div>
      </div>
    }
  `,
  styles: `
    .kpis { display: grid; gap: 1rem; grid-template-columns: repeat(2, 1fr); margin-bottom: 1.5rem; }
    @media (min-width: 760px) { .kpis { grid-template-columns: repeat(4, 1fr); } }
    .kpi { padding: 1.1rem 1.25rem; }
    .kpi .ic { width: 2.1rem; height: 2.1rem; border-radius: var(--radius-pill); background: var(--copper-100); color: var(--copper-600); display: grid; place-items: center; margin-bottom: 0.6rem; }
    .kpi .lbl { font-size: 0.8rem; color: var(--bean-500); margin: 0; }
    .kpi .val { font-size: 1.5rem; font-weight: 700; margin: 0.15rem 0 0; }
    .sec { font-size: 1.2rem; margin-bottom: 1rem; }
    .chart { padding: 1.4rem; margin-bottom: 1.5rem; }
    .bars { display: flex; align-items: flex-end; gap: 0.4rem; height: 9rem; }
    .bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 0.35rem; height: 100%; justify-content: flex-end; }
    .bar { width: 100%; max-width: 2.5rem; min-height: 3px; background: linear-gradient(to top, var(--copper-600), var(--copper-400)); border-radius: 4px 4px 0 0; transition: height 400ms ease; }
    .bx { font-size: 0.68rem; color: var(--bean-400); }
    .cols { display: grid; gap: 1.25rem; grid-template-columns: 1fr; }
    @media (min-width: 820px) { .cols { grid-template-columns: repeat(3, 1fr); } }
    .panel { padding: 1.4rem; }
    .li { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.55rem 0; border-bottom: 1px solid var(--border); font-size: 0.9rem; }
    .li:last-child { border-bottom: none; }
    .li-name { font-weight: 600; }
    .li-meta { font-size: 0.8rem; }
    .small { font-size: 0.85rem; }
    .state { display: grid; place-items: center; gap: 0.75rem; padding: 3rem; color: var(--bean-500); }
    .sk-kpi { height: 6rem; border-radius: var(--radius-card); }
    .sk-chart { height: 12rem; border-radius: var(--radius-card); }
  `
})
export class DashboardComponent {
  private readonly api = inject(ApiService);
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;

  protected readonly data = signal<DashboardDto | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  private readonly maxRevenue = computed(() => Math.max(1, ...(this.data()?.salesByDay.map(s => s.revenue) ?? [1])));

  constructor() { void this.load(); }

  protected async load() {
    this.loading.set(true); this.error.set(false);
    try { this.data.set(await firstValueFrom(this.api.adminDashboard())); }
    catch { this.error.set(true); } finally { this.loading.set(false); }
  }

  protected barPct(revenue: number) { return Math.max(2, (revenue / this.maxRevenue()) * 100); }
}
