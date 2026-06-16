import { Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';
import { IconComponent } from './icon.component';

@Component({
  selector: 'sf-toasts',
  imports: [IconComponent],
  template: `
    <div class="stack" aria-live="polite" aria-atomic="true">
      @for (t of toasts.toasts(); track t.id) {
        <div class="toast" [class.err]="t.kind === 'error'" role="status">
          <sf-icon [name]="t.kind === 'error' ? 'alert-triangle' : 'check'" [size]="16" />
          <span>{{ t.text }}</span>
        </div>
      }
    </div>
  `,
  styles: `
    .stack { position: fixed; bottom: 1.25rem; left: 50%; transform: translateX(-50%); z-index: 100;
      display: flex; flex-direction: column; gap: 0.5rem; align-items: center; pointer-events: none; }
    .toast { display: inline-flex; align-items: center; gap: 0.55rem; background: var(--bean-900); color: var(--cream-50);
      padding: 0.7rem 1.1rem; border-radius: var(--radius-pill); font-size: 0.9rem; font-weight: 600;
      box-shadow: var(--shadow-md); animation: toastIn 220ms ease both; }
    .toast.err { background: var(--danger); }
    .toast sf-icon { color: var(--copper-400); }
    .toast.err sf-icon { color: #fff; }
    @keyframes toastIn { from { opacity: 0; transform: translateY(10px) scale(0.96); } to { opacity: 1; transform: none; } }
  `
})
export class ToastsComponent {
  protected readonly toasts = inject(ToastService);
}
