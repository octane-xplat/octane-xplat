import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { BoxModelScene } from './ui-box-model.gtk'

Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK box model test',
	default_width: 360,
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
const pause = (ms = 160) =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
			resolve()
			return false
		}),
	)
let checks = 0
const failures: string[] = []
const check = (name: string, ok: boolean) => {
	checks++
	if (!ok) failures.push(name)
}
const close = (actual: number, expected: number) => Math.abs(actual - expected) <= 1
const node = (name: string) => [...container.nodes.values()].find((n) => n.cssClasses?.has(name))!
const bounds = (name: string) => node(name).view!.getBounds()
const initialBox = {
	width: 80,
	height: 50,
	marginLeft: 4,
	marginRight: 6,
	marginTop: 3,
	marginBottom: 5,
	paddingLeft: 7,
	paddingRight: 9,
	paddingTop: 6,
	paddingBottom: 4,
	borderWidth: 2,
}
const initialLeaf = {
	width: 60,
	height: 24,
	marginLeft: 7,
	marginRight: 9,
	marginTop: 2,
	marginBottom: 1,
	padding: 0,
	borderWidth: 0,
}
let props: Parameters<typeof BoxModelScene>[0] = { box: initialBox, leaf: initialLeaf }
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(BoxModelScene, props)
	await pause()
}
const first = () => bounds('box-first')
const leaf = () => bounds('box-leaf')
const last = () => bounds('box-last')
const content = () => bounds('box-content')
async function run() {
	await render()
	window.present()
	await pause(260)
	const original = node('box-first').view
	check('container width excludes margins', close(first().width, 80))
	check('container height excludes margins', close(first().height, 50))
	check('container left margin is outside its box', close(first().x, 4))
	check('container top margin is outside its box', close(first().y, 3))
	check('container border plus left padding inset content once', close(content().x - first().x, 9))
	check('container border plus top padding inset content once', close(content().y - first().y, 8))
	check('content width remains authored', close(content().width, 20))
	check('content height remains authored', close(content().height, 10))
	check('leaf width excludes margins', close(leaf().width, 60))
	check('leaf height excludes margins', close(leaf().height, 24))
	check('leaf top margin is outside its box', close(leaf().y, 2))
	check(
		'sibling gap includes both intervening margins',
		close(leaf().x - first().x - first().width, 6 + 8 + 7),
	)
	check(
		'following sibling includes leaf right margin',
		close(last().x - leaf().x - leaf().width, 9 + 8),
	)
	const measure = node('box-first').view!.measure(Gtk.Orientation.HORIZONTAL, -1)
	check('GTK natural width includes outer margin exactly once', close(measure[1], 90))
	await render({ box: { ...initialBox, width: undefined, height: undefined } })
	check('natural container width includes child padding and border', close(first().width, 40))
	check('natural container height includes child padding and border', close(first().height, 24))
	check('natural container keeps authored outer margin', close(first().x, 4) && close(first().y, 3))
	check(
		'natural sibling position includes the smaller container',
		close(leaf().x, 4 + 40 + 6 + 8 + 7),
	)
	check(
		'natural GTK measurement excludes double padding',
		close(node('box-first').view!.measure(Gtk.Orientation.HORIZONTAL, -1)[1], 50),
	)
	await render({ box: { ...initialBox, width: '50%' } })
	check('percentage container width uses parent border-box offer', close(first().width, 150))
	check('percentage margin stays outside width', close(leaf().x - first().x - first().width, 21))
	await render({ box: { ...initialBox, width: 200, maxWidth: 100 } })
	check('max width constrains the border box', close(first().width, 100))
	check('max width preserves content inset', close(content().x - first().x, 9))
	await render({ box: { ...initialBox, width: 40, minWidth: 70 } })
	check('min width constrains the border box', close(first().width, 70))
	await render({
		box: { width: 80, height: 50 },
		leaf: { width: 60, height: 24, padding: 0, borderWidth: 0 },
	})
	check('container margin clears', close(first().x, 0) && close(first().y, 0))
	check(
		'container dimensions survive margin clearing',
		close(first().width, 80) && close(first().height, 50),
	)
	check(
		'padding and border clear',
		close(content().x - first().x, 0) && close(content().y - first().y, 0),
	)
	check('leaf margin clears', close(leaf().x - first().x - first().width, 8) && close(leaf().y, 0))
	check(
		'following sibling has one gap after margin clear',
		close(last().x - leaf().x - leaf().width, 8),
	)
	await render({
		leaf: {
			marginLeft: 7,
			marginRight: 9,
			marginTop: 2,
			marginBottom: 1,
			padding: 0,
			borderWidth: 0,
		},
	})
	const naturalLeafWidth = leaf().width,
		naturalLeafHeight = leaf().height
	check('natural leaf has a positive measured width', naturalLeafWidth > 0)
	check('natural leaf has a positive measured height', naturalLeafHeight > 0)
	check('natural leaf margin is outside layout', close(leaf().x - first().x - first().width, 15))
	check(
		'natural leaf GTK measurement adds margins once',
		close(node('box-leaf').view!.measure(Gtk.Orientation.HORIZONTAL, -1)[1], naturalLeafWidth + 16),
	)
	await render({ leaf: { padding: 0, borderWidth: 0 } })
	check('natural leaf width is stable when margins clear', close(leaf().width, naturalLeafWidth))
	check('natural leaf height is stable when margins clear', close(leaf().height, naturalLeafHeight))
	await render({ box: initialBox, leaf: initialLeaf, direction: 'rtl' })
	check('RTL reaches the row', node('box-row').view!.get_direction() === Gtk.TextDirection.RTL)
	check(
		'RTL reaches the box and leaf',
		node('box-first').view!.get_direction() === Gtk.TextDirection.RTL &&
			node('box-leaf').view!.get_direction() === Gtk.TextDirection.RTL,
	)
	check('RTL reverses physical child order', first().x > leaf().x && leaf().x > last().x)
	await render({ direction: undefined })
	check(
		'clearing RTL restores widget direction',
		node('box-row').view!.get_direction() === Gtk.TextDirection.LTR,
	)
	check(
		'clearing RTL restores child directions',
		node('box-first').view!.get_direction() === Gtk.TextDirection.LTR &&
			node('box-leaf').view!.get_direction() === Gtk.TextDirection.LTR,
	)
	check('clearing RTL restores physical order', first().x < leaf().x && leaf().x < last().x)
	check(
		'clearing RTL restores asymmetric margins',
		close(first().x, 4) && close(leaf().x - first().x - first().width, 21),
	)
	;(Gtk.Widget as any).set_default_direction(Gtk.TextDirection.RTL)
	await render()
	check(
		'application RTL default reaches widgets',
		node('box-row').view!.get_direction() === Gtk.TextDirection.RTL,
	)
	check('application RTL default reaches Mason order', first().x > leaf().x && leaf().x > last().x)
	;(Gtk.Widget as any).set_default_direction(Gtk.TextDirection.LTR)
	await render()
	check(
		'restored application direction reaches widgets',
		node('box-row').view!.get_direction() === Gtk.TextDirection.LTR,
	)
	check(
		'restored application direction reaches Mason order',
		first().x < leaf().x && leaf().x < last().x,
	)
	const before = first()
	await render({ box: { ...initialBox, scaleX: 2, scaleY: 2 } })
	check('transform scales border width without outer margins', close(first().width, 160))
	check('transform scales border height without outer margins', close(first().height, 100))
	check(
		'transform keeps the border-box center x',
		close(first().x + first().width / 2, before.x + before.width / 2),
	)
	check(
		'transform keeps the border-box center y',
		close(first().y + first().height / 2, before.y + before.height / 2),
	)
	await render({ box: initialBox })
	check('transform reset restores x', close(first().x, before.x))
	check('transform reset restores width', close(first().width, before.width))
	check('layout updates retain the box widget', node('box-first').view === original)
	root.unmount()
	await pause()
	check('unmount releases all logical nodes', container.nodes.size === 0)
	print(
		'GTK_BOX_MODEL ' +
			JSON.stringify({
				checks,
				failures,
				osInput: false,
				gtk:
					Gtk.get_major_version() + '.' + Gtk.get_minor_version() + '.' + Gtk.get_micro_version(),
			}),
	)
	if (failures.length) throw new Error(failures.join('; '))
	window.destroy()
	loop.quit()
}
let failed = false
run().catch((error) => {
	failed = true
	printerr(String(error))
	printerr(error.stack ?? '')
	;(Gtk.Widget as any).set_default_direction(Gtk.TextDirection.LTR)
	try {
		root.unmount()
	} catch {}
	window.destroy()
	loop.quit()
})
loop.run()
if (failed) (globalThis as any).imports.system.exit(1)
