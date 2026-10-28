import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot, registerStylesheet } from '@octane-xplat/linux-gtk'
import { setTranslate } from '@octane-xplat/ui'
import { Animated, animations } from './ui-animation.gtk'
Gtk.init()
const window = new Gtk.Window({ default_width: 320, default_height: 280 })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {
	onUncaughtError(error) {
		throw error
	},
})
registerStylesheet(
	'animation-priority',
	'@keyframes held-opacity { from { opacity: 0.6; } to { opacity: 0.6; } } .held-opacity { animation: held-opacity 10ms forwards; }',
)
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 80) =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
			resolve()
			return false
		}),
	)
let checks = 0
const check = (label: string, ok: boolean) => {
	if (!ok) throw new Error(label)
	checks++
}
const node = (id: string) => [...container.nodes.values()].find((n) => n.props.id === id)!
async function run() {
	root.render(Animated, { version: 1 })
	window.present()
	await pause(200)
	const moving = node('moving').view!
	check(
		'refs remain Gtk widgets with real transform properties',
		moving instanceof Gtk.Widget && moving.translateX === 0,
	)
	const translated = node('translated').view!
	check(
		'transform getters resolve authored shorthand and defaults',
		translated.translateX === 3 && translated.translateY === 4 && translated.perspective === 300,
	)
	const origin = moving.getBounds()
	setTranslate(moving, 10, 15)
	check(
		'imperative transform reads are synchronous',
		moving.translateX === 10 && moving.translateY === 15,
	)
	await pause()
	check(
		'setTranslate changes actual GTK allocation bounds',
		Math.abs(moving.getBounds().x - origin.x - 10) < 1 &&
			Math.abs(moving.getBounds().y - origin.y - 15) < 1,
	)
	const motion = animations.motion
	const run = motion.to(60, { duration: 250 })
	await pause(70)
	check('timed animation samples intermediate values in GJS', motion.value > 0 && motion.value < 60)
	check('timed animation settles', (await run).status === 'finished' && motion.value === 60)
	await pause()
	check(
		'animated translation reaches GTK geometry',
		Math.abs(moving.getBounds().x - origin.x - 60) < 1,
	)
	check(
		'opacity run settles',
		(await animations.opacity.to(0.4, { duration: 0 })).status === 'finished',
	)
	await pause()
	check(
		'opacity reaches native GTK widget',
		Math.abs(node('fading').view!.get_opacity() - 0.4) < 0.01,
	)
	await animations.width.to(80, { duration: 30 })
	await pause()
	check(
		'width animation changes actual allocation without shadowing GTK width',
		node('growing').view!.get_width() === 80 && node('growing').props.style.width === 40,
	)
	await animations.scale.to(2, { duration: 0 })
	await pause()
	const scaling = node('scaling').view!
	check(
		'uniform scale composes both axes while retaining layout size',
		scaling.scaleX === 2 &&
			scaling.scaleY === 2 &&
			scaling.getActualSize().width === 40 &&
			Math.abs(scaling.getBounds().width - 80) < 1,
	)
	root.render(Animated, { version: 2 })
	await pause()
	check(
		'unrelated renders preserve local numeric styles and hook identity',
		animations.motion === motion && node('growing').view!.get_width() === 80,
	)
	root.render(Animated, { version: 3, keyframes: true })
	await pause()
	check(
		'CSS keyframe samples override local numeric styles',
		Math.abs(node('fading').view!.get_opacity() - 0.6) < 0.01,
	)
	root.render(Animated, { version: 4 })
	await pause()
	check(
		'removing keyframes reveals the current local value',
		Math.abs(node('fading').view!.get_opacity() - 0.4) < 0.01,
	)
	delete node('growing').view!.style.width
	await pause()
	check(
		'deleting local numeric style restores authored inline style',
		node('growing').view!.get_width() === 40,
	)
	const replaced = motion.to(100, { duration: 500 })
	const replacement = motion.to(20, { duration: 0 })
	check(
		'replacement settles old playback as cancelled',
		(await replaced).status === 'cancelled' && (await replacement).status === 'finished',
	)
	const stopped = motion.to(100, { duration: 500 })
	await pause(40)
	motion.stop()
	const sample = motion.value
	await pause()
	check(
		'stop freezes the sample and settles cancellation',
		(await stopped).status === 'cancelled' && motion.value === sample,
	)
	check(
		'spring settles on the exact target',
		(await motion.spring(5, { damping: 20, stiffness: 200 })).status === 'finished' &&
			motion.value === 5,
	)
	let invalid = false
	try {
		moving.style.translateX = NaN
	} catch {
		invalid = true
	}
	check(
		'nonfinite host writes fail without changing the current value',
		invalid && moving.translateX === 5,
	)
	let unsupported = false
	try {
		moving.style.unsupportedNumericProperty = 1
	} catch {
		unsupported = true
	}
	check('unsupported numeric properties fail instead of creating inert fields', unsupported)
	const detach = motion.to(100, { duration: 500 })
	motion.ref(null)
	check('detaching ref cancels pending animation', (await detach).status === 'cancelled')
	motion.ref(moving)
	const disposed = motion.to(100, { duration: 500 })
	root.unmount()
	check('unmount cancels pending animation', (await disposed).status === 'cancelled')
	await pause()
	check(
		'disposed refs cannot schedule new style work',
		moving.getBounds() === null && container.nodes.size === 0,
	)
	moving.translateX = 200
	await pause()
	check('stale style writes do not revive destroyed nodes', container.nodes.size === 0)
	window.destroy()
	print(
		'GTK_UI_ANIMATION ' +
			JSON.stringify({
				checks,
				gtk: `${Gtk.MAJOR_VERSION}.${Gtk.MINOR_VERSION}.${Gtk.MICRO_VERSION}`,
			}),
	)
}
let failure: unknown
run()
	.catch((error) => {
		failure = error
	})
	.finally(() => loop.quit())
loop.run()
if (failure) throw failure
