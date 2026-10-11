/** Native renderers now normalize the declarative `className` prop, but
 *  imperative `view.className` writes still need a pre-joined string — NS
 *  splits on ' ' only. Native leaves keep normalizing through cx() before
 *  handing className to an intrinsic so both paths accept the same values.
 *  (The DOM renderer already flattens arrays, so web leaves don't need
 *  this.) */
export function cx(...parts: any[]): string {
	return parts.flat(Infinity).filter(Boolean).join(' ')
}
