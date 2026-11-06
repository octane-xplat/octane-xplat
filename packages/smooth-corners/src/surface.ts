/** Painting and layout use separate hosts so the surface can stay shaped
 * without masking descendants. These overrides belong to the component. */
export const contentPaintReset = {
  backgroundColor: 'transparent',
  backgroundImage: 'none',
  borderWidth: 0,
  borderRadius: 0,
  boxShadow: 'none',
} as const

/** A decorative child fills the border box without participating in layout.
 * Opacity and transforms belong to its parent and must not apply twice. */
export const surfaceLayout = {
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  minWidth: 0,
  minHeight: 0,
  maxWidth: 'none',
  maxHeight: 'none',
  margin: 0,
  padding: 0,
  opacity: 1,
  transform: 'none',
  overflow: 'visible',
} as const

/** Only two-axis hidden overflow requests the component's curved clip. */
export function clipsChildren(overflowX: unknown, overflowY: unknown = overflowX): boolean {
  return overflowX === 'hidden' && overflowY === 'hidden'
}
