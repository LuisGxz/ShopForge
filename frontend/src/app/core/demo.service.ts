import { Injectable, signal } from '@angular/core';

const SEEN_KEY = 'shopforge.tourSeen';

/** Drives the guided-demo overlay: a one-time welcome tour plus a persistent demo guide panel. */
@Injectable({ providedIn: 'root' })
export class DemoService {
  readonly tourOpen = signal(false);
  readonly tourStep = signal(0);
  readonly guideOpen = signal(false);

  constructor() {
    if (!readSeen()) this.tourOpen.set(true);
  }

  next(total: number): void {
    if (this.tourStep() >= total - 1) this.finishTour();
    else this.tourStep.update(s => s + 1);
  }
  prev(): void { this.tourStep.update(s => Math.max(0, s - 1)); }

  finishTour(): void {
    this.tourOpen.set(false);
    this.tourStep.set(0);
    writeSeen();
  }

  openGuide(): void { this.guideOpen.set(true); }
  closeGuide(): void { this.guideOpen.set(false); }
  replayTour(): void { this.guideOpen.set(false); this.tourStep.set(0); this.tourOpen.set(true); }
}

function readSeen(): boolean { try { return localStorage.getItem(SEEN_KEY) === '1'; } catch { return false; } }
function writeSeen(): void { try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ } }
