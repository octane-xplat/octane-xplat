import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'
import Gtk from 'gi://Gtk?version=4.0'
import Gdk from 'gi://Gdk?version=4.0'
import GLib from 'gi://GLib'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { RadioScene, RadioContextScene, RadioStandaloneScene, changes } from './ui-radio-list.gtk'
Gtk.init()
const window = new Gtk.Window({
	title: 'Octane GTK radio test',
	default_width: 400,
	default_height: 600,
	decorated: false,
})
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const errors: unknown[] = []
const { root, container } = createGtkRoot(host, { onUncaughtError: (error) => errors.push(error) })
const loop = GLib.MainLoop.new(null, false)
const pause = () =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, 180, () => {
			resolve()
			return false
		}),
	)
const fallback = GLib.getenv('GTK_RADIO_FALLBACK') === '1'
let checks = 0
const failures: string[] = []
const check = (name: string, ok: boolean) => {
	checks++
	if (!ok) {
		failures.push(name)
	}
}
const node = (id: string) => [...container.nodes.values()].find((n) => n.props.id === id)!
const classes = (n: any): string[] =>
	(Array.isArray(n.props.className)
		? n.props.className.flat(Infinity).filter(Boolean).join(' ')
		: String(n.props.className ?? '')
	).split(' ')
const descendant = (parent: any, child: any) => {
	for (let current = child.parent; current; current = current.parent) {
		if (current === parent) {
			return true
		}
	}
	return false
}
const rows = (parent: any) =>
	[...container.nodes.values()].filter(
		(n) => descendant(parent, n) && classes(n).includes('vx-radio-row'),
	)
let ack = 0
let osInput = false
const keys = new Gtk.EventControllerKey()
keys.set_propagation_phase(Gtk.PropagationPhase.CAPTURE)
keys.connect('key-pressed', (_: any, key: number) => {
	if (key === Gdk.KEY_F12) {
		ack++
		return true
	}
	return false
})
window.add_controller(keys)
async function phase(key: string) {
	const next = ack + 1
	print('GTK_RADIO_READY ' + JSON.stringify({ key }))
	for (let i = 0; i < 250 && ack < next; i++) {
		await new Promise<void>((resolve) =>
			GLib.timeout_add(GLib.PRIORITY_DEFAULT, 20, () => {
				resolve()
				return false
			}),
		)
	}
	check('OS phase acknowledged: ' + key, ack >= next)
	await pause()
}
async function point(view: any) {
	const bounds = view.getBounds()
	const next = ack + 1
	print(
		'GTK_RADIO_READY ' +
			JSON.stringify({
				point: {
					x: Math.floor(bounds.x + bounds.width / 2),
					y: Math.floor(bounds.y + bounds.height / 2),
				},
			}),
	)
	for (let i = 0; i < 250 && ack < next; i++) {
		await new Promise<void>((resolve) =>
			GLib.timeout_add(GLib.PRIORITY_DEFAULT, 20, () => {
				resolve()
				return false
			}),
		)
	}
	check('OS pointer phase acknowledged', ack >= next)
	await pause()
}
const namedRow = (id: string, label: string) =>
	rows(node(id)).find((n) => n.props.accessibilityLabel === label)!
const selected = (id: string, label: string) =>
	classes(namedRow(id, label)).includes('vx-radio--on')
