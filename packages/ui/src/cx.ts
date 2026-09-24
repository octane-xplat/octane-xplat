/** NS `className` splits on ' ' only, and the universal driver applies the
 *  prop via `String(value)` — an array would arrive comma-joined and match
 *  no class at all. Native leaves normalize through cx() before handing
 *  className to an intrinsic. (The DOM renderer already flattens arrays,
 *  so web leaves don't need this.) */
export function cx(...parts: any[]): string {
	return parts.flat(Infinity).filter(Boolean).join(' ');
}
