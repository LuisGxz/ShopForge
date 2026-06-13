import { Component, inject } from '@angular/core';
import { LanguageService } from '../core/language.service';

@Component({
  selector: 'sf-lang-toggle',
  template: `
    <div class="lang" role="group" aria-label="Language / Idioma">
      <button type="button" [class.active]="svc.lang() === 'en'" (click)="svc.set('en')">EN</button>
      <button type="button" [class.active]="svc.lang() === 'es'" (click)="svc.set('es')">ES</button>
    </div>
  `,
  styles: `
    .lang { display: inline-flex; border: 1px solid var(--border-strong); border-radius: var(--radius-pill); overflow: hidden; }
    button {
      background: transparent; border: none; cursor: pointer;
      color: var(--bean-500); font-weight: 700; font-size: 0.72rem; letter-spacing: 0.03em;
      padding: 0.4rem 0.7rem; transition: background 150ms ease, color 150ms ease;
    }
    button.active { background: var(--bean-900); color: var(--cream-50); }
  `
})
export class LangToggleComponent {
  protected readonly svc = inject(LanguageService);
}
