export function decode(value: string): { kind: 'text'; value: string }
export function decode(value: number): { kind: 'number'; value: number }
export function decode(value: string | number) {
	return typeof value === 'string'
		? { kind: 'text' as const, value }
		: { kind: 'number' as const, value }
}
