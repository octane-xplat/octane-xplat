const stacks = new Map<string, unknown>()

export function registerStack(name: string, stack: unknown): void {
	stacks.set(name, stack)
}

export function getStack(name: string): unknown {
	return stacks.get(name)
}

export function stackEntries(): IterableIterator<[string, unknown]> {
	return stacks.entries()
}
