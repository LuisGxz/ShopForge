import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { parseApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { LanguageService } from '../../core/language.service';
import { IconComponent } from '../../shared/icon.component';
import { LangToggleComponent } from '../../shared/lang-toggle.component';

@Component({
  selector: 'sf-login',
  imports: [FormsModule, RouterLink, IconComponent, LangToggleComponent],
  template: `
    <div class="auth-wrap">
      <div class="auth-card card fade-in">
        <div class="top">
          <a routerLink="/" class="brand"><span class="mark"><sf-icon name="flame" [size]="16" /></span><span class="serif">Emberline</span></a>
          <sf-lang-toggle />
        </div>

        <h1 class="serif title">{{ t().login.title }}</h1>
        <p class="muted sub">{{ t().login.subtitle }}</p>

        @if (errors().length) {
          <div class="error-panel" role="alert">
            <ul>@for (e of errors(); track e) { <li>{{ e }}</li> }</ul>
          </div>
        }

        <form (ngSubmit)="submit()" #f="ngForm">
          <div class="field">
            <label for="email">{{ t().login.email }}</label>
            <input id="email" name="email" type="email" [(ngModel)]="email" required autocomplete="email" />
          </div>
          <div class="field">
            <label for="password">{{ t().login.password }}</label>
            <input id="password" name="password" type="password" [(ngModel)]="password" required autocomplete="current-password" />
          </div>
          <button class="btn btn-primary btn-block" type="submit" [disabled]="busy() || f.invalid">
            @if (busy()) { <sf-icon name="flame" [size]="16" class="spin" /> {{ t().login.signingIn }} }
            @else { {{ t().login.signIn }} }
          </button>
        </form>

        <p style="margin-top:1.1rem;text-align:center;font-size:11px;line-height:1.5;opacity:.6;">
          ⏳ Free-tier demo — the backend may take ~30s to wake up on the first request.<br>
          Demo gratuita — el backend puede tardar ~30s en despertar en la primera petición.
        </p>

        <div class="demo">
          <p class="demo-label">{{ t().login.demoLabel }}</p>
          <div class="demo-row">
            <button class="chip demo-chip" (click)="fill('demo@shopforge.dev', 'Demo1234!')">
              <sf-icon name="user" [size]="14" /> {{ t().login.demoCustomer }}</button>
            <button class="chip demo-chip" (click)="fill('admin@shopforge.dev', 'Admin1234!')">
              <sf-icon name="shield" [size]="14" /> {{ t().login.demoAdmin }}</button>
          </div>
        </div>

        <p class="alt">{{ t().login.noAccount }} <a routerLink="/auth/register">{{ t().login.createOne }}</a></p>
        <div class="links">
          <a routerLink="/">{{ t().login.backToShop }}</a>
          <a routerLink="/about">{{ t().login.aboutLink }}</a>
        </div>
      </div>
    </div>
  `,
  styles: `
    .auth-wrap { min-height: 100dvh; display: grid; place-items: center; padding: 1.5rem; background: radial-gradient(circle at 30% 10%, var(--cream-100), var(--cream-50)); }
    .auth-card { width: 100%; max-width: 26rem; padding: 1.75rem; }
    .top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem; }
    .brand { display: inline-flex; align-items: center; gap: 0.5rem; font-size: 1.1rem; }
    .mark { width: 1.6rem; height: 1.6rem; border-radius: var(--radius-pill); background: var(--bean-900); color: var(--copper-400); display: grid; place-items: center; }
    .title { font-size: 1.9rem; }
    .sub { margin: 0.25rem 0 1.25rem; }
    .demo { margin-top: 1.25rem; padding-top: 1.1rem; border-top: 1px solid var(--border); }
    .demo-label { font-size: 0.78rem; font-weight: 600; color: var(--bean-500); margin: 0 0 0.6rem; }
    .demo-row { display: flex; gap: 0.5rem; }
    .demo-chip { cursor: pointer; border: none; transition: background 150ms ease; }
    .demo-chip:hover { background: var(--copper-400); color: #fff; }
    .alt { text-align: center; margin: 1.25rem 0 0; font-size: 0.9rem; color: var(--bean-500); }
    .alt a, .links a { color: var(--copper-600); font-weight: 600; }
    .links { display: flex; justify-content: space-between; margin-top: 0.9rem; font-size: 0.82rem; }
    form .btn { margin-top: 0.25rem; }
  `
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly lang = inject(LanguageService);

  protected readonly t = this.lang.t;
  protected email = '';
  protected password = '';
  protected readonly busy = signal(false);
  protected readonly errors = signal<string[]>([]);

  protected fill(email: string, password: string) {
    this.email = email;
    this.password = password;
  }

  protected async submit() {
    if (this.busy()) return;
    this.busy.set(true);
    this.errors.set([]);
    try {
      await this.auth.login(this.email.trim(), this.password);
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
      this.router.navigateByUrl(returnUrl);
    } catch (e) {
      this.errors.set(parseApiError(e, this.t().login.errorFallback));
    } finally {
      this.busy.set(false);
    }
  }
}
