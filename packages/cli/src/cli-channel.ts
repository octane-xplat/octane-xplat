/** The exact native CLI channel is app-owned; renderer/compiler pins remain release-owned. */
export function nativeCliPin(spec: unknown, frameworkVersion: string): string | undefined {
	const prefix = `${frameworkVersion}-nim.`
	if (typeof spec !== 'string' || !spec.startsWith(prefix)) {
		return undefined
	}
	const number = spec.slice(prefix.length)
	return number.length > 0 && (number.length === 1 || number[0] !== '0') && !/[^0-9]/.test(number)
		? spec
		: undefined
}
