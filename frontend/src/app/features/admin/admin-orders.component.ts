import { CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { STATUS_BADGE } from '../../core/i18n';
import { LanguageService } from '../../core/language.service';
import { AdminOrderListItem } from '../../core/models';
import { ToastService } from '../../core/toast.service';
import { IconComponent } from '../../shared/icon.component';

const STATUSES = ['PendingPayment', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
const ADVANCEABLE = new Set(['Paid', 'Processing', 'Shipped']);
const CANCELLABLE = new Set(['PendingPayment', 'Paid', 'Processing']);

@Component({
  selector: 'sf-admin-orders',
  imports: [FormsModule, CurrencyPipe, DatePipe, IconComponent],
  template: `
    <div class="bar">
      <label class="flt">{{ t().admin.filterStatus }}
        <select [ngModel]="status()" (ngModelChange)="setStatus($event)">
          <option value="">{{ t().admin.allStatuses }}</option>
          @for (s of statuses; track s) { <option [value]="s">{{ lang.status(s) }}</option> }
        </select>
      </label>
    </div>

    @if (loading()) {
      @for (i of [1,2,3,4]; track i) { <div class="skeleton sk-row"></div> }
    } @else if (rows().length === 0) {
      <p class="muted empty">{{ t().admin.noOrders }}</p>
    } @else {
      <div class="table card">
        <div class="thead">
          <span>{{ t().admin.orderCustomer }}</span><span class="hide-sm">{{ t().account.dateCol }}</span>
          <span>{{ t().admin.orderTotal }}</span><span>{{ t().admin.orderStatus }}</span><span></span>
        </div>
        @for (o of rows(); track o.orderNumber) {
          <div class="trow">
            <span class="cust"><span class="num onum">{{ o.orderNumber }}</span><span class="muted email">{{ o.contactEmail }}</span></span>
            <span class="hide-sm muted">{{ o.placedAtUtc | date:'MMM d':undefined:lang.dateLocale() }}</span>
            <span class="num">{{ o.total | currency }}</span>
            <span><span class="badge" [class]="badge(o.status)">{{ lang.status(o.status) }}</span></span>
            <span class="acts">
              @if (canAdvance(o.status)) {
                <button class="ic-btn" (click)="advance(o)" [disabled]="busy() === o.orderNumber" [title]="t().admin.advance" [attr.aria-label]="t().admin.advance"><sf-icon name="arrow-up-right" [size]="15" /></button>
              }
              @if (canCancel(o.status)) {
                <button class="ic-btn danger" (click)="cancel(o)" [disabled]="busy() === o.orderNumber" [title]="t().admin.cancel" [attr.aria-label]="t().admin.cancel"><sf-icon name="x" [size]="15" /></button>
              }
            </span>
          </div>
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
  `,
  styles: `
    .bar { margin-bottom: 1.25rem; }
    .flt { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 600; color: var(--bean-500); }
    .flt select { width: auto; border-radius: var(--radius-pill); padding-block: 0.5rem; }
    .table { overflow: hidden; }
    .thead, .trow { display: grid; grid-template-columns: 2fr 1fr 0.9fr 1.1fr 4rem; gap: 0.75rem; align-items: center; padding: 0.85rem 1.1rem; }
    .thead { background: var(--cream-100); font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--bean-500); font-weight: 700; }
    .trow { border-top: 1px solid var(--border); font-size: 0.9rem; }
    .cust { display: flex; flex-direction: column; min-width: 0; }
    .onum { font-weight: 700; } .email { font-size: 0.78rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .acts { display: flex; gap: 0.35rem; justify-content: flex-end; }
    .ic-btn { width: 1.9rem; height: 1.9rem; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); cursor: pointer; display: grid; place-items: center; color: var(--bean-700); transition: all 140ms ease; }
    .ic-btn:hover:not(:disabled) { border-color: var(--bean-900); color: var(--bean-900); }
    .ic-btn.danger:hover:not(:disabled) { border-color: var(--danger); color: var(--danger); }
    .ic-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .empty { padding: 2.5rem; text-align: center; }
    .pager { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; }
    .pg { display: inline-flex; align-items: center; gap: 0.3rem; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-pill); padding: 0.5rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.85rem; }
    .pg:disabled { opacity: 0.4; cursor: not-allowed; }
    .pg-info { font-size: 0.85rem; color: var(--bean-500); }
    .sk-row { height: 3.2rem; border-radius: var(--radius-card); margin-bottom: 0.6rem; }
    @media (max-width: 680px) { .thead, .trow { grid-template-columns: 2fr 0.9fr 1.1fr 4rem; } .hide-sm { display: none; } }
  `
})
export class AdminOrdersComponent {
  private readonly api = inject(ApiService);
  private readonly toast = inject(ToastService);
  protected readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;
  protected readonly statuses = STATUSES;

  protected readonly rows = signal<AdminOrderListItem[]>([]);
  protected readonly loading = signal(true);
  protected readonly status = signal('');
  protected readonly page = signal(1);
  protected readonly totalPages = signal(1);
  protected readonly busy = signal<string | null>(null);

  constructor() { void this.load(1); }

  protected async load(page: number) {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.api.adminOrders(this.status() || undefined, page));
      this.rows.set(res.items); this.page.set(res.page); this.totalPages.set(res.totalPages);
    } catch { this.toast.error(this.t().common.error); } finally { this.loading.set(false); }
  }

  protected setStatus(s: string) { this.status.set(s); void this.load(1); }

  protected canAdvance(s: string) { return ADVANCEABLE.has(s); }
  protected canCancel(s: string) { return CANCELLABLE.has(s); }
  protected badge(s: string) { return STATUS_BADGE[s] ?? 'badge-neutral'; }

  protected async advance(o: AdminOrderListItem) {
    if (!confirm(this.t().admin.advanceConfirm)) return;
    this.busy.set(o.orderNumber);
    try {
      const updated = await firstValueFrom(this.api.adminAdvanceOrder(o.orderNumber));
      this.patchStatus(o.orderNumber, updated.status);
    } catch { this.toast.error(this.t().common.error); } finally { this.busy.set(null); }
  }

  protected async cancel(o: AdminOrderListItem) {
    if (!confirm(this.t().admin.cancelConfirm)) return;
    this.busy.set(o.orderNumber);
    try {
      const updated = await firstValueFrom(this.api.adminCancelOrder(o.orderNumber));
      this.patchStatus(o.orderNumber, updated.status);
    } catch { this.toast.error(this.t().common.error); } finally { this.busy.set(null); }
  }

  private patchStatus(orderNumber: string, status: string) {
    if (this.status() && this.status() !== status) {
      this.rows.update(rows => rows.filter(r => r.orderNumber !== orderNumber));
    } else {
      this.rows.update(rows => rows.map(r => r.orderNumber === orderNumber ? { ...r, status } : r));
    }
    this.toast.success(this.lang.status(status));
  }
}
