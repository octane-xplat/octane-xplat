/** Reference-counted native Tab exclusion. Programmatic focus remains valid;
 * each owner must release its own claim without restoring another's claim. */
export function createTabStopSuppression() {
	const owners = new WeakMap<object, number>()
	return {
		isSuppressed: (view: object) => owners.has(view),
		retain(view: object): () => void {
			owners.set(view, (owners.get(view) ?? 0) + 1)
			let active = true
			return () => {
				if (!active) return
				active = false
				const count = (owners.get(view) ?? 1) - 1
				if (count > 0) owners.set(view, count)
				else owners.delete(view)
			}
		},
	}
}
