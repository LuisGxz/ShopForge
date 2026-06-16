import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { CartDto, CartItemDto } from './models';

const GUEST_KEY = 'shopforge.guestCart';

/** Everything needed to render a line and replay it to the server after sign-in. */
export interface AddToCartInput {
  productVariantId: string; grind: string; quantity: number;
  productId: string; productSlug: string; productName: string;
  variantSize: string; unitPrice: number; imageUrl?: string; imageTone?: string; availableStock: number;
}

/**
 * Holds the active cart and keeps the header badge in sync.
 * Signed in → the server cart is the source of truth.
 * Signed out → a guest cart lives in localStorage and is merged into the server cart on sign-in (RF-04).
 */
@Injectable({ providedIn: 'root' })
export class CartStore {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  private readonly serverCart = signal<CartDto | null>(null);
  private readonly guestLines = signal<CartItemDto[]>(readGuestCart());
  readonly busy = signal(false);

  /** Unified view: server cart when authenticated, otherwise the synthesized guest cart. */
  readonly cart = computed<CartDto | null>(() => {
    if (this.auth.isAuthenticated()) return this.serverCart();
    const items = this.guestLines();
    if (items.length === 0) return { id: 'guest', items: [], subtotal: 0, itemCount: 0 };
    return {
      id: 'guest', items,
      subtotal: round(items.reduce((s, i) => s + i.lineTotal, 0)),
      itemCount: items.reduce((s, i) => s + i.quantity, 0)
    };
  });
  readonly count = computed(() => this.cart()?.itemCount ?? 0);
  readonly subtotal = computed(() => this.cart()?.subtotal ?? 0);

  constructor() {
    effect(() => {
      // Runs on construction and whenever the session appears/disappears. Merging is idempotent:
      // once the guest lines are replayed and cleared, later runs just (re)load the server cart.
      // This is construction-timing safe — the store is often first created *after* sign-in
      // (the login page renders outside the shell), so we can't rely on a false→true transition.
      if (this.auth.isAuthenticated()) {
        if (this.guestLines().length > 0) void this.mergeGuestThenLoad();
        else void this.load();
      } else {
        this.serverCart.set(null);
      }
    });
    // Persist the guest cart whenever it changes.
    effect(() => writeGuestCart(this.guestLines()));
  }

  async load(): Promise<void> {
    if (!this.auth.isAuthenticated()) return;
    try { this.serverCart.set(await firstValueFrom(this.api.getCart())); } catch { /* surfaced by callers */ }
  }

  async add(input: AddToCartInput): Promise<void> {
    const qty = clampQty(input.quantity);
    if (this.auth.isAuthenticated()) {
      this.serverCart.set(await firstValueFrom(this.api.addCartItem(
        { productVariantId: input.productVariantId, grind: input.grind, quantity: qty })));
      return;
    }
    this.guestLines.update(lines => {
      const id = guestId(input.productVariantId, input.grind);
      const existing = lines.find(l => l.id === id);
      if (existing) {
        const quantity = clampQty(existing.quantity + qty, input.availableStock);
        return lines.map(l => l.id === id ? withQty(l, quantity) : l);
      }
      const quantity = clampQty(qty, input.availableStock);
      return [...lines, toGuestLine(input, quantity)];
    });
  }

  async update(itemId: string, quantity: number): Promise<void> {
    const qty = clampQty(quantity);
    if (this.auth.isAuthenticated()) {
      this.serverCart.set(await firstValueFrom(this.api.updateCartItem(itemId, qty)));
      return;
    }
    this.guestLines.update(lines =>
      lines.map(l => l.id === itemId ? withQty(l, clampQty(qty, l.availableStock)) : l));
  }

  async remove(itemId: string): Promise<void> {
    if (this.auth.isAuthenticated()) {
      this.serverCart.set(await firstValueFrom(this.api.removeCartItem(itemId)));
      return;
    }
    this.guestLines.update(lines => lines.filter(l => l.id !== itemId));
  }

  /** Replays guest lines onto the server cart at sign-in, then loads the merged result. */
  private async mergeGuestThenLoad(): Promise<void> {
    const lines = this.guestLines();
    if (lines.length > 0) {
      this.busy.set(true);
      try {
        for (const l of lines)
          await firstValueFrom(this.api.addCartItem(
            { productVariantId: l.productVariantId, grind: l.grind, quantity: l.quantity }));
        this.guestLines.set([]);
      } catch { /* best effort — server cart still loads below */ }
      finally { this.busy.set(false); }
    }
    await this.load();
  }
}

function guestId(variantId: string, grind: string): string { return `${variantId}::${grind}`; }
function round(n: number): number { return Math.round(n * 100) / 100; }
function clampQty(n: number, stock = 20): number { return Math.max(1, Math.min(20, Math.min(stock || 20, Math.floor(n)))); }

function withQty(line: CartItemDto, quantity: number): CartItemDto {
  return { ...line, quantity, lineTotal: round(line.unitPrice * quantity) };
}

function toGuestLine(input: AddToCartInput, quantity: number): CartItemDto {
  return {
    id: guestId(input.productVariantId, input.grind),
    productVariantId: input.productVariantId, productId: input.productId, productSlug: input.productSlug,
    productName: input.productName, variantSize: input.variantSize, grind: input.grind,
    unitPrice: input.unitPrice, quantity, lineTotal: round(input.unitPrice * quantity),
    imageUrl: input.imageUrl, imageTone: input.imageTone, availableStock: input.availableStock
  };
}

function readGuestCart(): CartItemDto[] {
  try {
    const raw = localStorage.getItem(GUEST_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch { return []; }
}

function writeGuestCart(lines: CartItemDto[]): void {
  try {
    if (lines.length) localStorage.setItem(GUEST_KEY, JSON.stringify(lines));
    else localStorage.removeItem(GUEST_KEY);
  } catch { /* ignore */ }
}
