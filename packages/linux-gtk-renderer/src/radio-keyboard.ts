import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import type { ElementNode } from './index.js'
import { physicalView } from './physical-view.js'

const nodesByWidget = new WeakMap<object, ElementNode>()

export function registerRadioNode(node: ElementNode) {
	const view = node.view!
	nodesByWidget.set(view, node)
	return () => nodesByWidget.delete(view)
}

export function radioChecked(node: ElementNode) {
	const state = node.props.accessibilityState
	return (
		state === 'checked' ||
		(state != null && typeof state === 'object' && 'checked' in state && state.checked === true)
	)
}

function groupOf(node: ElementNode): ElementNode | null {
	for (let current: ElementNode | null = node; current; current = current.parent)
		if (current.view?.get_accessible_role() === Gtk.AccessibleRole.RADIO_GROUP) return current
	return null
}

function radioOptions(group: ElementNode): ElementNode[] {
	const options: ElementNode[] = []
	const walk = (node: ElementNode, visible: boolean) => {
		const view = physicalView(node)
		visible = visible && (!view || (view.get_visible() && view.get_child_visible()))
		if (!visible) return
		const role = node.view?.get_accessible_role()
		if (role === Gtk.AccessibleRole.RADIO_GROUP) return
		if (role === Gtk.AccessibleRole.RADIO) {
			if (node.type === 'masonview' && node.view!.is_sensitive() && node.view!.get_focusable())
				options.push(node)
			return
		}
		for (const child of node.children) walk(child, visible)
	}
	for (const child of group.children) walk(child, true)
	return options
}

/** Let GTK traverse between groups while every radio remains imperatively
 * focusable. A group contributes its selected/first enabled row on Tab entry. */
export function focusRadioGroup(widget: any, direction: number): boolean | undefined {
	if (
		widget.get_accessible_role() !== Gtk.AccessibleRole.RADIO_GROUP ||
		(direction !== Gtk.DirectionType.TAB_FORWARD && direction !== Gtk.DirectionType.TAB_BACKWARD)
	)
		return undefined
	const group = nodesByWidget.get(widget)
	if (!group || widget.get_focus_child()) return false
	const options = radioOptions(group)
	const target = options.find(radioChecked) ?? options[0]
	return target?.view?.grab_focus() ?? false
}

/** Arrow keys use the same logical owner as Tab, skipping hidden/disabled
 * rows and nested groups. RTL reverses horizontal arrows only. */
export function navigateRadio(node: ElementNode, key: number, beforeFocus: () => void): boolean {
	if (node.view?.get_accessible_role() !== Gtk.AccessibleRole.RADIO) return false
	const vertical = key === Gdk.KEY_Up || key === Gdk.KEY_Down
	const horizontal = key === Gdk.KEY_Left || key === Gdk.KEY_Right
	if (!vertical && !horizontal) return false
	const group = groupOf(node)
	if (!group) return false
	const options = radioOptions(group)
	const index = options.indexOf(node)
	if (index < 0 || options.length === 0) return false
	let step = key === Gdk.KEY_Down || key === Gdk.KEY_Right ? 1 : -1
	if (horizontal && node.view!.get_direction() === Gtk.TextDirection.RTL) step = -step
	const target = options[(index + step + options.length) % options.length]!
	beforeFocus()
	if (target.view!.grab_focus()) target.pressKeys?.activateRadio()
	return true
}
