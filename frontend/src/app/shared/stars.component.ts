import { Component, Input } from '@angular/core';

let starSeq = 1;

/** Read-only 5-star rating with half-star precision, drawn with inline SVG (no icon dependency). */
@Component({
  selector: 'sf-stars',
  template: `
    <span class="stars" [attr.aria-label]="value.toFixed(1) + ' / 5'">
      @for (i of slots; track i) {
        <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" aria-hidden="true">
          <defs>
            <linearGradient [attr.id]="gid(i)">
              <stop [attr.offset]="fill(i)" stop-color="var(--copper-500)"/>
              <stop [attr.offset]="fill(i)" stop-color="var(--cream-200)"/>
            </linearGradient>
          </defs>
          <path [attr.fill]="'url(#' + gid(i) + ')'"
            d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
        </svg>
      }
    </span>
  `,
  styles: `.stars { display: inline-flex; gap: 1px; line-height: 0; vertical-align: middle; }`
})
export class StarsComponent {
  @Input() value = 0;
  @Input() size = 16;
  protected readonly slots = [0, 1, 2, 3, 4];
  private readonly uid = starSeq++;

  protected gid(i: number): string { return `star-${this.uid}-${i}`; }
  protected fill(i: number): string {
    const f = Math.max(0, Math.min(1, this.value - i));
    return `${Math.round(f * 100)}%`;
  }
}
