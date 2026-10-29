/** `cond && <Icon />` keeps booleans out of the layout — mirror of Astryx's
 *  isRenderable: null/undefined/false are empty; everything else renders. */
export function isRenderable(value: unknown): boolean {
	return value != null && value !== false && value !== true
}
