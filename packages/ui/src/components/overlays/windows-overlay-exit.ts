/** Native backdrop exits outlive declarative content. Scope return focus to their XamlRoot. */
const exits = new WeakMap<object, Set<Promise<void>>>()

export function trackWindowsOverlayExit(owner: object | undefined, result: Promise<unknown>): void {
	if (!owner) {
		return
	}
	let pending = exits.get(owner)
	if (!pending) {
		pending = new Set()
		exits.set(owner, pending)
	}
	// The caller retains the original rejection and owns error reporting/host removal.
	const settled = Promise.resolve(result).then(
		() => {},
		() => {},
	)
	const held = pending
	held.add(settled)
	void settled.then(() => {
		held.delete(settled)
		if (!held.size && exits.get(owner) === held) {
			exits.delete(owner)
		}
	})
}

export function afterWindowsOverlayExit(owner: object, restore: () => void): void {
	const pending = exits.get(owner)
	if (!pending?.size) {
		restore()
		return
	}
	void Promise.all(pending).then(() => afterWindowsOverlayExit(owner, restore))
}
