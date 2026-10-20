import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { App, navigation } from './routing.gtk'
Gtk.init()
print(`GTK ${Gtk.get_major_version()}.${Gtk.get_minor_version()}.${Gtk.get_micro_version()}`)
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
const { root } = createGtkRoot(host)
const loop = GLib.MainLoop.new(null, false)
let failure: unknown
let checks = 0
const check = (name: string, pass: boolean) => {
	if (!pass) {
		throw new Error(name)
	}
	checks++
	print(name)
}

const pause = () =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, 10, () => {
			resolve()
			return false
		}),
	)

function widgets(): any[] {
	const all: any[] = []
	const walk = (node: any) => {
		for (let child = node; child; child = child.get_next_sibling()) {
			all.push(child)
			walk(child.get_first_child())
		}
	}
	walk(host)
	return all
}

const label = (text: string) =>
	widgets().find((widget) => widget.constructor.$gtype.name === 'GtkLabel' && widget.label === text)

async function wait(name: string, condition: () => boolean) {
	const end = Date.now() + 3000
	while (!condition() && Date.now() < end) {
		await pause()
	}
	check(name, condition())
}

async function run() {
	root.render(App, {})
	await pause()
	check(
		'push a commits',
		(await navigation.push({ to: '/probe/:id', params: { id: 'a' } })).status === 'committed',
	)
	await wait('first GTK screen rendered', () => !!label('a:0'))
	const a = label('a:0')
	const button = widgets().find(
		(widget) => widget.constructor.$gtype.name === 'GtkButton' && widget.label === 'Increment a',
	)
	check('GTK event target exists', !!button)
	button.emit('clicked')
	await wait('GTK click updates retained state', () => !!label('a:1'))
	check(
		'push b commits',
		(await navigation.push({ to: '/probe/:id', params: { id: 'b' } })).status === 'committed',
	)
	await wait('second GTK screen rendered', () => !!label('b:0'))
	await wait('inactive GTK entry is hidden', () => {
		for (let widget = a; widget && widget !== host; widget = widget.get_parent()) {
			if (!widget.visible) {
				return true
			}
		}
		return false
	})
	check('Back commits', (await navigation.back()).status === 'committed')
	await wait('Back restores GTK entry state', () => !!label('a:1'))
	check('Back keeps native label identity', label('a:1') === a)
	const modal = await navigation.push({
		to: '/probe/:id',
		params: { id: 'modal' },
		presentation: 'modal',
	})
	check(
		'independent GTK panes explicitly reject modal presentation',
		modal.status === 'unsupported',
	)
	check(
		'unsupported modal preserves the committed GTK screen',
		label('a:1') === a && !label('modal:0'),
	)

	root.unmount()
	navigation.dispose()
	check('GTK outlet disposal releases native children', host.get_first_child() === null)
	print('GTK_ROUTING_OK checks=' + checks)
}

const timeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 15000, () => {
	failure = new Error('GTK routing probe timeout')
	loop.quit()
	return false
})

GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
	void run().then(
		() => loop.quit(),
		(error) => {
			failure = error
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
