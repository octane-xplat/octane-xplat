/** Imperative `view.className` writes still need a pre-joined string —
 * NativeScript's className setter splits on ' ' only. Normalize arrays here
 * so they stay space separated. */
export function cx(...parts: any[]): string {
	return parts.flat(Infinity).filter(Boolean).join(' ')
}
