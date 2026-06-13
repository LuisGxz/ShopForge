import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { parseApiError } from '../../core/api-error';
import { AuthService } from '../../core/auth.service';
import { LanguageService } from '../../core/language.service';
import { IconComponent } from '../../shared/icon.component';
import { LangToggleComponent } from '../../shared/lang-toggle.component';

@Component({
  selector: 'sf-register',
  imports: [FormsModule, RouterLink, IconComponent, LangToggleComponent],
  template: `
    <div class="auth-wrap">
      <div class="auth-card card fade-in">
        <div class="top">
          <a routerLink="/" class="brand"><span class="mark"><sf-icon name="flame" [size]="16" /></span><span class="serif">Emberline</span></a>
          <sf-lang-toggle />
        </div>

        <h1 class="serif title">{{ t().register.title }}</h1>
        <p class="muted sub">{{ t().register.subtitle }}</p>

        @if (errors().length) {
          <div class="error-panel" role="alert"><ul>@for (e of errors(); track e) { <li>{{ e }}</li> }</ul></div>
        }

        <form (ngSubmit)="submit()" #f="ngForm">
          <div class="field">
            <label for="name">{{ t().register.fullName }}</label>
            <input id="name" name="name" type="text" [(ngModel)]="fullName" required autocomplete="name" />
          </div>
          <div class="field">
            <label for="email">{{ t().register.email }}</label>
            <input id="email" name="email" type="email" [(ngModel)]="email" required autocomplete="email" />
          </div>
          <div class="field">
            <label for="password">{{ t().register.password }}</label>
            <input id="password" name="password" type="password" [(ngModel)]="password" required minlength="8" autocomplete="new-password" />
            <p class="muted hint">{{ t().register.passwordHint }}</p>
          </div>
          <button class="btn btn-primary btn-block" type="submit" [disabled]="busy() || f.invalid">
            @if (busy()) { <sf-icon name="flame" [size]="16" class="spin" /> {{ t().register.creating }} }
            @else { {{ t().register.create }} }
          </button>
        </form>

        <p class="alt">{{ t().register.already }} <a routerLink="/auth/login">{{ t().register.signIn }}</a></p>
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
    .hint { font-size: 0.78rem; margin: 0.35rem 0 0; }
    .alt { text-align: center; margin: 1.25rem 0 0; font-size: 0.9rem; color: var(--bean-500); }
    .alt a { color: var(--copper-600); font-weight: 600; }
    form .btn { margin-top: 0.25rem; }
  `
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly lang = inject(LanguageService);

  protected readonly t = this.lang.t;
  protected fullName = '';
  protected email = '';
  protected password = '';
  protected readonly busy = signal(false);
  protected readonly errors = signal<string[]>([]);

  protected async submit() {
    if (this.busy()) return;
    this.busy.set(true);
    this.errors.set([]);
    try {
      await this.auth.register(this.email.trim(), this.password, this.fullName.trim());
      this.router.navigateByUrl('/');
    } catch (e) {
      this.errors.set(parseApiError(e, this.t().register.errorFallback));
    } finally {
      this.busy.set(false);
    }
  }
}
