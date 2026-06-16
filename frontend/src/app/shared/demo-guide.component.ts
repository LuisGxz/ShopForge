import { Component, computed, inject } from '@angular/core';
import { AuthService } from '../core/auth.service';
import { DemoService } from '../core/demo.service';
import { LanguageService } from '../core/language.service';
import { IconComponent } from './icon.component';

/** Floating demo guide trigger + role badge, the first-visit welcome tour, and the guide panel. */
@Component({
  selector: 'sf-demo-guide',
  imports: [IconComponent],
  template: `
    <!-- floating trigger with role badge -->
    @if (!demo.guideOpen() && !demo.tourOpen()) {
      <button class="trigger" (click)="demo.openGuide()" [attr.aria-label]="t().demo.guideTitle">
        <sf-icon name="sparkles" [size]="16" />
        <span class="lbl">{{ t().demo.badge }}</span>
        <span class="role" [class.admin]="isAdmin()">{{ roleLabel() }}</span>
      </button>
    }

    <!-- first-visit welcome tour -->
    @if (demo.tourOpen()) {
      <div class="scrim" (click)="demo.finishTour()"></div>
      <div class="tour card" role="dialog" aria-modal="true">
        <button class="close" (click)="demo.finishTour()" [attr.aria-label]="t().common.close"><sf-icon name="x" [size]="18" /></button>
        @if (demo.tourStep() === 0) {
          <span class="mark"><sf-icon name="flame" [size]="24" /></span>
          <h2 class="serif">{{ t().demo.title }}</h2>
          <p class="muted intro">{{ t().demo.intro }}</p>
        } @else {
          <span class="step-no">{{ demo.tourStep() }} / {{ steps().length - 1 }}</span>
          <h2 class="serif">{{ steps()[demo.tourStep()].title }}</h2>
          <p class="muted intro">{{ steps()[demo.tourStep()].body }}</p>
        }
        <div class="dots">
          @for (s of steps(); track $index) { <span class="dot" [class.on]="$index === demo.tourStep()"></span> }
        </div>
        <div class="tour-actions">
          @if (demo.tourStep() > 0) { <button class="btn btn-ghost btn-sm" (click)="demo.prev()">{{ t().demo.tourBack }}</button> }
          @else { <button class="btn btn-ghost btn-sm" (click)="demo.finishTour()">{{ t().demo.tourSkip }}</button> }
          <button class="btn btn-primary btn-sm" (click)="demo.next(steps().length)">
            {{ demo.tourStep() === 0 ? t().demo.tourStart : (demo.tourStep() >= steps().length - 1 ? t().demo.tourDone : t().demo.tourNext) }}
          </button>
        </div>
      </div>
    }

    <!-- persistent guide panel -->
    @if (demo.guideOpen()) {
      <div class="scrim" (click)="demo.closeGuide()"></div>
      <aside class="panel card" role="dialog" aria-label="Demo guide">
        <header class="p-head">
          <h2 class="serif">{{ t().demo.guideTitle }}</h2>
          <button class="close" (click)="demo.closeGuide()" [attr.aria-label]="t().common.close"><sf-icon name="x" [size]="18" /></button>
        </header>
        <p class="muted you">{{ roleLabel() }}</p>

        <ol class="g-steps">
          @for (s of steps(); track $index) {
            @if ($index > 0) {
              <li><span class="num">{{ $index }}</span><div><strong>{{ s.title }}</strong><p class="muted">{{ s.body }}</p></div></li>
            }
          }
        </ol>

        <div class="accounts">
          <p class="ac-label">{{ t().login.demoLabel }}</p>
          <div class="ac"><sf-icon name="user" [size]="14" /><span>demo&#64;shopforge.dev</span><code>Demo1234!</code></div>
          <div class="ac"><sf-icon name="shield" [size]="14" /><span>admin&#64;shopforge.dev</span><code>Admin1234!</code></div>
        </div>

        <button class="btn btn-ghost btn-sm replay" (click)="demo.replayTour()"><sf-icon name="sparkles" [size]="14" /> {{ t().demo.tourStart }}</button>
      </aside>
    }
  `,
  styles: `
    .trigger { position: fixed; bottom: 1.25rem; right: 1.25rem; z-index: 80; display: inline-flex; align-items: center; gap: 0.45rem;
      background: var(--bean-900); color: var(--cream-50); border: none; cursor: pointer; padding: 0.6rem 0.9rem; border-radius: var(--radius-pill);
      box-shadow: var(--shadow-md); font-weight: 600; font-size: 0.85rem; transition: transform 150ms ease, background 150ms ease; }
    .trigger:hover { transform: translateY(-2px); background: var(--bean-700); }
    .trigger sf-icon { color: var(--copper-400); }
    .role { background: var(--cream-100); color: var(--bean-900); border-radius: var(--radius-pill); padding: 0.1rem 0.5rem; font-size: 0.72rem; font-weight: 700; }
    .role.admin { background: var(--copper-400); color: #fff; }
    .scrim { position: fixed; inset: 0; z-index: 90; background: rgba(34,23,16,0.45); backdrop-filter: blur(2px); animation: fadeIn 200ms ease both; }
    .tour { position: fixed; z-index: 91; left: 50%; bottom: 2rem; transform: translateX(-50%); width: calc(100% - 2rem); max-width: 26rem;
      padding: 1.75rem; text-align: center; animation: tourUp 280ms ease both; }
    @keyframes tourUp { from { opacity: 0; transform: translate(-50%, 16px); } to { opacity: 1; transform: translate(-50%, 0); } }
    .close { position: absolute; top: 0.85rem; right: 0.85rem; background: none; border: none; cursor: pointer; color: var(--bean-400); display: grid; place-items: center; }
    .close:hover { color: var(--bean-900); }
    .mark { width: 3.25rem; height: 3.25rem; border-radius: var(--radius-pill); background: var(--bean-900); color: var(--copper-400); display: grid; place-items: center; margin: 0 auto 0.85rem; }
    .tour h2 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    .intro { font-size: 0.92rem; }
    .step-no { display: inline-block; font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em; color: var(--copper-600); margin-bottom: 0.4rem; }
    .dots { display: flex; justify-content: center; gap: 0.4rem; margin: 1.1rem 0; }
    .dot { width: 7px; height: 7px; border-radius: 999px; background: var(--cream-200); transition: background 200ms ease, width 200ms ease; }
    .dot.on { background: var(--copper-500); width: 18px; }
    .tour-actions { display: flex; justify-content: center; gap: 0.6rem; }
    .panel { position: fixed; z-index: 91; right: 1.25rem; bottom: 1.25rem; width: calc(100% - 2.5rem); max-width: 23rem; padding: 1.4rem;
      max-height: calc(100dvh - 2.5rem); overflow-y: auto; animation: tourUp 240ms ease both; }
    @media (min-width: 480px) { .panel { transform: none; left: auto; } @keyframes tourUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } } }
    .p-head { display: flex; align-items: center; justify-content: space-between; }
    .p-head h2 { font-size: 1.4rem; }
    .p-head .close { position: static; }
    .you { font-size: 0.82rem; margin: 0.1rem 0 1rem; }
    .g-steps { list-style: none; margin: 0 0 1.25rem; padding: 0; display: flex; flex-direction: column; gap: 0.9rem; }
    .g-steps li { display: flex; gap: 0.7rem; align-items: flex-start; }
    .g-steps .num { flex-shrink: 0; width: 1.6rem; height: 1.6rem; border-radius: var(--radius-pill); background: var(--copper-100); color: var(--copper-600); display: grid; place-items: center; font-size: 0.8rem; font-weight: 700; }
    .g-steps strong { font-size: 0.92rem; } .g-steps p { margin: 0.1rem 0 0; font-size: 0.85rem; }
    .accounts { border-top: 1px solid var(--border); padding-top: 1rem; }
    .ac-label { font-size: 0.78rem; font-weight: 600; color: var(--bean-500); margin: 0 0 0.6rem; }
    .ac { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; padding: 0.35rem 0; }
    .ac span { flex: 1; } .ac code { background: var(--cream-100); border-radius: var(--radius-sm); padding: 0.15rem 0.45rem; font-size: 0.78rem; }
    .replay { width: 100%; margin-top: 1rem; }
  `
})
export class DemoGuideComponent {
  protected readonly demo = inject(DemoService);
  private readonly auth = inject(AuthService);
  private readonly lang = inject(LanguageService);
  protected readonly t = this.lang.t;

  protected readonly isAdmin = this.auth.isAdmin;
  protected readonly steps = computed(() => this.t().demo.steps);
  protected readonly roleLabel = computed(() => {
    if (!this.auth.isAuthenticated()) return this.t().demo.roleGuest;
    return this.auth.isAdmin() ? this.t().demo.roleAdmin : this.t().demo.roleCustomer;
  });
}
