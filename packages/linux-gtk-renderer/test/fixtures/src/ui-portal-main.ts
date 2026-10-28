import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import {
	createGtkRoot,
	createGtkContainer,
	registerStylesheet,
	gtkDriver,
} from '@octane-xplat/linux-gtk'
import { Portals, refs, lifetime } from './ui-portal.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK portal test',
	default_width: 400,
	default_height: 480,
})
const outer = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const a = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const b = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const prefixA = new Gtk.Label({ label: 'Foreign A' })
const prefixB = new Gtk.Label({ label: 'Foreign B' })
a.append(prefixA)
b.append(prefixB)
outer.append(host)
outer.append(a)
outer.append(b)
window.set_child(outer)
const { root, container } = createGtkRoot(host, {
	onUncaughtError(error) {
		throw error
	},
})
const state = container as any
const loop = GLib.MainLoop.new(null, false)
const pause = () =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, 80, () => {
			resolve()
			return false
		}),
	)
let checks = 0
const check = (name: string, ok: boolean) => {
	if (!ok) throw new Error(name)
	checks++
}
const children = (widget: any) => {
	const result: any[] = []
	for (let child = widget.get_first_child(); child; child = child.get_next_sibling())
		result.push(child)
	return result
}
const text = (name: string) => refs['label-' + name].get_text()
let props: Parameters<typeof Portals>[0] = { target: a, value: 'one', order: ['a', 'b'] }
const render = () => root.render(Portals, props)
async function run() {
	const attempt = root.prepare(Portals, props)
	check('portal preparation is prepared', attempt.status === 'prepared')
	check(
		'preparation never mutates GTK hosts',
		children(a).length === 1 && children(host).length === 0,
	)
	check('preparation never creates host nodes', container.nodes.size === 0)
	if (attempt.status !== 'prepared') throw new Error('unexpected suspension')
	attempt.abort()
	check(
		'aborted preparation releases target registrations',
		state.portalTargets.size === 0 && state.portalTargetsByObject.size === 0,
	)
	render()
	window.present()
	await pause()
	check(
		'portal provider value reaches both panels',
		text('a') === 'one:a:0' && text('b') === 'one:b:0',
	)
	check('external portal preserves caller-owned native child', children(a)[0] === prefixA)
	check(
		'viewless portal ranges preserve native order',
		children(a)
			.map((v) => (v === refs['label-a'] ? 'a' : v === refs['label-b'] ? 'b' : ''))
			.filter(Boolean)
			.join() === 'a,b',
	)
	check(
		'portal refs are parented to target',
		refs['label-a'].get_parent() === a && refs['action-b'].get_parent() === a,
	)
	check('target registrations share one identity', state.portalTargets.size === 1)
	registerStylesheet(
		'portal-cascade',
		':root { --portal-ink: #123456; } #portal-label-a { color: var(--portal-ink); }',
	)
	await pause()
	const labelNode = () =>
		[...container.nodes.values()].find((n) => n.props.id === 'portal-label-a')!
	check(
		'external portal participates in root custom-property cascade',
		labelNode().computedStyle.color === '#123456',
	)
	registerStylesheet(
		'portal-cascade',
		':root { --portal-ink: #654321; } #portal-label-a { color: var(--portal-ink); }',
	)
	await pause()
	check(
		'registered stylesheet restyles external portal subtree',
		labelNode().computedStyle.color === '#654321',
	)
	const label = refs['label-a'],
		action = refs['action-a']
	const controllers = action.observe_controllers()
	for (let i = 0; i < controllers.get_n_items(); i++) {
		const controller = controllers.get_item(i)
		if (controller instanceof Gtk.GestureClick) controller.emit('released', 1, 1, 1)
	}
	await pause()
	check('portal action retains its nested label', children(action).length === 1)
	check('portal event updates its original component state', text('a') === 'one:a:1')
	props = { ...props, value: 'two', order: ['b', 'a'] }
	render()
	await pause()
	check(
		'provider updates preserve portal state',
		text('a') === 'two:a:1' && refs['label-a'] === label,
	)
	check(
		'keyed portal ranges reorder as complete ranges',
		children(a)
			.slice(1)
			.every((v, i) => v === [refs['label-b'], refs['action-b'], label, action][i]),
	)
	const moving = root.prepare(Portals, { ...props, target: b })
	check(
		'retarget preparation does not move widgets',
		label.get_parent() === a && children(b).length === 1,
	)
	if (moving.status !== 'prepared') throw new Error('unexpected suspension')
	moving.abort()
	check(
		'aborted retarget releases only speculative target',
		state.portalTargets.size === 1 && label.get_parent() === a,
	)
	props = { ...props, target: b }
	render()
	await pause()
	check(
		'retarget preserves widgets and state',
		refs['label-a'] === label && refs['action-a'] === action && text('a') === 'two:a:1',
	)
	check(
		'retarget detaches only owned children',
		children(a).length === 1 && children(a)[0] === prefixA,
	)
	check(
		'retarget preserves foreign target content',
		children(b)[0] === prefixB && label.get_parent() === b,
	)
	check(
		'retarget releases previous registration',
		state.portalTargets.size === 1 && !state.portalTargetsByObject.has(a),
	)
	check(
		'retarget does not remount component effects',
		lifetime.mounts === 2 && lifetime.unmounts === 0,
	)
	props = { ...props, target: refs.owned }
	render()
	await pause()
	check(
		'owned Mason target receives portal children',
		label.get_parent() === refs.owned && text('a') === 'two:a:1',
	)
	const owned = [...container.nodes.values()].find((n) => n.props.id === 'portal-owned-target')!
	check(
		'portal and ordinary children share owned layout graph',
		owned.children.length === 3 && owned.children[0].props.id === 'owned-prefix',
	)
	props = { ...props, target: refs.logical }
	render()
	await pause()
	check(
		'viewless target resolves its physical Mason parent',
		label.get_parent() === refs.owned.get_parent(),
	)
	props = { ...props, target: host }
	render()
	await pause()
	check(
		'root host can receive portal content',
		label.get_parent() === host && text('a') === 'two:a:1',
	)
	props = { ...props, show: false }
	render()
	await pause()
	check(
		'removing portals cleans all registrations',
		state.portalTargets.size === 0 && state.portalTargetsByObject.size === 0,
	)
	check(
		'removing portals runs owned effect cleanup',
		lifetime.mounts === 2 && lifetime.unmounts === 2,
	)
	check(
		'foreign children survive portal removal',
		children(a).length === 1 && children(b).length === 1,
	)
	let invalid = false
	try {
		root.prepare(Portals, { ...props, show: true, target: prefixA })
	} catch (error) {
		invalid = String(error).includes('multi-child')
	}
	check('single-child widget target fails during preparation', invalid)
	check(
		'failed preparation leaves no registrations or native changes',
		state.portalTargets.size === 0 && children(a)[0] === prefixA,
	)
	props = { ...props, target: b, show: true }
	render()
	await pause()
	check('root remains usable after rejected target', text('a') === 'two:a:0')
	let transported = false
	try {
		gtkDriver.portals!.prepareTarget({ container, target: b, transported: true } as any)
	} catch (error) {
		transported = String(error).includes('transported')
	}
	check('transported targets reject explicitly', transported)
	props = { ...props, target: refs.owned }
	render()
	await pause()
	check('owned portal target stays live until unmount', refs['label-a'].get_parent() === refs.owned)
	root.unmount()
	await pause()
	check(
		'unmount releases portal registry',
		state.portalTargets.size === 0 && state.portalTargetsByObject.size === 0,
	)
	check('unmount destroys all managed nodes', container.nodes.size === 0)
	check(
		'unmount preserves caller-owned widgets',
		children(b).length === 1 && children(b)[0] === prefixB,
	)
	check(
		'unmount clears portal refs and effects',
		refs['label-a'] === null && lifetime.mounts === lifetime.unmounts,
	)
	// Exercise placement through a viewless range on external GTK layout targets.
	const probe = createGtkContainer(new Gtk.Box()) as any
	for (const [target, type] of [
		[new Gtk.Fixed(), 'fixed'],
		[new Gtk.Grid(), 'grid'],
	] as const) {
		const foreign = new Gtk.Label({ label: 'Unmanaged' })
		if (type === 'fixed') (target as any).put(foreign, 0, 0)
		else (target as any).attach(foreign, 0, 0, 1, 1)
		const registration = gtkDriver.portals!.prepareTarget({
			container: probe,
			target,
			transported: false,
			createPortalTargetHandle: (id: number) => ({
				$$kind: 'octane.universal.portal-target',
				renderer: 'gtk',
				root: 'probe',
				id,
			}),
		} as any)
		const apply = (commands: any[]) =>
			gtkDriver.prepareBatch(probe, { renderer: 'gtk', commands } as any).apply()
		apply([
			{ op: 'create', id: 9000, type: 'proxyviewcontainer', props: {} },
			{
				op: 'create',
				id: 9001,
				type: 'label',
				props: { text: 'Placed', x: 12, y: 18, row: 2, col: 3 },
			},
			{ op: 'insert', id: 9001, parent: 9000, before: null },
			{ op: 'insert', id: 9000, parent: registration.handle, before: null },
		])
		outer.append(target)
		await pause()
		const placed = probe.nodes.get(9001).view
		check(
			type + ' target parents only top-level range widget',
			placed.get_parent() === target && foreign.get_parent() === target,
		)
		if (type === 'fixed') {
			const [x, y] = (target as any).get_child_position(placed)
			check(
				'fixed target uses descendant placement props: ' +
					JSON.stringify({
						x,
						y,
						fixedX: probe.nodes.get(9001).fixedX,
						fixedY: probe.nodes.get(9001).fixedY,
					}),
				x === 12 && y === 18,
			)
		} else {
			const [col, row] = (target as any).query_child(placed)
			check('grid target uses descendant placement props', col === 3 && row === 2)
		}
		apply([{ op: 'update', id: 9001, props: { text: 'Moved', x: 24, y: 36, row: 4, col: 5 } }])
		await pause()
		if (type === 'fixed') {
			const [x, y] = (target as any).get_child_position(placed)
			check('fixed position updates through viewless parent', x === 24 && y === 36)
		} else {
			const [col, row] = (target as any).query_child(placed)
			check('grid position updates through viewless parent', col === 5 && row === 4)
		}
		let foreignHandle = false
		try {
			apply([
				{
					op: 'insert',
					id: 9000,
					parent: { ...registration.handle, root: 'foreign' },
					before: null,
				},
			])
		} catch (error) {
			foreignHandle = String(error).includes('foreign')
		}
		check(type + ' target rejects foreign root handle', foreignHandle)
		apply([
			{ op: 'remove', id: 9000 },
			{ op: 'destroy', id: 9001 },
			{ op: 'destroy', id: 9000 },
		])
		registration.release()
		registration.release()
		check(
			type + ' cleanup releases once and preserves foreign widget',
			probe.portalTargets.size === 0 &&
				children(target).length === 1 &&
				children(target)[0] === foreign,
		)
	}
	print(
		'GTK_PORTAL ' +
			JSON.stringify({
				checks,
				gtk: [Gtk.MAJOR_VERSION, Gtk.MINOR_VERSION, Gtk.MICRO_VERSION].join('.'),
			}),
	)
}
let failure: unknown
run()
	.catch((error) => {
		failure = error
		printerr(error.stack ?? String(error))
	})
	.finally(() => {
		root.unmount()
		window.destroy()
		loop.quit()
	})
loop.run()
if (failure) throw failure
