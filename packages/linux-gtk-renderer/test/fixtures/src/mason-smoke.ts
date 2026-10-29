// Driver-level mason smoke — exercises instantiate → MasonView host →
// insert → styleDict → engine compute → size_allocate → leaf measure on
// real GJS+GTK, headless. Prints one JSON result object; the node test
// asserts on it. Requires the XplatMason typelib (native/xplatmason
// build.sh) on the GI search path.
import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GObject from 'gi://GObject'
import Graphene from 'gi://Graphene'
import GLib from 'gi://GLib'
import { createGtkContainer, gtkDriver, registerStylesheet } from '@octane-xplat/linux-gtk'
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
			? {
					x: origin.x ?? 0,
					y: origin.y ?? 0,
					w: size.width ?? w.get_width(),
					h: size.height ?? w.get_height(),
				}
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

// NS transforms ride the child allocation; z-index and clip-path paint in
// the host's snapshot.
apply(container, [
	{
		op: 'create',
		id: 10,
		type: 'masonview',
		props: { style: { width: 200, height: 100 } },
	} as UniversalHostCommand,
	{
		op: 'create',
		id: 11,
		type: 'label',
		props: {
			text: 'moved',
			style: {
				position: 'absolute',
				left: 50,
				top: 30,
				width: 100,
				height: 40,
				transform: 'translate(-50%, -50%)',
				zIndex: 2,
			},
		},
	} as UniversalHostCommand,
	{
		op: 'create',
		id: 12,
		type: 'label',
		props: {
			text: 'turned',
			style: {
				position: 'absolute',
				left: 100,
				top: 50,
				width: 100,
				height: 40,
				transform: 'rotate(90deg)',
				clipPath: 'circle(20 at 50% 50%)',
			},
		},
	} as UniversalHostCommand,
	{ op: 'insert', id: 10, parent: null, before: null } as UniversalHostCommand,
	{ op: 'insert', id: 11, parent: 10, before: null } as UniversalHostCommand,
	{ op: 'insert', id: 12, parent: 10, before: null } as UniversalHostCommand,
])

const view10 = container.nodes.get(10)?.view
const view11 = container.nodes.get(11)?.view
const view12 = container.nodes.get(12)?.view
if (view10) {
	view10.size_allocate(rect(0, 0, 200, 100), -1)
	const box = (w: any) => {
		const [ok, b] = w.compute_bounds(view10)
		return ok
			? {
					x: Math.round(b.origin.x),
					y: Math.round(b.origin.y),
					w: Math.round(b.size.width),
					h: Math.round(b.size.height),
				}
			: null
	}

	out.translated = box(view11)
	out.rotated = box(view12)
	// gtk_widget_pick/contains need a mapped window; replay pick's
	// per-child test — map the point through the child's allocation
	// transform, then test the local box — topmost (last) child first.
	const pick = (x: number, y: number) => {
		for (const [id, child] of [
			[12, view12],
			[11, view11],
		] as const) {
			const [ok, local] = view10.compute_point(child, new Graphene.Point({ x, y }))
			if (
				ok &&
				local.x >= 0 &&
				local.y >= 0 &&
				local.x < child.get_width() &&
				local.y < child.get_height()
			) {
				return id
			}
		}
		return null
	}

	// (10, 20) is inside the translated box only; (150, 30) is inside the
	// rotated box only (its untransformed box starts at y=50).
	out.pickTranslated = pick(10, 20)
	out.pickRotated = pick(150, 30)

	// Paint order + clip ops, recorded through a stand-in snapshot so the
	// assertion doesn't depend on a mapped window.
	const painted: number[] = []
	const ops: string[] = []
	view10.snapshot_child = (child: any) => {
		painted.push(child === view11 ? 11 : child === view12 ? 12 : 0)
	}

	const recorder = new Proxy(
		{},
		{
			get:
				(_target, name: string) =>
				(...args: any[]) => {
					ops.push(name)
					if (name === 'push_rounded_clip') {
						const rr = args[0]
						out.clipRect = {
							x: Math.round(rr.bounds.origin.x),
							y: Math.round(rr.bounds.origin.y),
							w: Math.round(rr.bounds.size.width),
							h: Math.round(rr.bounds.size.height),
							r: Math.round(rr.corner[0].width),
						}
					}
				},
		},
	)

	view10.vfunc_snapshot(recorder)
	out.paintOrder = painted
	out.clipOps = ops
	delete view10.snapshot_child
	// A real Gtk.Snapshot must accept the same calls without throwing.
	try {
		view10.vfunc_snapshot(new Gtk.Snapshot())
		out.realSnapshot = true
	} catch (error) {
		out.realSnapshot = String(error)
	}
}

// Keyframes on a Mason child: animated width reaches the engine's style
// dict, animated translate rides the child allocation transform. Unmapped
// widgets get no frame clock, so allocate by hand after each sample.
registerStylesheet(
	'mason-anim',
	`@keyframes grow { from { width: 40; transform: translateX(0); } to { width: 140; transform: translateX(100); } }
	.grow { animation: grow 400ms linear forwards; }`,
)

