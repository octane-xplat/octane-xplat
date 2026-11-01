import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import GObject from 'gi://GObject'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { isFocusVisible } from '@octane-xplat/ui'
import { FocusProbe, events, state, api } from './ui-focus.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const dbg: string[] = []
const flush = () => {
	try {
		GLib.file_set_contents('/tmp/gtk-focus-dbg.log', dbg.join('\n'))
	} catch {}
}
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	dbg.push((ok ? 'PASS ' : 'FAIL ') + name)
	flush()
	if (!ok) {
		failures.push(name)
	}
}
/** Events logged after `mark` — proves ordering inside one input phase
 *  (the F12 ack itself arrives as keyboard input afterwards). */
const since = (mark: string) => events.slice(events.lastIndexOf('mark:' + mark) + 1)

const window = new Gtk.Window({
	title: 'Octane GTK Focus test',
	default_width: 380,
	default_height: 560,
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

const pump = (ms: number) =>
	new Promise<void>((resolve) =>
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
			resolve()
			return false
		}),
	)

const findView = (id: string): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.props?.id === id) {
			return n.view
		}
	}
	return null
}
const focusName = () => {
	const f = window.get_focus()
	return f ? GObject.type_name(f) : 'null'
}
/** Entries delegate real focus to their inner GtkText — the focus widget
 *  is the view itself or a descendant of it (walk the parent chain so
 *  composite delegates count too). */
const hasFocus = (view: any) => {
	for (let w = window.get_focus(); w; w = w.get_parent?.()) {
		if (w === view) {
			return true
		}
	}
	return false
}
const dump = (tag: string) => {
	dbg.push('LOG ' + tag + ' focus=' + focusName() + ' | ' + events.slice(-12).join(' '))
	flush()
}
const subtree = (view: any): string[] => {
	const names: string[] = []
	const walk = (w: any, depth: number) => {
		for (let c = w; c; c = c.get_next_sibling?.()) {
			names.push('.'.repeat(depth) + GObject.type_name(c) + (c.get_can_focus?.() ? '*' : ''))
			walk(c.get_first_child?.(), depth + 1)
		}
	}
	walk(view?.get_first_child?.(), 0)
	return names
}
const dumpGrid = (view: any) => {
	dbg.push('GRID ' + subtree(view).join(' | '))
	flush()
}

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	dbg.push('READY ' + JSON.stringify(payload))
	flush()
	print('GTK_FOCUS_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => {
		readyResolve = resolve
	})
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c: any, keyval: number) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) {
		readyResolve()
		readyResolve = null
	}
	return false
})
const point = (widget: any) => {
	const root2 = widget?.get_native?.()
	if (!root2) {
		return null
	}
	const [ok, rect] = widget.compute_bounds(root2)
	if (!ok) {
		return null
	}
	const [tx, ty] = root2.get_surface_transform()
	let x = rect.origin.x - tx + rect.size.width / 2
	let y = rect.origin.y - ty + rect.size.height / 2
	for (
		let surface = root2.get_surface();
		typeof surface.get_parent === 'function';
		surface = surface.get_parent()
	) {
		x += surface.get_position_x()
		y += surface.get_position_y()
	}
	const [wx, wy] = window.get_surface_transform()
	return { x: x + wx, y: y + wy }
}
const clickAt = async (widget: any, mark: string) => {
	const p = widget && point(widget)
	if (!p) {
		dbg.push('MISSING widget ' + mark)
		return
	}
	events.push('mark:' + mark)
	await ready(p)
	dump(mark)
}
const keyPhase = async (mark: string, key: string) => {
	events.push('mark:' + mark)
	await ready({ key })
	dump(mark)
}
const keyControllers = (view: any): any[] => {
	const found: any[] = []
	const all = view.observe_controllers()
	for (let i = 0; i < all.get_n_items(); i++) {
		const item = all.get_item(i)
		if (item instanceof Gtk.EventControllerKey) {
			found.push(item)
		}
	}
	if (!found.length) {
		throw new Error('no keyboard controller')
	}
	return found
}
/** tf-keys owns separate keydown/keyup controllers — emit on every key
 *  controller; unconnected signals no-op. */
const emitKey = (view: any, signal: 'key-pressed' | 'key-released', key: number, mods = 0) =>
	keyControllers(view)
		.map((c) => c.emit(signal, key, 0, mods))
		.some(Boolean)

// Bridge-side modality log — records every transition in order so pointer
// evidence survives the keyboard F12 that ends each phase.
const gtkHost = (globalThis as any).__octaneGtkHost
gtkHost?.onInputModalityChange?.(() =>
	events.push('modality:' + gtkHost.getInputModality()),
)

