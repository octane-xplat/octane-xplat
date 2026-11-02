/** Local minimal merge for fixtures — authored style entries win. */
export function mergeStyle(a: Record<string, any>, b: any): Record<string, any> {
	return { ...a, ...b }
}
