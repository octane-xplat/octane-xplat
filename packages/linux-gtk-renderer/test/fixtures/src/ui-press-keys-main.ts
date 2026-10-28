import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { PressKeys, events, buttonRef } from './ui-press-keys.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK press keys test',
	default_width: 340,
	default_height: 300,
	decorated: false,
})
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {
	onUncaughtError(error) {
		throw error
	},
})
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 80) =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
			resolve()
			return false
		}),
	)
let checks = 0
const check = (name: string, ok: boolean) => {
	if (!ok) throw new Error(name)
	checks++
}
const node = (id: string) => [...container.nodes.values()].find((n) => n.props.id === id)!
const controller = (view: any) => {
	const all = view.observe_controllers()
	for (let i = 0; i < all.get_n_items(); i++)
		if (all.get_item(i) instanceof Gtk.EventControllerKey) return all.get_item(i)
	throw new Error('no keyboard controller')
}
const down = (view: any, key: number, mods = 0) =>
	controller(view).emit('key-pressed', key, 0, mods)
const up = (view: any, key: number, mods = 0) => controller(view).emit('key-released', key, 0, mods)
let props: Parameters<typeof PressKeys>[0] = { version: 1 }
const render = () => root.render(PressKeys, props)
let ack = 0
const keys = new Gtk.EventControllerKey()
keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
keys.connect('key-pressed', (_controller: any, key: number) => {
	if (key === 65481) {
		ack++
		return true
	}
	return false
})
window.add_controller(keys)
async function phase(phase: string) {
	const next = ack + 1
	print('GTK_PRESS_KEYS_READY ' + JSON.stringify({ phase }))
	for (let i = 0; i < 250 && ack < next; i++) await pause(20)
	check('OS phase completed ' + phase, ack >= next)
	await pause()
}
let osInput = false
async function run() {
	render()
	window.present()
	await pause(180)
	let button = node('key-button').view!
	const link = node('key-link').view!,
		peer = node('key-peer').view!
	peer.focus()
	await pause()
	check('semantic button accepts native focus', button.get_focusable() && button.focus())
	await pause()
	events.length = 0
	check('Return down is consumed', down(button, Gdk.KEY_Return) === true)
	check('key down fires press-in only', events.join() === 'in:1')
	down(button, Gdk.KEY_Return)
	check('autorepeat does not repeat press-in', events.join() === 'in:1')
	up(button, Gdk.KEY_Return)
	check('release fires press-out before one press', events.join() === 'in:1,out:1,press:1')
	events.length = 0
	down(button, Gdk.KEY_space)
	props = { ...props, version: 2 }
	render()
	await pause()
	up(button, Gdk.KEY_space)
	check('prop update retains native button identity', node('key-button').view === button)
	check('held key releases through current owner callbacks', events.join() === 'in:1,out:2,press:2')
	events.length = 0
	down(button, Gdk.KEY_space)
	peer.focus()
	await pause()
	up(button, Gdk.KEY_space)
	check('focus loss cancels without activation', events.join() === 'in:2,out:2')
	button.focus()
	await pause()
	events.length = 0
	down(button, Gdk.KEY_space)
	up(button, Gdk.KEY_space, Gdk.ModifierType.CONTROL_MASK)
	check('modified release cancels an active gesture', events.join() === 'in:2,out:2')
	events.length = 0
	check(
		'modified shortcut is not consumed',
		down(button, Gdk.KEY_space, Gdk.ModifierType.CONTROL_MASK) === false,
	)
	up(button, Gdk.KEY_space, Gdk.ModifierType.CONTROL_MASK)
	check('modified shortcut does not activate', events.length === 0)
	down(button, Gdk.KEY_space)
	props = { ...props, disabled: true }
	render()
	await pause()
	const before = events.length
	up(button, Gdk.KEY_space)
	check('disabled pressable becomes natively insensitive', !button.get_sensitive())
	check(
		'disabling while held cannot activate on release',
		events.length === before && !events.some((e) => e.startsWith('press:')),
	)
	props = { ...props, disabled: false }
	render()
	await pause()
	check('reenabling restores native sensitivity', button.get_sensitive())
	link.focus()
	await pause()
	events.length = 0
	check('link leaves Space to native navigation', down(link, Gdk.KEY_space) === false)
	up(link, Gdk.KEY_space)
	check('Space does not activate a link', events.length === 0)
	down(link, Gdk.KEY_Return)
	up(link, Gdk.KEY_Return)
	check('Return activates semantic link', events.join() === 'link:2')
	node('key-child').view!.focus()
	await pause()
	events.length = 0
	check(
		'ancestor pressable does not consume child entry input',
		down(node('key-nested').view!, Gdk.KEY_space) === false,
	)
	up(node('key-nested').view!, Gdk.KEY_space)
	check('child focus does not activate parent', events.length === 0)
	check('neutral gesture view gets no keyboard stop', !node('key-neutral').view!.get_focusable())
	if (GLib.getenv('GTK_PRESS_KEYS_OS') === '1') {
		peer.focus()
		await pause()
		events.length = 0
		await phase('tab')
		check('actual Tab reaches semantic button', window.get_focus() === button)
		await phase('space')
		check('actual Space runs ordered activation callbacks', events.join() === 'in:2,out:2,press:2')
		events.length = 0
		await phase('return')
		check('actual Return activates once', events.join() === 'in:2,out:2,press:2')
		events.length = 0
		await phase('hold')
		check('actual held key has only press-in', events.join() === 'in:2')
		peer.focus()
		await pause()
		await phase('release')
		check('actual focus loss cancels held key', events.join() === 'in:2,out:2')
		node('key-child').view!.focus()
		await pause()
		events.length = 0
		await phase('child')
		check(
			'actual Space edits nested entry without ancestor activation',
			node('key-child').view!.get_text().includes(' ') && events.length === 0,
		)
		osInput = true
	}
	const childEntry = node('key-child').view!
	childEntry.focus()
	await pause()
	const delegate = window.get_focus()
	const parent = node('key-nested').view
	props = { ...props, nestedRole: 'link' }
	render()
	await pause()
	check('parent role replacement preserves child entry', node('key-child').view === childEntry)
	check('parent role replacement preserves exact focus delegate', window.get_focus() === delegate)
	check('focused child survives an actual native parent swap', node('key-nested').view !== parent)
	button.focus()
	await pause()
	const original = button
	const logical = node('key-button')
	const label = node('key-action-label').view
	props = { ...props, role: 'link' }
	render()
	await pause()
	button = node('key-button').view!
	check('role change replaces realized native widget', button !== original)
	check('role change updates public ref', buttonRef.current === button)
	check('role change preserves logical node identity', node('key-button') === logical)
	check('role change preserves native children', node('key-action-label').view === label)
	check('role change restores focus to the replacement', window.get_focus() === button)
	check('replacement has link role', button.get_accessible_role() === Gtk.AccessibleRole.LINK)
	events.length = 0
	check('replacement link leaves Space unconsumed', down(button, Gdk.KEY_space) === false)
	up(button, Gdk.KEY_space)
	down(button, Gdk.KEY_Return)
	up(button, Gdk.KEY_Return)
	check('replacement receives replayed current callbacks', events.join() === 'in:2,out:2,press:2')
	props = { ...props, role: 'button' }
	render()
	await pause()
	button = node('key-button').view!
	check(
		'role can return to a focused button',
		button.get_accessible_role() === Gtk.AccessibleRole.BUTTON && window.get_focus() === button,
	)
	props = { ...props, role: null }
	render()
	await pause()
	button = node('key-button').view!
	check(
		'role removal restores native generic role',
		button.get_accessible_role() === Gtk.AccessibleRole.GENERIC,
	)
	check('role removal removes keyboard stop', !button.get_focusable())
	check('role removal updates public ref', buttonRef.current === button)
	props = { ...props, role: 'button' }
	render()
	await pause()
	button = node('key-button').view!
	button.focus()
	await pause()
	events.length = 0
	down(button, Gdk.KEY_space)
	const stale = controller(button)
	props = { ...props, show: false }
	render()
	await pause()
	const count = events.length
	stale.emit('key-released', Gdk.KEY_space, 0, 0)
	check('disposed controller cannot activate', events.length === count)
	check(
		'disposed widget has no keyboard controller',
		!(() => {
			try {
				controller(button)
				return true
			} catch {
				return false
			}
		})(),
	)
	root.unmount()
	await pause()
	check('all nodes disposed', container.nodes.size === 0)
	check('unmount clears the current public ref', buttonRef.current === null)
	print(
		'GTK_PRESS_KEYS ' +
			JSON.stringify({
				checks,
				osInput,
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
