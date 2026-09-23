/** Web twin — one linear URL stack; named stacks don't apply. */
export function registerStack(_name: string, _frame: unknown): void {}
export function getStack(_name: string): undefined {
	return undefined;
}
export function stackEntries(): IterableIterator<[string, never]> {
	return [].values();
}
