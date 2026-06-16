/** Maps a product image "tone" to one of the design-system gradient classes. */
export function toneClass(tone: string | null | undefined): string {
  switch (tone) {
    case 'copper': return 'tone-copper';
    case 'amber': return 'tone-amber';
    case 'leaf': return 'tone-leaf';
    default: return 'tone-beans';
  }
}

/** Non-coffee products (gear, subscription) ship as a single unit; coffee defaults to whole bean. */
export function defaultGrind(categorySlug: string): string {
  return categorySlug === 'coffee' ? 'Whole bean' : 'Each';
}

/** Whether the grind picker applies to this category. */
export function hasGrind(categorySlug: string): boolean {
  return categorySlug === 'coffee';
}
