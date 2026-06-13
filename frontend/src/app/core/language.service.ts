import { Injectable, computed, signal } from '@angular/core';
import { COPY, GRIND_ES, Lang, PROCESS_EN, PROCESS_ES, ROAST_EN, ROAST_ES, STATUS_ES } from './i18n';

const LANG_KEY = 'shopforge.lang';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  readonly lang = signal<Lang>(readStoredLang());

  /** App-wide copy for the active language. */
  readonly t = computed(() => COPY[this.lang()]);
  readonly isEs = computed(() => this.lang() === 'es');
  readonly dateLocale = computed(() => this.lang() === 'es' ? 'es' : 'en-US');

  set(lang: Lang): void {
    this.lang.set(lang);
    try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ }
    document.documentElement.lang = lang;
  }

  /** Picks the EN or ES variant of a bilingual API field. */
  pick(en: string | null | undefined, es: string | null | undefined): string {
    return (this.lang() === 'es' ? es : en) ?? en ?? es ?? '';
  }

  roast(value: string): string { return (this.lang() === 'es' ? ROAST_ES : ROAST_EN)[value] ?? value; }
  process(value: string): string { return (this.lang() === 'es' ? PROCESS_ES : PROCESS_EN)[value] ?? value; }
  status(value: string): string { return this.lang() === 'es' ? (STATUS_ES[value] ?? value) : value; }
  grind(value: string): string { return this.lang() === 'es' ? (GRIND_ES[value] ?? value) : value; }
}

function readStoredLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === 'en' || stored === 'es') return stored;
  } catch { /* ignore */ }
  return navigator.language?.toLowerCase().startsWith('es') ? 'es' : 'en';
}
