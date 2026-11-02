// A tiny stand-in for a stock service. Keep these exports.
let failuresLeft = 0

/** Make the next `count` calls to loadStock fail. */
export function failNextLoads(count: number) {
	failuresLeft = count
}

export async function loadStock(id: string): Promise<{ count: number }> {
	await new Promise((resolve) => setTimeout(resolve, 10))
	if (failuresLeft > 0) {
		failuresLeft -= 1
		throw new Error('Stock service unavailable')
	}
	return { count: id.length }
}