async function run() {
	root.render(FocusProbe, {})
	await pump(50)
	window.present()
	await pump(400)
	// createGtkRoot prepends XPLAT_MASON_TYPELIB to the repository search
	// path — the namespace is only loadable after that, not at module top.
	const native = (globalThis as any).imports.gi.XplatMason
	const osInput = GLib.getenv('GTK_FOCUS_OS') === '1'

	const tfKeys = findView('tf-keys')
	const tfFocus = findView('tf-focus')
	const fwA = findView('fw-a')
	const fwB = findView('fw-b')
	const tfRing = findView('tf-ring')
	const kbField = findView('kb-field')
	const cells = [0, 1, 2, 3, 4, 5].map((i) => findView('cell-' + i))

	// --- useLandmark: shared leaf forwards role + label onto real widgets.
	const lmMain = findView('lm-main')
	const lmNav = findView('lm-nav')
	check('landmark main role reaches widget', lmMain?.get_accessible_role() === Gtk.AccessibleRole.MAIN)
	check(
		'landmark navigation role reaches widget',
		lmNav?.get_accessible_role() === Gtk.AccessibleRole.NAVIGATION,
	)
	check(
		'landmark main label reaches widget',
		native.test_accessible_string_property(
			lmMain,
			Gtk.AccessibleProperty.LABEL,
			'Main region',
		) === null,
	)
	check(
		'landmark nav label reaches widget',
		native.test_accessible_string_property(lmNav, Gtk.AccessibleProperty.LABEL, 'Side nav') ===
			null,
	)

	// --- Capability flags (in-process).
	check('useFocusWithin reports subtree tracking', state.withinSupported === true)
	check('useFocusVisible reports support', state.fvSupported === true)
	check('useFocusRing reports modality support', state.ringSupported === true)
	check('useKeyboard reports support', state.kbSupported === true)
	check('modality starts unknown', state.modality === 'unknown')
	check('focus ring hidden before focus', state.ringVisible === false)
	check('grid cells realized focusable', cells.every((c) => c?.get_can_focus?.() === true))

	// --- In-process key delivery: emit through the node's own controller —
	// proves the wiring + normalization without OS input.
	emitKey(tfKeys, 'key-pressed', Gdk.KEY_x)
	await pump(40)
	check('x claim logged', events.includes('tf:claim:x'))
	check(
		'key event fields normalized',
		events.includes('tf:down:x||0000|false|false|false'),
	)
	emitKey(tfKeys, 'key-released', Gdk.KEY_y)
	emitKey(tfKeys, 'key-pressed', Gdk.KEY_a, Gdk.ModifierType.CONTROL_MASK)
	await pump(40)
	check(
		'keyup payload carries eventName + object',
		events.includes('tf:up:y:keyup:true'),
	)
	check('ctrl modifier normalized', events.includes('tf:down:a||0100|false|false|false'))

	// --- In-process focus moves exercise enter/leave semantics too.
	tfFocus.grab_focus()
	await pump(60)
	check('useFocus fires onFocus with event', events.some((e) => e.startsWith('focus:on:')))
	check('useFocus reports focus change', events.includes('focus:change:true'))
	fwA.grab_focus()
	await pump(60)
	check('useFocus blur on leave', events.includes('focus:off'))
	check('useFocusWithin single boundary entry', events.includes('within:on'))
	check('useFocusWithin change fires once', events.includes('within:change:true'))
	fwB.grab_focus()
	await pump(60)
	check(
		'within ignores moves between descendants',
		!events.slice(events.lastIndexOf('within:on')).includes('within:off'),
	)
	kbField.grab_focus()
	await pump(60)
	check('within blur on subtree exit', events.includes('within:off'))
	check('within change false on exit', events.includes('within:change:false'))

	if (osInput) {
		// --- Real OS input: reset focus, then Tab walks the natural chain.
		events.length = 0
		window.set_focus(null)
		await pump(60)
		await keyPhase('tab1', 'Tab')
		check('OS Tab focuses first field', hasFocus(tfKeys))
		check(
			'Tab keyup reaches the newly focused field',
			events.includes('tf:up:Tab:keyup:true'),
		)

		await keyPhase('x', 'x')
		check('preventDefault suppresses real insertion', tfKeys.get_text() === '')
		check('x claimed', events.includes('tf:claim:x'))
		await keyPhase('y', 'y')
		dbg.push('TEXT ' + JSON.stringify(tfKeys.get_text()))
		check('unclaimed key inserts real text', tfKeys.get_text() === 'y')
		check('real keyup delivered', events.includes('tf:up:y:keyup:true'))
		await keyPhase('z', 'z')
		check('stopPropagation suppresses real insertion', tfKeys.get_text() === 'y')
		check('z claimed', events.includes('tf:claim:z'))

		await keyPhase('ctrl-a', 'ctrl+a')
		check('real ctrl chord reports ctrlKey', events.includes('tf:down:a||0100|false|false|false'))
		await keyPhase('shift-a', 'shift+a')
		check('real shift chord reports shifted key', events.includes('tf:down:A||0001|false|false|false'))

		await keyPhase('tab2', 'Tab')
		check(
			'Tab keydown reaches focused field with normalized fields',
			events.includes('tf:down:Tab||0000|false|false|false'),
		)
		check('Tab into focus probe', hasFocus(tfFocus))
		check('useFocus onFocus from real Tab', since('tab2').some((e) => e.startsWith('focus:on:')))
		check('useFocus change true from real Tab', since('tab2').includes('focus:change:true'))
		check('focus payload carries type field', since('tab2').includes('focus:on:focus:focus'))

		await keyPhase('tab3', 'Tab')
		check('Tab into within subtree', hasFocus(fwA))
		check('within entry from real Tab', since('tab3').includes('within:on'))
		check('useFocus blur on real Tab out', since('tab3').includes('focus:off'))

		await keyPhase('tab4', 'Tab')
		check('Tab between descendants', hasFocus(fwB))
		check(
			'within stays quiet on descendant move',
			!since('tab4').some((e) => e.startsWith('within:')),
		)

		await keyPhase('tab5', 'Tab')
		check('Tab out of subtree', hasFocus(tfRing))
		check('within exit on boundary leave', since('tab5').includes('within:off'))

		// Keyboard focus + keyboard modality → ring shows.
		await pump(80)
		check('ring focused after Tab', state.ringFocused === true)
		check('ring visible on keyboard focus', state.ringVisible === true)
		check('isFocusVisible() reads keyboard', isFocusVisible() === true)
		check('modality reads keyboard', state.modality === 'keyboard')

		await keyPhase('tab6', 'Tab')
		check('Tab into keyboard-probe field', hasFocus(kbField))
		check('ring released on blur', state.ringFocused === false)

		await keyPhase('kb-a', 'a')
		check('useKeyboard sees descendant key', since('kb-a').includes('kb:down:a:false'))
		check('useKeyboard sees descendant release', events.includes('kb:up:a'))
		check('unclaimed a reaches field', kbField.get_text() === 'a')
		await keyPhase('kb-ctrlx', 'ctrl+x')
		check('useKeyboard reports modifier', events.includes('kb:down:x:true'))

		dumpGrid(findView('grid'))
		await keyPhase('tab7', 'Tab')
		check('Tab focuses first grid cell', hasFocus(cells[0]))
		await keyPhase('right', 'Right')
		check('arrow moves to next cell', hasFocus(cells[1]))
		check('grid reports new index', state.gridIndex === 1 && events.includes('grid:index:1'))
		await keyPhase('down', 'Down')
		check('arrow down jumps a row', hasFocus(cells[4]))
		await keyPhase('home', 'Home')
		check('Home jumps to first cell', hasFocus(cells[0]))
		await keyPhase('end', 'End')
		check('End jumps to last cell', hasFocus(cells[5]))
		await keyPhase('left', 'Left')
		check('arrow left steps back', hasFocus(cells[4]))

		// Imperative cell focus.
		api.focusCell?.(2)
		await pump(80)
		check('onFocusCell focuses the cell', hasFocus(cells[2]))
		check('onFocusCell updates index', state.gridIndex === 2)

		// --- Pointer modality: real click focuses without a focus ring.
		await clickAt(tfRing, 'click-ring')
		await pump(80)
		check('click focuses ring target', hasFocus(tfRing))
		check('click logs pointer modality', since('click-ring').includes('modality:pointer'))
		check('pointer focus hides ring at focus time', since('click-ring').includes('ring:true:false'))

		// Back to keyboard: real Tab moves focus and restores keyboard modality.
		await keyPhase('tab8', 'Tab')
		check('focus leaves ring target', hasFocus(kbField))
		check('modality back to keyboard', events.lastIndexOf('modality:keyboard') > events.lastIndexOf('modality:pointer'))
		check('isFocusVisible() keyboard again', isFocusVisible() === true)
	}

	root.unmount()
	await pump(80)
	check('unmount disposes nodes', container.nodes.size === 0)
	print(
		'GTK_FOCUS ' +
			JSON.stringify({
				checks: checks.length,
				failures,
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
if (failure) {
	throw failure
}
