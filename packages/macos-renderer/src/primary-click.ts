import type { NSEvent, NSView, NSWindow } from '@octane-xplat/platform/macos'

const controls = new Set([
	'button', 'textfield', 'textview', 'searchbar', 'switch', 'slider', 'datepicker',
	'timepicker', 'listpicker', 'listview', 'segmentedbar', 'tabview', 'htmlview', 'webview',
])
const widgets = new Set([
	'button', 'link', 'checkbox', 'radio', 'switch', 'adjustable', 'slider', 'spinbutton',
	'combobox', 'option', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'treeitem',
	'tab', 'tablist', 'radiogroup', 'listbox', 'tree', 'grid',
])

/** Disabled semantic controls remain boundaries; plain labels/groups do not. */
export function isPrimaryClickBoundary(type: string, role: unknown, hasAction: boolean): boolean {
	return hasAction || controls.has(type) || widgets.has(String(role ?? ''))
}

/** Use AppKit's actual hit result, expressed in the content view's *superview*
 * coordinates. Only a primary mouse-down stream is gated here. */
export function shouldReceivePrimaryClick(owner: NSView | null, event: NSEvent, boundary: (view: NSView) => boolean): boolean {
	if (!owner) return false
	if (Number(event.type) !== 1) return true // NSEventType.LeftMouseDown
	const window = owner.window
	if (!window || (event.window && event.window !== window)) return false
	const hit = appKitMouseHit(window, event.locationInWindow)
	for (let view = hit; view; view = view.superview) {
		if (view === owner) return true
		if (boundary(view)) return false
	}
	return false
}

/** NSView.hitTest receives coordinates in its superview, not its own bounds. */
export function appKitMouseHit(window: NSWindow | null | undefined, point: { x: number; y: number } | null | undefined): NSView | null {
	const root = window?.contentView
	if (!root || !point || !Number.isFinite(point.x) || !Number.isFinite(point.y)) return null
	const parent = root.superview
	return root.hitTest(parent ? parent.convertPointFromView(point, null) : point)
}
