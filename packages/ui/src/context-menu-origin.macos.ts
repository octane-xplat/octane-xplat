function flag(view: NSView, name: string, fallback = false): boolean {
	const value = Reflect.get(view, name)
	return value == null ? fallback : Boolean(typeof value === 'function' ? value.call(view) : value)
}

/** Accept only a still-owned native invoker in the context wrapper's window. */
export function appKitContextMenuOrigin(root: NSView | null, target: NSView | null): NSView | null {
	if (!root?.window || !target || target.window !== root.window) return null
	if (flag(target, 'hidden') || flag(target, 'hiddenOrHasHiddenAncestor') ||
		!flag(target, 'enabled', true) || !flag(target, 'isEnabled', true)) return null
	if (!flag(target, 'accessibilityIsEnabled', true) && !flag(target, 'canBecomeKeyView')) return null
	for (let view: NSView | null = target; view; view = view.superview) if (view === root) return target
	return null
}
