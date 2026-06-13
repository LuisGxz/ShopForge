import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CartStore } from '../core/cart.store';
import { LanguageService } from '../core/language.service';
import { IconComponent } from '../shared/icon.component';
import { LangToggleComponent } from '../shared/lang-toggle.component';

@Component({
  selector: 'sf-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent, LangToggleComponent],
  template: `
    <header class="hdr">
      <div class="container bar">
        <a routerLink="/" class="brand" aria-label="Emberline Roasters — home">
          <span class="mark"><sf-icon name="flame" [size]="18" /></span>
          <span class="serif name">Emberline</span>
        </a>

        <nav class="nav" [class.open]="menuOpen()">
          <a routerLink="/shop" [queryParams]="{ category: 'coffee' }" (click)="closeMenu()">{{ t().header.coffee }}</a>
          <a routerLink="/shop" [queryParams]="{ category: 'subscription' }" (click)="closeMenu()">{{ t().header.subscription }}</a>
          <a routerLink="/shop" [queryParams]="{ category: 'brew-gear' }" (click)="closeMenu()">{{ t().header.gear }}</a>
          <a routerLink="/about" routerLinkActive="active" (click)="closeMenu()">{{ t().header.about }}</a>
        </nav>

        <div class="actions">
          <sf-lang-toggle />

          @if (auth.isAuthenticated()) {
            <div class="menu-wrap">
              <button class="icon-btn user-btn" (click)="toggleUser()" [attr.aria-expanded]="userOpen()">
                <sf-icon name="user" [size]="18" />
                <span class="hide-sm">{{ firstName() }}</span>
                <sf-icon name="chevron-down" [size]="14" />
              </button>
              @if (userOpen()) {
                <div class="dropdown card" (mouseleave)="userOpen.set(false)">
                  <a routerLink="/account/orders" (click)="userOpen.set(false)"><sf-icon name="package" [size]="16" /> {{ t().header.orders }}</a>
                  <a routerLink="/account/wishlist" (click)="userOpen.set(false)"><sf-icon name="heart" [size]="16" /> {{ t().header.wishlist }}</a>
                  @if (auth.isAdmin()) {
                    <a routerLink="/admin" (click)="userOpen.set(false)"><sf-icon name="layout" [size]="16" /> {{ t().header.admin }}</a>
                  }
                  <button (click)="signOut()"><sf-icon name="log-out" [size]="16" /> {{ t().header.signOut }}</button>
                </div>
              }
            </div>
          } @else {
            <a routerLink="/auth/login" class="icon-btn hide-sm-inline">{{ t().header.signIn }}</a>
          }

          <a routerLink="/cart" class="icon-btn cart" [attr.aria-label]="t().header.cart">
            <sf-icon name="bag" [size]="20" />
            @if (cart.count() > 0) { <span class="badge-count num">{{ cart.count() }}</span> }
          </a>

          <button class="icon-btn menu-toggle" (click)="toggleMenu()" [attr.aria-label]="t().header.menu" [attr.aria-expanded]="menuOpen()">
            <sf-icon [name]="menuOpen() ? 'x' : 'menu'" [size]="22" />
          </button>
        </div>
      </div>
    </header>

    <main class="content"><router-outlet /></main>

    <footer class="ftr">
      <div class="container ftr-in">
        <div>
          <div class="brand"><span class="mark"><sf-icon name="flame" [size]="16" /></span><span class="serif name">Emberline Roasters</span></div>
          <p class="muted tag">{{ t().footer.tagline }}</p>
        </div>
        <div class="ftr-meta">
          <p class="muted">{{ t().footer.demoNote }}</p>
          <p class="muted">{{ t().footer.built }}</p>
          <a routerLink="/about" class="about-link">{{ t().header.about }} →</a>
        </div>
      </div>
    </footer>
  `,
  styles: `
    :host { display: flex; flex-direction: column; min-height: 100%; }
    .hdr { position: sticky; top: 0; z-index: 50; background: rgba(251, 247, 241, 0.9); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border); }
    .bar { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding-block: 0.75rem; }
    .brand { display: inline-flex; align-items: center; gap: 0.55rem; }
    .mark { width: 1.85rem; height: 1.85rem; border-radius: var(--radius-pill); background: var(--bean-900); color: var(--copper-400); display: grid; place-items: center; }
    .name { font-size: 1.2rem; }
    .nav { display: flex; gap: 1.5rem; }
    .nav a { font-size: 0.9rem; font-weight: 500; color: var(--bean-700); transition: color 150ms ease; }
    .nav a:hover, .nav a.active { color: var(--copper-600); }
    .actions { display: flex; align-items: center; gap: 0.75rem; }
    .icon-btn { position: relative; display: inline-flex; align-items: center; gap: 0.35rem; background: none; border: none; cursor: pointer; color: var(--bean-900); font-weight: 600; font-size: 0.9rem; padding: 0.35rem; border-radius: var(--radius-sm); transition: color 150ms ease; }
    .icon-btn:hover { color: var(--copper-600); }
    .badge-count { position: absolute; top: -4px; right: -6px; min-width: 1.05rem; height: 1.05rem; padding: 0 0.25rem; border-radius: var(--radius-pill); background: var(--copper-600); color: #fff; font-size: 0.65rem; font-weight: 700; display: grid; place-items: center; }
    .menu-wrap { position: relative; }
    .user-btn { padding: 0.4rem 0.55rem; }
    .dropdown { position: absolute; right: 0; top: calc(100% + 0.5rem); width: 12rem; padding: 0.4rem; display: flex; flex-direction: column; box-shadow: var(--shadow-md); animation: fadeIn 160ms ease both; }
    .dropdown a, .dropdown button { display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.7rem; border-radius: var(--radius-sm); background: none; border: none; cursor: pointer; font-size: 0.9rem; font-weight: 500; color: var(--bean-900); text-align: left; transition: background 150ms ease; }
    .dropdown a:hover, .dropdown button:hover { background: var(--cream-100); }
    .menu-toggle { display: none; }
    .content { flex: 1; }
    .ftr { margin-top: 4rem; background: var(--bean-900); color: var(--cream-100); padding-block: 2.5rem; }
    .ftr .mark { background: var(--copper-600); color: #fff; }
    .ftr .name, .ftr :is(h1,h2,h3) { color: var(--cream-50); }
    .ftr-in { display: flex; justify-content: space-between; gap: 2rem; flex-wrap: wrap; }
    .ftr .muted { color: rgba(244, 237, 226, 0.6); }
    .tag { max-width: 22rem; margin: 0.6rem 0 0; }
    .ftr-meta { text-align: right; display: flex; flex-direction: column; gap: 0.2rem; }
    .about-link { color: var(--copper-400); font-weight: 600; margin-top: 0.4rem; }

    @media (max-width: 820px) {
      .nav { position: absolute; top: 100%; left: 0; right: 0; flex-direction: column; gap: 0; background: var(--cream-50); border-bottom: 1px solid var(--border); padding: 0.5rem 1.25rem; transform: translateY(-8px); opacity: 0; pointer-events: none; transition: opacity 180ms ease, transform 180ms ease; }
      .nav.open { transform: none; opacity: 1; pointer-events: auto; }
      .nav a { padding: 0.8rem 0; border-bottom: 1px solid var(--border); }
      .menu-toggle { display: inline-flex; }
      .hide-sm { display: none; }
      .hide-sm-inline { display: none; }
      .ftr-in { flex-direction: column; }
      .ftr-meta { text-align: left; }
    }
  `
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartStore);
  private readonly lang = inject(LanguageService);
  private readonly router = inject(Router);

  protected readonly t = this.lang.t;
  protected readonly menuOpen = signal(false);
  protected readonly userOpen = signal(false);
  protected readonly firstName = computed(() => this.auth.user()?.fullName.split(' ')[0] ?? '');

  protected toggleMenu() { this.menuOpen.update(v => !v); }
  protected closeMenu() { this.menuOpen.set(false); }
  protected toggleUser() { this.userOpen.update(v => !v); }

  protected async signOut() {
    this.userOpen.set(false);
    await this.auth.logout();
    this.router.navigate(['/']);
  }
}
