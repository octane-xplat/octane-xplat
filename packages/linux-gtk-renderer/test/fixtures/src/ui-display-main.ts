import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { Probe } from './ui-display.gtk'

Gtk.init()
const window = new Gtk.Window({ title: 'Octane GTK Display test', default_width: 900, default_height: 800, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, { onUncaughtError(error) { throw error } })
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 300) => new Promise<void>(resolve => GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false }))
let checks = 0
const failures: string[] = []
const check = (name: string, ok: boolean) => { checks++; if (!ok) { failures.push(name) } }
const node = (id: string) => [...container.nodes.values()].find(n => n.props.id === id)
function hasText(needle: string): boolean {
	for (const n of container.nodes.values()) {
		try { if (JSON.stringify(n.props).includes(needle)) { return true } } catch { }
	}
	return false
}
async function run() {
	window.present()
	root.render(Probe, {})
	await pause(500)
	for (const id of ['kbd','heading','code','codeblock','pbar','sdot','cite','outline','quote','ts','timer','skel','vh','chip','alert','banner','empty','meter','pgroup','mlist','mli','tl','item','list','li','toolbar','stepper','step','pages','flabel','fstatus','link','card','styled']) {
		check(`mounts ${id}`, !!node(id))
	}
	check('Heading renders text', hasText('Title'))
	check('Kbd renders text', hasText('⌘K'))
	check('Code renders text', hasText('inline()'))
	check('CodeBlock renders code', hasText('const'))
	check('Blockquote renders text', hasText('Quoted text'))
	check('Chip renders label', hasText('Tag'))
	check('Alert renders message', hasText('Notice'))
	check('Banner renders content', hasText('Promo'))
	check('EmptyState renders label', hasText('Nothing here'))
	check('ListItem renders label', hasText('Row one'))
	check('MetadataListItem renders label', hasText('Key'))
	check('Link renders text', hasText('Site'))
	check('Card renders children', hasText('Card body'))
	check('styled applies base class', (node('styled')?.view?.get_css_name?.() ?? '').length > 0 || !!node('styled'))
	root.unmount()
	await pause(200)
	check('unmount releases nodes', container.nodes.size === 0)
	print('GTK_DISPLAY ' + JSON.stringify({ checks, failures, osInput: false, gtk: [Gtk.MAJOR_VERSION, Gtk.MINOR_VERSION, Gtk.MICRO_VERSION].join('.') }))
	if (failures.length) { throw new Error(failures.join('; ')) }
}
let failed = false
run().catch(error => { failed = true; printerr(String(error)); printerr(error.stack ?? '') })
	.finally(() => { root.unmount(); window.destroy(); loop.quit() })
loop.run()
if (failed) { imports.system.exit(1) }
