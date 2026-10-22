// Real GTK child-list queries through the public driver, without presenting
// a window or synthesizing input. No Mason native artifact is required.
import Gtk from 'gi://Gtk?version=4.0'
import { createGtkContainer, gtkDriver } from '@octane-xplat/linux-gtk'
import type { ElementNode } from '@octane-xplat/linux-gtk'
import type { UniversalHostCommand } from 'octane/universal/native'

// GJS runtime members outside the renderer's minimal ambient declarations.
declare function print(message: string): void
const runtimeGtk = Gtk as typeof Gtk & {
	init(): void
	get_major_version(): number
	get_minor_version(): number
	get_micro_version(): number
}

runtimeGtk.init()
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const container = createGtkContainer(host)

function apply(commands: UniversalHostCommand[]) {
	gtkDriver.prepareBatch(container, { renderer: 'gtk', version: 1, commands }, {
		invokeLocalCallback() {
			throw new Error('This ordering fixture has no event listeners')
		},
	}).apply()
}

function labels(): string[] {
	const result: string[] = []
	for (let child = host.get_first_child(); child; child = child.get_next_sibling()) {
		result.push(String((child as any).label))
	}
	return result
}

try {
	apply([
		{ op: 'create', id: 1, type: 'label', props: { text: 'A' } },
		{ op: 'create', id: 2, type: 'proxyviewcontainer', props: {} },
		{ op: 'create', id: 3, type: 'label', props: { text: 'C' } },
		{ op: 'insert', id: 1, parent: null, before: null },
		{ op: 'insert', id: 2, parent: null, before: null },
		{ op: 'insert', id: 3, parent: null, before: null },
	] as UniversalHostCommand[])
	const initial = labels()

	// Add B to the already mounted proxy between A and C. Its native widget
	// must occupy the proxy's position in the flattened GTK child list.
	apply([
		{ op: 'create', id: 4, type: 'label', props: { text: 'B' } },
		{ op: 'insert', id: 4, parent: 2, before: null },
	] as UniversalHostCommand[])
	const actual = labels()
	const proxyChild = container.nodes.get(2)?.children.map((node: ElementNode) => node.props.text)
	apply([
		{ op: 'create', id: 5, type: 'proxyviewcontainer', props: {} },
		{ op: 'insert', id: 5, parent: 2, before: 4 },
		{ op: 'create', id: 6, type: 'label', props: { text: 'D' } },
		{ op: 'insert', id: 6, parent: 5, before: null },
		{ op: 'create', id: 7, type: 'label', props: { text: 'E' } },
		{ op: 'insert', id: 7, parent: 5, before: 6 },
	] as UniversalHostCommand[])
	const nestedBefore = labels()
	apply([{ op: 'remove', id: 6 }] as UniversalHostCommand[])
	const removedChild = labels()
	apply([{ op: 'move', id: 2, parent: null, before: null }] as UniversalHostCommand[])
	const movedProxy = labels()
	apply([{ op: 'remove', id: 2 }] as UniversalHostCommand[])
	const removedProxy = labels()
	apply([{ op: 'insert', id: 2, parent: null, before: 3 }] as UniversalHostCommand[])
	const reinsertedProxy = labels()
	print(`GTK_PROXY_ORDER ${JSON.stringify({
		gtk: `${runtimeGtk.get_major_version()}.${runtimeGtk.get_minor_version()}.${runtimeGtk.get_micro_version()}`,
		initial,
		actual, proxyChild, nestedBefore, removedChild, movedProxy, removedProxy, reinsertedProxy,
	})}`)
} finally {
	for (const node of [...container.nodes.values()].reverse()) {
		apply([
			{ op: 'remove', id: node.id },
			{ op: 'destroy', id: node.id },
		] as UniversalHostCommand[])
	}
}