await new Promise<void>((resolve) =>
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => (resolve(), false)),
)

apply(container, [
	{
		op: 'create',
		id: 20,
		type: 'label',
		props: {
			text: 'grow',
			className: 'grow',
			style: { position: 'absolute', left: 0, top: 0, height: 20 },
		},
	} as UniversalHostCommand,
	{ op: 'insert', id: 20, parent: 10, before: null } as UniversalHostCommand,
])

const view20 = container.nodes.get(20)?.view
const growBox = () => {
	view10?.size_allocate(rect(0, 0, 200, 100), -1)
	const [ok, b] = view20.compute_bounds(view10)
	return ok ? { x: Math.round(b.origin.x), w: Math.round(b.size.width) } : null
}

out.growStart = growBox()
await new Promise<void>((resolve) =>
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, 200, () => (resolve(), false)),
)

out.growMid = growBox()
await new Promise<void>((resolve) =>
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, 350, () => (resolve(), false)),
)

out.growEnd = growBox()

// Mason walks nested containers directly, so their GTK border boxes must
// contribute to intrinsic sizing. Current GTK measure/allocate roots consume
// content dimensions and must not count the same border twice.
const borderStyle = {
	display: 'flex',
	borderTopWidth: 2,
	borderRightWidth: 3,
	borderBottomWidth: 4,
	borderLeftWidth: 5,
}
apply(container, [
	{
		op: 'create',
		id: 30,
		type: 'masonview',
		props: {
			style: {
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'flex-start',
				width: 200,
				height: 120,
			},
		},
	} as UniversalHostCommand,
	{
		op: 'create',
		id: 31,
		type: 'masonview',
		props: { style: borderStyle },
	} as UniversalHostCommand,
	{
		op: 'create',
		id: 32,
		type: 'masonview',
		props: { style: { width: 40, height: 20 } },
	} as UniversalHostCommand,
	{ op: 'insert', id: 30, parent: null, before: null } as UniversalHostCommand,
	{ op: 'insert', id: 31, parent: 30, before: null } as UniversalHostCommand,
	{ op: 'insert', id: 32, parent: 31, before: null } as UniversalHostCommand,
])
const borderParent = container.nodes.get(30)!.view!
const borderBox = container.nodes.get(31)!.view!
const borderContent = container.nodes.get(32)!.view!
const borderSample = () => {
	borderParent.size_allocate(rect(0, 0, 200, 120), -1)
	const [boxOk, box] = borderBox.compute_bounds(borderParent)
	const [contentOk, content] = borderContent.compute_bounds(borderParent)
	const [, natW] = borderBox.measure(Gtk.Orientation.HORIZONTAL, -1)
	const [, natH] = borderBox.measure(Gtk.Orientation.VERTICAL, -1)
	return {
		w: boxOk ? box.size.width : -1,
		h: boxOk ? box.size.height : -1,
		contentX: contentOk ? content.origin.x : -1,
		contentY: contentOk ? content.origin.y : -1,
		contentW: contentOk ? content.size.width : -1,
		contentH: contentOk ? content.size.height : -1,
		natW,
		natH,
	}
}
out.borderAuto = borderSample()
apply(container, [
	{ op: 'update', id: 31, props: { style: { display: 'flex' } } } as UniversalHostCommand,
])
out.borderDropped = borderSample()
apply(container, [
	{
		op: 'update',
		id: 31,
		props: { style: { ...borderStyle, width: 70, height: 50 } },
	} as UniversalHostCommand,
])
out.borderFixed = borderSample()
apply(container, [
	{ op: 'remove', id: 32 } as UniversalHostCommand,
	{ op: 'destroy', id: 32 } as UniversalHostCommand,
	{ op: 'remove', id: 31 } as UniversalHostCommand,
	{ op: 'destroy', id: 31 } as UniversalHostCommand,
	{ op: 'remove', id: 30 } as UniversalHostCommand,
	{ op: 'destroy', id: 30 } as UniversalHostCommand,
])

apply(container, [
	{ op: 'remove', id: 20 } as UniversalHostCommand,
	{ op: 'destroy', id: 20 } as UniversalHostCommand,
	{ op: 'remove', id: 11 } as UniversalHostCommand,
	{ op: 'destroy', id: 11 } as UniversalHostCommand,
	{ op: 'remove', id: 12 } as UniversalHostCommand,
	{ op: 'destroy', id: 12 } as UniversalHostCommand,
	{ op: 'remove', id: 10 } as UniversalHostCommand,
	{ op: 'destroy', id: 10 } as UniversalHostCommand,
	{ op: 'remove', id: 2 } as UniversalHostCommand,
	{ op: 'destroy', id: 2 } as UniversalHostCommand,
	{ op: 'remove', id: 3 } as UniversalHostCommand,
	{ op: 'destroy', id: 3 } as UniversalHostCommand,
	{ op: 'remove', id: 1 } as UniversalHostCommand,
	{ op: 'destroy', id: 1 } as UniversalHostCommand,
])

out.destroyed = true

print(`MASON_SMOKE ${JSON.stringify(out)}`)
