/**
 * Named surfaces of the glass theme. Keeping them in a union means a typo like
 * `glass('crad')` fails to compile instead of silently rendering an unstyled element.
 */
export type GlassVariant =
  'root' | 'card' | 'modal' | 'dock' | 'pill' | 'pill-active' | 'btn-primary';

/**
 * Spread onto any view to tag it for the glass stylesheet:
 * `<View {...glass('card')} />`.
 */
export function glass(variant: GlassVariant): { dataSet: Record<string, string> } {
  return { dataSet: { glass: variant } };
}
