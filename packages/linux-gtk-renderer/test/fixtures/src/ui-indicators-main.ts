import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import {
	Indicators,
	refs,
	reads,
	defaultIndicators,
	getIndicator,
	registerIndicator,
	registerIndicators,
	indicatorScope,
	CustomBox,
	CustomRadio,
	CustomCheck,
} from './ui-indicators.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK indicator test',
	default_width: 440,
	default_height: 380,
})
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const errors: unknown[] = []
const { root, container } = createGtkRoot(host, { onUncaughtError: (error) => errors.push(error) })
const loop = GLib.MainLoop.new(null, false)
const pause = (ms = 180) =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
			resolve()
			return false
		}),
	)
let checks = 0
const check = (name: string, ok: boolean) => {
	if (!ok) {
		throw new Error(name)
	}
	checks++
}
const find = (id: string) => [...container.nodes.values()].find((n) => n.props.id === id)
const node = (id: string) => {
	const value = find(id)
	if (!value) {
		throw new Error('missing ' + id)
	}
	return value
}
const child = (id: string) => node(id).children[0]
const near = (actual: number, expected: number) => Math.abs(actual - expected) <= 1
let props: Parameters<typeof Indicators>[0] = { state: 'unchecked', size: 'sm' }
const render = async (next: Partial<typeof props> = {}) => {
	props = { ...props, ...next }
	root.render(Indicators, props)
	await pause()
}
async function run() {
	await render()
	window.present()
	await pause()
	check(
		'registry defaults resolve all built-ins',
		['checkbox', 'radio', 'check'].every(
			(name) =>
				getIndicator(name as keyof typeof defaultIndicators) ===
				defaultIndicators[name as keyof typeof defaultIndicators],
		),
	)
	check(
		'scope class reaches GTK',
		[...container.nodes.values()].some((n) => n.cssClasses.has(indicatorScope)),
	)
	const box = refs[0] as any,
		radio = refs[1] as any
	check('unchecked checkbox retains its box without a mark', node('box').children.length === 0)
	check('unchecked radio retains its circle without a dot', node('radio').children.length === 0)
	check(
		'unchecked standalone check has no host/ref',
		find('check') === undefined && refs[2] == null,
	)
	check(
		'small checkbox is 20 square',
		near(box.getBounds().width, 20) && near(box.getBounds().height, 20),
	)
	check(
		'small radio is 20 square',
		near(radio.getBounds().width, 20) && near(radio.getBounds().height, 20),
	)
	check('custom indicator class is retained', node('box').cssClasses.has('custom-box'))
	check(
		'decorative boxes are not keyboard focus stops',
		!box.get_focusable() && !radio.get_focusable(),
	)
	await render({ state: 'checked', size: 'md' })
	check('state changes keep checkbox and radio hosts', refs[0] === box && refs[1] === radio)
	check(
		'medium checkbox is 24 square',
		near(box.getBounds().width, 24) && near(box.getBounds().height, 24),
	)
	check(
		'medium radio is 24 square',
		near(radio.getBounds().width, 24) && near(radio.getBounds().height, 24),
	)
	const picture = child('box').view as any
	check(
		'checked checkbox decodes SVG through GTK',
		child('box').type === 'svgview' && !picture.isLoading && !!picture.get_paintable(),
	)
	check(
		'checkbox checkmark uses medium geometry',
		near(picture.getBounds().width, 14) && near(picture.getBounds().height, 14),
	)
	check('radio dot uses medium geometry', near((child('radio').view as any).getBounds().width, 12))
	check(
		'checked standalone check is a native label',
		node('check').type === 'label' && (refs[2] as any).label === '✓',
	)
	const firstCheck = node('check')
	await render({ disabled: true, size: 'sm' })
	check(
		'disabled indicator opacity reaches GTK',
		near(box.get_opacity(), 0.5) && near(radio.get_opacity(), 0.5),
	)
	check(
		'standalone disabled check has its state class',
		node('check').cssClasses.has('vx-ind-check--disabled'),
	)
	check(
		'size update changes checkbox mark geometry',
		near((child('box').view as any).getBounds().width, 12),
	)
	check(
		'size update changes radio dot geometry',
		near((child('radio').view as any).getBounds().width, 10),
	)
	await render({ state: 'indeterminate', disabled: false })
	check(
		'indeterminate checkbox uses a Mason dash',
		child('box').cssClasses.has('vx-ind-dash') &&
			near((child('box').view as any).getBounds().width, 10),
	)
	check('retired SVG clears its native paintable', picture.get_paintable() == null)
	check(
		'single-selection indicators clear on unchecked state',
		node('radio').children.length === 0 &&
			find('check') === undefined &&
			refs[2] == null &&
			firstCheck.destroyed,
	)
	check(
		'removing disabled restores full opacity',
		near(box.get_opacity(), 1) && near(radio.get_opacity(), 1),
	)
	await render({ custom: true })
	check(
		'custom children replace every state mark',
		['box', 'radio', 'check'].every((id) =>
			node(id).children.some((n) => n.props.id === id + '-busy'),
		),
	)
	check(
		'custom check slot forwards its own ref',
		refs[2] === node('check').view && node('check').type === 'masonview',
	)
	const beforeRadio = node('registered-radio').view
	const beforeReads = reads.checkbox
	registerIndicator('checkbox', CustomBox)
	await pause()
	check('single registration changes the snapshot', getIndicator('checkbox') === CustomBox)
	check(
		'subscribed checkbox updates without root render',
		node('registered-checkbox').type === 'label' &&
			(node('registered-checkbox').view as any).label === 'box:checked' &&
			reads.checkbox > beforeReads,
	)
	check(
		'single registration preserves unrelated indicator',
		node('registered-radio').view === beforeRadio,
	)
	registerIndicators({ radio: CustomRadio, check: CustomCheck })
	await pause()
	check(
		'batch registration updates both snapshots',
		getIndicator('radio') === CustomRadio && getIndicator('check') === CustomCheck,
	)
	check(
		'batch registration updates both live readers',
		(node('registered-radio').view as any).label === 'radio:checked' &&
			(node('registered-check').view as any).label === 'check:checked',
	)
	const beforeEmpty = JSON.stringify(reads)
	registerIndicators({})
	await pause()
	check('empty registration does not rerender readers', JSON.stringify(reads) === beforeEmpty)
	registerIndicators(defaultIndicators)
	await pause()
	check(
		'registering defaults restores built-in readers',
		node('registered-checkbox').type === 'masonview' &&
			node('registered-radio').type === 'masonview' &&
			node('registered-check').type === 'label',
	)
	await render({ state: 'checked', custom: false })
	check(
		'removing custom children restores all marks',
		child('box').type === 'svgview' &&
			child('radio').cssClasses.has('vx-ind-radio-dot') &&
			(refs[2] as any).label === '✓',
	)
	check('all updates complete without effect errors', errors.length === 0)
	const retired = node('box'),
		retiredRadio = node('radio')
	root.unmount()
	check(
		'unmount clears every forwarded ref',
		refs.every((ref) => ref == null),
	)
	check(
		'unmount retires native nodes and host children',
		retired.destroyed && retiredRadio.destroyed && host.get_first_child() == null,
	)
	const afterUnmount = JSON.stringify(reads)
	registerIndicator('checkbox', CustomBox)
	await pause()
	check(
		'unmounted readers unsubscribe from registry updates',
		JSON.stringify(reads) === afterUnmount,
	)
	registerIndicators(defaultIndicators)
	window.destroy()
	print(
		'GTK_INDICATORS ' +
			JSON.stringify({
				checks,
				gtk: [Gtk.get_major_version(), Gtk.get_minor_version(), Gtk.get_micro_version()].join('.'),
			}),
	)
	loop.quit()
}
let failed = false
run().catch((error) => {
	failed = true
	console.error(error)
	try {
		root.unmount()
		registerIndicators(defaultIndicators)
	} finally {
		window.destroy()
		loop.quit()
	}
})
loop.run()
if (failed) {
	;(globalThis as any).imports.system.exit(1)
}
