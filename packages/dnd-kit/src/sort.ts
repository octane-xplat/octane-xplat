/** Return a new order. Invalid indices leave the order unchanged. */
export function arrayMove<T>(items: readonly T[], from: number, to: number): T[] {
	const result = [...items]
	if (
		!Number.isInteger(from) ||
		!Number.isInteger(to) ||
		from < 0 ||
		to < 0 ||
		from >= items.length ||
		to >= items.length ||
		from === to
	) {
		return result
	}

	const [item] = result.splice(from, 1)
	result.splice(to, 0, item!)
	return result
}
