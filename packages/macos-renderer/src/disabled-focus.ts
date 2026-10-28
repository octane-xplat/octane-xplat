/** Opt-in focus for controls whose disabled state must remain discoverable.
 * This grants focus only; it never installs or enables an action. */
export function createDisabledFocusTargets() {
	const owners = new WeakMap<object, number>()
	return {
		allows: (view: object) => owners.has(view),
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
