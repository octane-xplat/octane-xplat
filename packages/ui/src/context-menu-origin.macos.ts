function flag(view: NSView, name: string, fallback = false): boolean {
	const value = Reflect.get(view, name)
	return value == null ? fallback : Boolean(typeof value === 'function' ? value.call(view) : value)
}

/** Accept only a still-owned native invoker in the context wrapper's window. */
export function appKitContextMenuOrigin(root: NSView | null, target: NSView | null): NSView | null {
	return target && eligible(target) && appKitContextMenuContains(root, target) ? target : null
}

function eligible(view: NSView): boolean {
	if (flag(view, 'hidden') || flag(view, 'hiddenOrHasHiddenAncestor') ||
		!flag(view, 'enabled', true) || !flag(view, 'isEnabled', true)) return false
	if (!flag(view, 'isAccessibilityEnabled', true) && !flag(view, 'canBecomeKeyView')) return false
	return true
}

/** Secondary hits may land on decorative children; prefer an eligible focus host. */
export function appKitContextPointerOrigin(root: NSView | null, target: NSView | null): NSView | null {
	if (!root?.window || !target || target.window !== root.window) return null
	const path: NSView[] = []
	for (let view: NSView | null = target; view; view = view.superview) {
		path.push(view)
		if (view === root) return path.find((candidate) => eligible(candidate) &&
			(flag(candidate, 'acceptsFirstResponder') || flag(candidate, 'canBecomeKeyView'))) ?? null
	}
	return null
}

export function appKitContextMenuContains(root: NSView | null, target: NSView | null): boolean {
	if (!root?.window || !target || target.window !== root.window) return false
	for (let view: NSView | null = target; view; view = view.superview) if (view === root) return true
	return false
}
