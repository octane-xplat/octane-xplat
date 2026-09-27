/** NativeScript's universal driver stringifies className values; normalize
 * arrays here so they stay space separated. */
export function cx(...parts: any[]): string {
	return parts.flat(Infinity).filter(Boolean).join(' ')
}
