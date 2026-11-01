import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gdk from 'gi://Gdk?version=4.0'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { App, events } from './ui-primitives.gtk'
import './ui-primitives.css'
Gtk.init()
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const { root, container } = createGtkRoot(host, {
	onUncaughtError(error) {
		throw error
	},
})

const loop = GLib.MainLoop.new(null, false)
let failure: unknown
let checks = 0
const check = (name: string, pass: boolean) => {
	if (!pass) {
		throw new Error(name)
	}
	checks++
}

const pause = () =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, 15, () => {
			resolve()
			return false
		}),
	)

const node = (id: string) => [...container.nodes.values()].find((n) => n.props.id === id)!
const props = { disabled: false, version: 1, horizontal: true }
async function run() {
	root.render(App, props)
	await pause()
	for (const id of [
		'primitives',
		'gesture',
		'flow',
		'vertical',
		'horizontal',
		'stack-item',
		'spacer',
		'grid',
		'span',
		'center',
		'section',
		'layout',
		'header',
		'footer',
		'panel',
		'content',
		'absolute',
		'badge',
		'divider',
		'swatch',
	]) {
		check(`${id} mounts a real widget`, node(id)?.view instanceof Gtk.Widget)
	}
	check(
		'size context inherits and permits explicit override',
		node('size-result').view!.get_label() === 'lg:sm:lg',
	)
	check(
		'Stack forwards horizontal direction and spacing',
		node('flow').computedStyle?.flexDirection === 'row' && node('flow').computedStyle?.gap === 8,
	)
	check(
		'Grid forwards track contract',
		node('grid').computedStyle?.gridTemplateColumns === '1fr 1fr',
	)
	check('GridSpan forwards span contract', node('span').computedStyle?.gridColumn === 'span 2')
	check(
		'swatch color reaches the cascade',
		node('swatch').computedStyle?.backgroundColor === '#123456',
	)
	const engine = (node('primitives').view!.constructor as any).$gtype.name
	if (engine === 'XplatMasonView') {
		const flow = node('flow').view!
		const rect = new Gdk.Rectangle()
		rect.x = 0
		rect.y = 0
		rect.width = 200
		rect.height = 50
		flow.size_allocate(rect, -1)
		const [okA, a] = node('alpha').view!.compute_bounds(flow)
		const [okB, b] = node('beta').view!.compute_bounds(flow)
		check(
			'Mason allocates real labels in a row with an 8px gap',
			okA && okB && a.size.width > 0 && Math.abs(b.origin.x - a.size.width - 8) < 1,
		)

		const grid = node('grid').view!
		rect.width = 400
		rect.height = 1000
		node('primitives').view!.size_allocate(rect, -1)
		const [okSpan, span] = node('span').view!.compute_bounds(grid)
		const [okLeft, left] = node('grid-a').view!.compute_bounds(grid)
		const [okRight, right] = node('grid-b').view!.compute_bounds(grid)
		check(
			'GridSpan occupies both engine columns: ' +
				JSON.stringify({ gridWidth: grid.get_width(), spanWidth: (span as any).size.width }),
			okSpan && Math.abs((span as any).size.width - 400) < 1,
		)

		check(
			'Grid auto-placement respects the next row and equal tracks',
			okLeft &&
				okRight &&
				Math.abs((left as any).origin.y - 30) < 1 &&
				Math.abs((right as any).origin.y - 30) < 1 &&
				Math.abs((right as any).origin.x - 200) < 1 &&
				Math.abs((left as any).size.width - 200) < 1,
		)

		root.render(App, { ...props, gridWidth: 200 })
		await pause()
		node('primitives').view!.size_allocate(rect, -1)
		const [okResize, resized] = node('span').view!.compute_bounds(grid)
		check(
			'nested Grid keeps its widget and follows a changed authored width',
			node('grid').view === grid && okResize && Math.abs((resized as any).size.width - 200) < 1,
		)
	}
	const gesture = node('gesture')
	const drag = gesture.controllers.get('pan')![0]
	const touch = gesture.controllers.get('touch')![0]
	const swipe = gesture.controllers.get('swipe')![0]
	const tap = gesture.controllers.get('tap')![0]
	touch.emit('pressed', 1, 10, 20)
	touch.emit('released', 1, 10, 20)
	tap.emit('released', 1, 10, 20)
	check(
		'press callbacks run in order',
		events
			.slice(0, 3)
			.map((e) => e[0])
			.join() === 'in,out,press',
	)
	drag.emit('drag-begin', 10, 20)
	drag.emit('drag-update', 8, 12)
	drag.emit('drag-end', 16, 24)
	await pause()
	const pans = events.filter((e) => e[0] === 'pan')
	check(
		'pan lifecycle preserves began moved ended: ' + JSON.stringify(pans.map((e) => e[2].state)),
		pans.map((e) => e[2].state).join() === 'began,moved,ended',
	)
	check(
		'pan translation uses the shared aliases',
		pans[1][2].x === 8 && pans[1][2].dx === 8 && pans[1][2].y === 12 && pans[1][2].dy === 12,
	)
	check(
		'pan velocities are finite logical units per second',
		pans.every((e) => Number.isFinite(e[2].vx) && Number.isFinite(e[2].vy)),
	)
	check('pan target is the attached GTK widget', pans[1][2].target === gesture.view)
	drag.emit('drag-begin', 0, 0)
	drag.emit('cancel', null)
	drag.emit('drag-end', 0, 0)
	await pause()
	check(
		'cancel ends a pan exactly once',
		events
			.filter((e) => e[0] === 'pan')
			.slice(3)
			.map((e) => e[2].state)
			.join() === 'began,cancelled',
	)
	touch.emit('pressed', 1, 0, 0)
	touch.emit('cancel', null)
	touch.emit('released', 1, 0, 0)
	check(
		'cancel releases a pressed control exactly once',
		events.filter((e) => e[0] === 'out').length === 2,
	)
	swipe.emit('swipe', -500, 100)
	check(
		'swipe maps native direction flags',
		events.some((e) => e[0] === 'swipe' && e[2] === 2),
	)
	root.render(App, { ...props, disabled: true, horizontal: false })
	await pause()
	check(
		'Stack updates direction without replacing the widget',
		node('flow').computedStyle?.flexDirection === 'column',
	)
	if (engine === 'XplatMasonView') {
		const rect = new Gdk.Rectangle()
		rect.x = 0
		rect.y = 0
		rect.width = 400
		rect.height = 1000
		node('primitives').view!.size_allocate(rect, -1)
		const [ok, bounds] = node('span').view!.compute_bounds(node('grid').view!)
		check(
			'clearing Grid width restores stretched tracks after allocation',
			ok && Math.abs((bounds as any).size.width - 400) < 1,
		)
	}
	const count = events.length
	touch.emit('pressed', 1, 0, 0)
	drag.emit('drag-begin', 0, 0)
	tap.emit('released', 1, 0, 0)
	swipe.emit('swipe', 100, 0)
	check(
		'disabled Pressable detaches old event controllers',
		events.length === count && !node('gesture').controllers.has('pan'),
	)
	root.render(App, { ...props, version: 2 })
	await pause()
	node('gesture').controllers.get('tap')![0].emit('released', 1, 0, 0)
	check(
		'updated handlers read current props',
		events.at(-1)?.[0] === 'press' && events.at(-1)?.[1] === 2,
	)
	root.unmount()
	await pause()
	check(
		'unmount removes all widgets and subscriptions',
		host.get_first_child() === null && container.nodes.size === 0,
	)
	print(
		'GTK_UI_PRIMITIVES ' +
			JSON.stringify({
				checks,
				engine,
				gtk: `${Gtk.get_major_version()}.${Gtk.get_minor_version()}.${Gtk.get_micro_version()}`,
			}),
	)
}

const timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 15000, () => {
	failure = new Error('GTK UI test timed out')
	loop.quit()
	return false
})

GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
	void run().then(
		() => loop.quit(),
		(e) => {
			failure = e
			loop.quit()
		},
	)
	return false
})

loop.run()
GLib.source_remove(timeout)
if (failure) {
	throw failure
}
