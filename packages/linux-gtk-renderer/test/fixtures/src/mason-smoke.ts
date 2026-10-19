// Driver-level mason smoke — exercises instantiate → MasonView host →
// insert → styleDict → engine compute → size_allocate → leaf measure on
// real GJS+GTK, headless. Prints one JSON result object; the node test
// asserts on it. Requires the XplatMason typelib (native/xplatmason
// build.sh) on the GI search path.
import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GObject from 'gi://GObject'
import { createGtkContainer, gtkDriver } from '@octane-xplat/linux-gtk'
import type { GtkContainer } from '@octane-xplat/linux-gtk'
import type { UniversalHostCommand } from 'octane/universal/native'

function apply(container: GtkContainer, commands: UniversalHostCommand[]) {
	gtkDriver.prepareBatch(container, { renderer: 'gtk', commands }).apply()
}

function rect(x: number, y: number, w: number, h: number) {
	const r = new Gdk.Rectangle()
	r.x = x
	r.y = y
	r.width = w
	r.height = h
	return r
}

const out: Record<string, unknown> = { ok: false }

Gtk.init()

const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const container = createGtkContainer(host)

apply(container, [
	{
		op: 'create',
		id: 1,
		type: 'masonview',
		props: {
			style: { display: 'flex', flexDirection: 'row', gap: 4, width: 200, height: 60 },
		},
	} as UniversalHostCommand,
	{ op: 'create', id: 2, type: 'label', props: { text: 'alpha' } } as UniversalHostCommand,
	{
		op: 'create',
		id: 3,
		type: 'label',
		props: { text: 'beta', style: { flexGrow: 1 } },
	} as UniversalHostCommand,
	{ op: 'insert', id: 1, parent: null, before: null } as UniversalHostCommand,
	{ op: 'insert', id: 2, parent: 1, before: null } as UniversalHostCommand,
	{ op: 'insert', id: 3, parent: 1, before: null } as UniversalHostCommand,
])

const view1 = container.nodes.get(1)?.view
const view2 = container.nodes.get(2)?.view
const view3 = container.nodes.get(3)?.view
out.typelib = typeof (globalThis as any).imports?.gi?.XplatMason?.engine_new === 'function'
out.masonHost = view1 != null && (GObject as any).type_name?.(view1) === 'XplatMasonView'
out.childrenOf1 = (() => {
	const names: string[] = []
	for (let c = view1?.get_first_child?.(); c; c = c.get_next_sibling()) {
		names.push((GObject as any).type_name?.(c) ?? '?')
	}
	return names
})()

if (view1) {
	// The layout manager runs the engine during allocation.
	view1.size_allocate(rect(0, 0, 200, 60), -1)
	const bounds = (w: any) => {
		const [ok2, b] = w.compute_bounds(view1)
		const origin = b?.origin ?? {}
		const size = b?.size ?? {}
		return ok2
			? { x: origin.x ?? 0, y: origin.y ?? 0, w: size.width ?? w.get_width(), h: size.height ?? w.get_height() }
			: null
	}
	out.a = bounds(view2)
	out.b = bounds(view3)

	// Natural measure through leaf callbacks (labels' real text size).
	const [minW, natW] = view1.measure(Gtk.Orientation.HORIZONTAL, -1)
	out.measure = { minW, natW }

	// Direction flip: style update re-syncs the dict on the next pass.
	apply(container, [
		{
			op: 'update',
			id: 1,
			props: {
				style: { display: 'flex', flexDirection: 'column', gap: 4, width: 200, height: 60 },
			},
		} as UniversalHostCommand,
	])
	view1.size_allocate(rect(0, 0, 200, 60), -1)
	out.columnA = bounds(view2)
	out.columnB = bounds(view3)
}

apply(container, [
	{ op: 'remove', id: 2 } as UniversalHostCommand,
	{ op: 'destroy', id: 2 } as UniversalHostCommand,
	{ op: 'remove', id: 3 } as UniversalHostCommand,
	{ op: 'destroy', id: 3 } as UniversalHostCommand,
	{ op: 'remove', id: 1 } as UniversalHostCommand,
	{ op: 'destroy', id: 1 } as UniversalHostCommand,
])
out.destroyed = true

print(`MASON_SMOKE ${JSON.stringify(out)}`)
