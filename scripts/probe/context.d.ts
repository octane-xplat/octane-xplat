/** Host objects stay platform-specific; inspect() returns serializable fields. */
export interface ProbeContext {
	target: 'web' | 'ios' | 'android' | 'macos' | 'linux'
	host: unknown
	mount(Component: any, props?: Record<string, unknown>): Promise<void> | void
	find(id: string): any | null
	press(id: string): Promise<void> | void
	setText(id: string, value: string): Promise<void> | void
	inspect(id: string): {
		text: string
		value: string
		frame: { x: number; y: number; width: number; height: number } | null
	}
	assert(name: string, actual: unknown, expected?: unknown): void
	record(name: string, value: unknown): void
	waitFor<T>(
		predicate: () => T | Promise<T>,
		options?: { timeout?: number; interval?: number },
	): Promise<NonNullable<T>>
	onCleanup(callback: () => unknown | Promise<unknown>): void
}