const ownsFocus = (view: any) => {
	const focused = window.get_focus()
	return focused === view || !!focused?.is_ancestor(view)
}
async function run() {
	root.render(RadioScene, { readOnly: true, loading: true })
	window.present()
	await pause()
	const native = fallback ? null : (globalThis as any).imports.gi.XplatMason
	for (const id of ['radio-options', 'radio-children']) {
		const group = node(id),
			view = group.view!
		check(
			id + ' exposes radio group role',
			view.get_accessible_role() === Gtk.AccessibleRole.RADIO_GROUP,
		)
		check(id + ' applies width to the complete field', Math.abs(view.getBounds().width - 220) <= 2)
		if (fallback) {
			check(id + ' uses the Gtk.Box fallback host', view instanceof Gtk.Box)
		}
		if (native) {
			check(
				id + ' inherits required metadata',
				native.test_accessible_boolean_property(view, Gtk.AccessibleProperty.REQUIRED, true) ===
					null,
			)
			check(
				id + ' exposes read-only metadata',
				native.test_accessible_boolean_property(view, Gtk.AccessibleProperty.READ_ONLY, true) ===
					null,
			)
			check(
				id + ' exposes busy metadata',
				native.test_accessible_state(view, Gtk.AccessibleState.BUSY, 1) === null,
			)
		}
		const options = rows(group)
		check(id + ' renders all three options', options.length === 3)
		check(
			id + ' exposes radio option roles',
			options.every((n) => n.view!.get_accessible_role() === Gtk.AccessibleRole.RADIO),
		)
		if (native) {
			check(
				id + ' exposes the selected option as checked',
				native.test_accessible_state(
					options[0].view,
					Gtk.AccessibleState.CHECKED,
					Gtk.AccessibleTristate.TRUE,
				) === null,
			)
			check(
				id + ' names each option',
				native.test_accessible_string_property(
					options[0].view,
					Gtk.AccessibleProperty.LABEL,
					id === 'radio-options' ? 'Alpha' : 'Card',
				) === null,
			)
		}
		check(id + ' disables its unavailable option natively', !options[1].view!.is_sensitive())
		check(
			id + ' renders a visible field label',
			[...container.nodes.values()].some(
				(n) =>
					n.type === 'label' &&
					String(n.props.text).startsWith(id === 'radio-options' ? 'Delivery' : 'Payment') &&
					n.view!.get_mapped(),
			),
		)
	}

	root.render(RadioScene, {})
	await pause()
	const first = rows(node('radio-options'))[0].view!
	check('enabled radio accepts native keyboard focus', first.get_focusable() && first.focus())
	await pause()
	check('native focus belongs to the radio option', window.get_focus() === first)
	if (GLib.getenv('GTK_RADIO_OS') === '1') {
		osInput = true
		const options = rows(node('radio-options'))
		const children = rows(node('radio-children'))
		node('radio-before').view!.focus()
		await phase('Tab')
		check('Tab enters selected first group option', window.get_focus() === options[0].view)
		await phase('Right')
		check(
			'Right skips disabled option and selects next',
			window.get_focus() === options[2].view && changes.length === 1 && changes[0][1] === 'gamma',
		)
		if (native) {
			check(
				'arrow selection updates native checked state',
				native.test_accessible_state(
					options[2].view,
					Gtk.AccessibleState.CHECKED,
					Gtk.AccessibleTristate.TRUE,
				) === null &&
					native.test_accessible_state(
						options[0].view,
						Gtk.AccessibleState.CHECKED,
						Gtk.AccessibleTristate.FALSE,
					) === null,
			)
		}
		await phase('space')
		check('Space on selected radio does not emit a duplicate change', changes.length === 1)
		await phase('Up')
		check(
			'Up selects the previous enabled option',
			window.get_focus() === options[0].view && changes.length === 2 && changes[1][1] === 'alpha',
		)
		await phase('Left')
		check(
			'Left wraps to last enabled option',
			window.get_focus() === options[2].view && changes.length === 3,
		)
		await phase('Right')
		check(
			'Right wraps to first enabled option',
			window.get_focus() === options[0].view && changes.length === 4,
		)
		await phase('Tab')
		check(
			'Tab leaves the whole first group for the selected child part',
			window.get_focus() === children[0].view && changes.length === 4,
		)
		await phase('Right')
		check(
			'child parts share navigation and skip disabled choices',
			window.get_focus() === children[2].view &&
				changes.length === 5 &&
				changes[4][0] === 'children' &&
				changes[4][1] === 'wallet',
		)
		await phase('Tab')
		check('Tab exits the second group', ownsFocus(node('radio-after').view))
		await phase('shift+Tab')
		check('Shift Tab enters the selected child option', window.get_focus() === children[2].view)
		await phase('shift+Tab')
		check(
			'Shift Tab exits child group and enters first selected option',
			window.get_focus() === options[0].view,
		)
		await phase('shift+Tab')
		check('Shift Tab leaves the entire first group', ownsFocus(node('radio-before').view))
		root.render(RadioScene, { readOnly: true })
		await pause()
		node('radio-before').view!.focus()
		await phase('Tab')
		await phase('Right')
		check(
			'read-only arrows can move focus without changing selection',
			window.get_focus() === options[2].view && changes.length === 5,
		)
		if (native) {
			check(
				'read-only selection metadata stays on the original option',
				native.test_accessible_state(
					options[0].view,
					Gtk.AccessibleState.CHECKED,
					Gtk.AccessibleTristate.TRUE,
				) === null,
			)
		}

		root.render(RadioScene, { disabled: true })
		await pause()
		node('radio-before').view!.focus()
		await phase('Tab')
		check(
			'disabled groups are skipped by Tab',
			ownsFocus(node('radio-after').view) && changes.length === 5,
		)
		root.render(RadioScene, {})
		await pause()
		check(
			'keyboard updates retain exact group and row owners',
			rows(node('radio-options'))[0].view === options[0].view &&
				rows(node('radio-children'))[2].view === children[2].view,
		)
	}
	if (osInput) {
		const before = changes.length
		const gamma = namedRow('radio-options', 'Gamma')
		const label = [...container.nodes.values()].find(
			(n) => descendant(gamma, n) && n.type === 'label' && n.props.text === 'Gamma',
		)!
		await point(label.view)
		check(
			'pointer label selects one option once',
			changes.length === before + 1 &&
				changes[before][1] === 'gamma' &&
				selected('radio-options', 'Gamma'),
		)
		check('pointer label also owns native radio focus', window.get_focus() === gamma.view)
		await point(label.view)
		check(
			'pointer click on selected radio does not duplicate the change',
			changes.length === before + 1,
		)
		await point(namedRow('radio-options', 'Beta').view)
		check(
			'disabled option ignores pointer input',
			changes.length === before + 1 &&
				window.get_focus() !== namedRow('radio-options', 'Beta').view,
		)
		root.render(RadioScene, { readOnly: true })
		await pause()
		await point(namedRow('radio-options', 'Alpha').view)
		check(
			'read-only pointer input focuses without selecting',
			window.get_focus() === namedRow('radio-options', 'Alpha').view &&
				changes.length === before + 1 &&
				selected('radio-options', 'Gamma'),
		)
		node('radio-before').view!.focus()
		const alpha = namedRow('radio-options', 'Alpha').view!
		alpha.set_focus_on_click(false)
		await point(alpha)
		check(
			'native focus-on-click opt-out is respected',
			ownsFocus(node('radio-before').view) && changes.length === before + 1,
		)
		alpha.set_focus_on_click(true)
		root.render(RadioScene, {})
		await pause()
	}
	if (!fallback) {
		let props: Parameters<typeof RadioScene>[0] = {}
		const render = async (next: Partial<typeof props>) => {
			props = { ...props, ...next }
			root.render(RadioScene, props)
			await pause()
		}
		const hostBefore = node('radio-options').view!,
			alphaBefore = namedRow('radio-options', 'Alpha').view!
		const walletBefore = node('radio-wallet').view!
		const before = changes.length
		await render({
			value: 'alpha',
			childValue: 'card',
			enableMiddle: true,
			horizontal: true,
			rtl: true,
			width: 340,
		})
		check(
			'controlled owner writes selection without callbacks',
			selected('radio-options', 'Alpha') &&
				selected('radio-children', 'Card') &&
				changes.length === before,
		)
		check(
			'horizontal options share a native row',
			Math.abs(
				namedRow('radio-options', 'Alpha').view!.getBounds().y -
					namedRow('radio-options', 'Gamma').view!.getBounds().y,
			) <= 2,
		)
		if (osInput) {
			alphaBefore.focus()
			await phase('Right')
			check(
				'RTL Right moves to the previous logical enabled option',
				window.get_focus() === namedRow('radio-options', 'Gamma').view &&
					changes.length === before + 1 &&
					changes[before][1] === 'gamma',
			)
			check(
				'rejected controlled request keeps owner selection',
				selected('radio-options', 'Alpha') && !selected('radio-options', 'Gamma'),
			)
			await phase('Right')
			check(
				'RTL Right advances from Gamma to Beta',
				window.get_focus() === namedRow('radio-options', 'Beta').view &&
					changes[before + 1][1] === 'beta',
			)
		}
		const afterInput = changes.length
		await render({ value: 'beta', childValue: 'cash' })
		check(
			'controlled updates reach option and child-part indicators',
			selected('radio-options', 'Beta') &&
				selected('radio-children', 'Cash') &&
				changes.length === afterInput,
		)
		await render({
			value: undefined,
			childValue: undefined,
			horizontal: false,
			rtl: false,
			reverse: true,
			defaultValue: 'beta',
			childDefaultValue: 'cash',
		})
		check(
			'default changes do not reset existing local selections',
			selected('radio-options', osInput ? 'Gamma' : 'Alpha') &&
				selected('radio-children', osInput ? 'Wallet' : 'Card'),
		)
		check(
			'keyed reordering retains exact option widgets and group host',
			namedRow('radio-options', 'Alpha').view === alphaBefore &&
				node('radio-wallet').view === walletBefore &&
				node('radio-options').view === hostBefore,
		)
		check(
			'reordering changes native option positions',
			namedRow('radio-options', 'Gamma').view!.getBounds().y < alphaBefore.getBounds().y,
		)
		await render({ value: 'missing', childValue: 'missing', reverse: false })
		check(
			'an unmatched controlled value leaves all options unchecked',
			rows(node('radio-options')).every((n) => !classes(n).includes('vx-radio--on')) &&
				rows(node('radio-children')).every((n) => !classes(n).includes('vx-radio--on')),
		)
		if (osInput) {
			node('radio-before').view!.focus()
			await phase('Tab')
			check(
				'a group with no selection enters its first enabled option',
				window.get_focus() === namedRow('radio-options', 'Alpha').view,
			)
			await phase('space')
			check(
				'Space requests selection while controlled owner remains authoritative',
				changes[changes.length - 1][1] === 'alpha' && !selected('radio-options', 'Alpha'),
			)
		}
		const retired = namedRow('radio-options', 'Alpha').pressKeys!
		const beforeEmpty = changes.length
		await render({ empty: true })
		check(
			'empty groups retain their native hosts without options',
			node('radio-options').view === hostBefore &&
				rows(node('radio-options')).length === 0 &&
				rows(node('radio-children')).length === 0,
		)
		if (osInput) {
			node('radio-before').view!.focus()
			await phase('Tab')
			check('Tab skips empty groups', ownsFocus(node('radio-after').view))
		}
		await render({ empty: false, value: undefined, childValue: undefined, enableMiddle: false })
		retired.activateRadio()
		check(
			'retired option activation is inert after repopulation',
			changes.length === beforeEmpty && selected('radio-options', osInput ? 'Gamma' : 'Alpha'),
		)
		const focused = namedRow('radio-options', 'Alpha').view!
		focused.focus()
		await render({ hidden: true, width: '50%', optional: true, size: 'sm', opacity: 0.6 })
		check(
			'label, width and size updates retain exact focused control',
			namedRow('radio-options', 'Alpha').view === focused &&
				window.get_focus() === focused &&
				node('radio-options').view === hostBefore,
		)
		check(
			'percentage width sizes the complete radio field',
			Math.abs(hostBefore.getBounds().width - 180) <= 2,
		)
		check(
			'hidden field labels disappear while group name stays',
			![...container.nodes.values()].some(
				(n) =>
					n.type === 'label' &&
					classes(n).includes('vx-field-label') &&
					String(n.props.text).startsWith('Delivery') &&
					n.view!.get_mapped(),
			) &&
				native.test_accessible_string_property(
					hostBefore,
					Gtk.AccessibleProperty.LABEL,
					'Delivery',
				) === null,
		)
		check(
			'optional overrides the form required default',
			native.test_accessible_boolean_property(
				hostBefore,
				Gtk.AccessibleProperty.REQUIRED,
				false,
			) === null,
		)
		const ind = [...container.nodes.values()].find(
			(n) =>
				descendant(namedRow('radio-options', 'Alpha'), n) && classes(n).includes('vx-ind-radio'),
		)!
		check('size provider changes actual indicator geometry', ind.view!.getBounds().width === 20)
		check(
			'authored style and class reach the group',
			Math.abs(hostBefore.get_opacity() - 0.6) < 0.01 &&
				classes(node('radio-options')).includes('fixture-radio'),
		)
		await render({
			hidden: false,
			width: 340,
			optional: false,
			size: undefined,
			opacity: undefined,
			longDescription: true,
		})
		check(
			'style and label removal restore defaults without losing focus',
			hostBefore.get_opacity() === 1 &&
				window.get_focus() === focused &&
				[...container.nodes.values()].some(
					(n) =>
						n.type === 'label' &&
						classes(n).includes('vx-field-label') &&
						n.props.text === 'Delivery' &&
						n.view!.get_mapped(),
				),
		)
		const alpha = namedRow('radio-options', 'Alpha')
		const free = [...container.nodes.values()].find(
			(n) => descendant(alpha, n) && n.type === 'label' && n.view!.get_text() === 'Free',
		)!
		check(
			'end content aligns to the row end',
			Math.abs(
				free.view!.getBounds().x +
					free.view!.getBounds().width -
					(alpha.view!.getBounds().x + alpha.view!.getBounds().width),
			) <= 2,
		)
		const long = [...container.nodes.values()].find(
			(n) =>
				descendant(alpha, n) &&
				n.type === 'label' &&
				String(n.props.text).startsWith('Delivery details'),
		)!
		check(
			'long option descriptions wrap within the field',
			long.view!.get_wrap() &&
				long.view!.getBounds().height > 34 &&
				long.view!.getBounds().width < alpha.view!.getBounds().width,
		)
		root.render(RadioContextScene, { active: true })
		await pause()
		const group = node('radio-context'),
			groupView = group.view!
		check(
			'an external Field owns one radio frame',
			[...container.nodes.values()].filter((n) => classes(n).includes('vx-field')).length === 1 &&
				Math.abs(groupView.getBounds().width - 280) <= 2,
		)
		check(
			'external Field enforces inherited flags',
			!groupView.is_sensitive() &&
				native.test_accessible_boolean_property(
					groupView,
					Gtk.AccessibleProperty.READ_ONLY,
					true,
				) === null &&
				native.test_accessible_boolean_property(
					groupView,
					Gtk.AccessibleProperty.REQUIRED,
					false,
				) === null &&
				native.test_accessible_state(groupView, Gtk.AccessibleState.BUSY, 1) === null,
		)
		check(
			'external Field supplies name and composed help',
			native.test_accessible_string_property(
				groupView,
				Gtk.AccessibleProperty.LABEL,
				'Shipping',
			) === null &&
				native.test_accessible_string_property(
					groupView,
					Gtk.AccessibleProperty.DESCRIPTION,
					'Shared field help. Shared issue. Field lock',
				) === null,
		)
		root.render(RadioContextScene, { active: false, override: true })
		await pause()
		check(
			'external defaults reset without replacing group',
			node('radio-context').view === groupView &&
				groupView.is_sensitive() &&
				native.test_accessible_state(groupView, Gtk.AccessibleState.BUSY, 0) === null &&
				native.test_accessible_boolean_property(
					groupView,
					Gtk.AccessibleProperty.REQUIRED,
					true,
				) === null,
		)
		check(
			'explicit group name overrides Field label',
			native.test_accessible_string_property(
				groupView,
				Gtk.AccessibleProperty.LABEL,
				'Custom shipping',
			) === null,
		)
		const contextInd = [...container.nodes.values()].find(
			(n) => descendant(group, n) && classes(n).includes('vx-ind-radio'),
		)!
		check(
			'explicit control size overrides inherited provider',
			classes(group).includes('vx-radio-group--size-lg') &&
				contextInd.view!.getBounds().width === 24,
		)
		root.render(RadioStandaloneScene, {})
		await pause()
		const standalone = node('radio-presentational')
		check(
			'standalone child part stays presentational',
			standalone.view!.get_accessible_role() !== Gtk.AccessibleRole.RADIO &&
				!standalone.view!.get_focusable() &&
				standalone.props.accessibilityState === undefined,
		)
		if (osInput) {
			node('standalone-before').view!.focus()
			await phase('Tab')
			check(
				'standalone item does not add a keyboard stop',
				ownsFocus(node('standalone-after').view),
			)
		}
	}
	check('rendering completes without effect errors', errors.length === 0)
	root.unmount()
	check(
		'unmount clears native nodes and host',
		host.get_first_child() == null && container.nodes.size === 0,
	)
	window.destroy()
	print('GTK_RADIO_RESULTS ' + JSON.stringify({ checks, failures, osInput, fallback }))
	if (failures.length) {
		throw new Error(failures.join('; '))
	}
	print(
		'GTK_RADIO ' +
			JSON.stringify({
				checks,
				osInput,
				fallback,
				gtk: [Gtk.get_major_version(), Gtk.get_minor_version(), Gtk.get_micro_version()].join('.'),
			}),
	)
	loop.quit()
}
let failed = false
run().catch((error) => {
	failed = true
	print('GTK_RADIO_FAILURES ' + JSON.stringify({ checks, failures, osInput, fallback }))
	console.error(error)
	try {
		root.unmount()
	} finally {
		window.destroy()
		loop.quit()
	}
})
loop.run()
if (failed) {
	;(globalThis as any).imports.system.exit(1)
}
