import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { TypeaheadProbe, state } from './ui-typeahead.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}

const window = new Gtk.Window({ title: 'Octane GTK Typeahead test', default_width: 640, default_height: 560, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

// A full GC while JS controls the stack keeps incremental sweeps from
// straddling GTK dispatch — a blocked source/handler is dropped, not retried.
const settle = () => { try { (globalThis as any).imports.system.gc() } catch { } }
const pump = (ms: number) => new Promise<void>((resolve) => {
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false })
})

// Real-input protocol — the Node driver sends actions over stdout phases; F12 acks.
const findView = (id: string): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.props?.id === id) { return n.view }
	}
	return null
}
const findByType = (type: string, pred?: (n: any) => boolean): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.type === type && (!pred || pred(n))) { return n.view }
	}
	return null
}
const findByTypeUnder = (type: string, ancestorId: string): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.type !== type) { continue }
		for (let cur = n; cur; cur = cur.parent) {
			if (cur?.props?.id === ancestorId) { return n.view }
		}
	}
	return null
}
const hasText = (needle: string): boolean => {
	for (const n of (container as any).nodes.values()) {
		try { if (JSON.stringify(n.props).includes(needle)) { return true } } catch { }
	}
	return false
}
const findLabel = (text: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (JSON.stringify(n.props).includes(text)) {
				let cur = n
				while (cur && !cur.view) { cur = cur.parent }
				if (cur?.view) { return cur.view }
			}
		} catch { }
	}
	return null
}
const point = (widget: any): { x: number; y: number } => {
	const native = widget.get_native()
	const [ok, rect] = widget.compute_bounds(native)
	if (!ok) { throw new Error('No native input bounds') }
	const [tx, ty] = native.get_surface_transform()
	let x = rect.origin.x - tx + rect.size.width / 2
	let y = rect.origin.y - ty + rect.size.height / 2
	for (let surface = native.get_surface(); typeof surface.get_parent === 'function'; surface = surface.get_parent()) {
		x += surface.get_position_x()
		y += surface.get_position_y()
	}
	const [wx, wy] = window.get_surface_transform()
	return { x: x + wx, y: y + wy }
}
const clickAt = async (widget: any) => {
	const c = point(widget)
	await ready({ x: c.x, y: c.y })
}
// Diag: what widget actually sits at an absolute point (window.pick chain).
const pickAt = (abs: { x: number; y: number }): string => {
	const [wx, wy] = window.get_surface_transform()
	let w: any = window.pick(abs.x - wx, abs.y - wy, Gtk.PickFlags.DEFAULT)
	const chain: string[] = []
	while (w) {
		chain.push(`${w.constructor?.name ?? 'W'}#${w.get_name?.() ?? ''}`)
		w = w.get_parent?.() ?? null
	}
	return chain.join('<')
}
// Diag: dump every term of the absolute-point derivation for a widget.
const describePoint = (widget: any) => {
	const native = widget.get_native()
	const [ok, rect] = widget.compute_bounds(native)
	const [tx, ty] = native.get_surface_transform()
	const chain: any[] = []
	for (let s = native.get_surface(); s && typeof s.get_parent === 'function'; s = s.get_parent()) {
		const p = s.get_parent()
		chain.push({ name: s.constructor?.name, pos: [s.get_position_x?.(), s.get_position_y?.()], hasParent: p != null })
	}
	const [wx, wy] = window.get_surface_transform()
	print('GTK_TA_GEOM ' + JSON.stringify({
		native: native?.constructor?.name, ok,
		rect: ok ? { x: rect.origin.x, y: rect.origin.y, w: rect.size.width, h: rect.size.height } : null,
		tx, ty, chain, wx, wy,
		root: widget.get_root?.()?.constructor?.name,
	}))
}

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	print('GTK_TA_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => {
		readyResolve = resolve
		// Long wedge guard only — the window key ack resolves well inside it.
		GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
			if (readyResolve === resolve) { readyResolve = null; resolve() }
			return false
		})
	})
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c, keyval) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
})

async function run() {
	root.render(TypeaheadProbe, {})
	await pump(50)
	window.present()
	await pump(300)

	check('Typeahead mounts', !!findView('ta'))
	check('BaseTypeahead mounts', !!findView('bta-input'))
	check('TypeaheadItem mounts', !!findView('ta-item'))
	check('standalone item label renders', hasText('STANDALONE ITEM'))
	check('Token remove mounts', !!findView('tok-remove'))
	check('Tokenizer mounts', !!findView('tkz'))
	check('seed token renders', hasText('Seed'))
	check('ComplexSelector mounts', !!findView('cs'))
	check('SelectableCard mounts', !!findView('card'))
	check('card body renders', hasText('CARD BODY'))

	// Typeahead: click the input, type a filter, pick the row with a real click.
	const taInput = findByTypeUnder('textfield', 'ta')
	check('typeahead textfield present', !!taInput)
	if (taInput) { await clickAt(taInput); await pump(150) }
	await ready({ type: 'ap' })
	await pump(400)
	const apple = findLabel('Apple')
	const apricot = findLabel('Apricot')
	check('typing filters to Apple/Apricot', !!apple && !!apricot)
	check('non-matching Banana hidden', !findLabel('Banana'))
	if (apple) {
		describePoint(apple)
		// Walk to the option row (view-bearing ancestor with the option class).
		let rowNode: any = null
		for (const n of (container as any).nodes.values()) {
			try {
				if (!JSON.stringify(n.props).includes('Apple')) { continue }
			} catch { continue }
			for (let cur = n; cur; cur = cur.parent) {
				const cn = cur?.props?.className
				if (typeof cn === 'string' && cn.includes('vx-typeahead-option') && cur.view?.get_mapped?.()) {
					rowNode = cur
					break
				}
			}
			if (rowNode) { break }
		}
		print('GTK_TA_ROW ' + (rowNode ? String(rowNode.props.className) : 'none'))
		const target = rowNode?.view ?? apple
		describePoint(target)
		await clickAt(target)
		await pump(250)
	}
	check('option pick records value', state.typeaheadPick === 'apple')
	check('popover closes after pick', !findLabel('Apricot'))
	check('picked token renders', hasText('Apple'))

	// BaseTypeahead: no-match text, then query + Return picks the first row.
	const btaInput = findView('bta-input')
	if (btaInput) { await clickAt(btaInput); await pump(150) }
	await ready({ type: 'zzz' })
	await pump(400)
	check('empty result text shows', !!findLabel('No results found'))
	if (btaInput) { await clickAt(btaInput); await pump(100) }
	// Clear the field: select all then retype.
	await ready({ key: 'ctrl+a' })
	await ready({ type: 'ban' })
	await pump(400)
	check('Banana row appears', !!findLabel('Banana'))
	await ready({ key: 'Return' })
	await pump(250)
	check('Return picks first result', state.basePick === 'banana')

	// Token remove — the × affordance is a Pressable inside the token with
	// accessibilityLabel 'Remove <label>'.
	const tokRemove = findLabel('Remove REMOVABLE')
	check('token remove pressable present', !!tokRemove)
	if (tokRemove) {
		print('GTK_TA_PICK2 ' + pickAt(point(tokRemove)))
		await clickAt(tokRemove)
		await pump(150)
	}
	check('token remove fires', state.tokenRemove >= 1)
	const tokClick = findView('tok-click')
	if (tokClick) { await clickAt(tokClick); await pump(150) }
	check('token click fires', state.tokenClick >= 1)

	// Tokenizer: type a query, Return picks the highlighted row → add.
	const tkzInput = findByTypeUnder('textfield', 'tkz')
	if (tkzInput) { await clickAt(tkzInput); await pump(150) }
	await ready({ type: 'ban' })
	await pump(450)
	check('tokenizer menu shows Banana', !!findLabel('Banana'))
	await ready({ key: 'Return' })
	await pump(250)
	check('tokenizer add fires', state.tokenizerChanges.includes('add:banana'))
	check('new token renders', hasText('Banana'))

	// hasCreate path — type an unknown tag; the create entry is the first row.
	await ready({ type: 'kiwi' })
	await pump(450)
	check('create entry offered', !!findLabel('kiwi'))
	await ready({ key: 'Return' })
	await pump(250)
	check('create fires with typed id', state.tokenizerChanges.includes('create:kiwi'))

	// Remove a token via its × Pressable — 'Remove <label>' accessibility label.
	const removeBtn = findLabel('Remove Banana')
	if (removeBtn) { await clickAt(removeBtn); await pump(250) }
	check('token remove via × fires', state.tokenizerChanges.some((c) => c.startsWith('remove:')))

	// ComplexSelector — trigger opens the popover; row commit writes value.
	await ready({ key: 'Escape' })
	await pump(200)
	const csTrigger = findLabel('Select option')
	check('complex trigger present', !!csTrigger)
	if (csTrigger) { await clickAt(csTrigger); await pump(350) }
	check('complex selector popover opens', !!findLabel('CS-OPTION-B'))
	check('complex open reported', state.complexOpened >= 1)
	const row = findLabel('CS-OPTION-B')
	if (row) { await clickAt(row); await pump(250) }
	check('complex select commits value', state.complexValue === 'CS-OPTION-B')
	check('complex popover closes after commit', !findLabel('CS-OPTION-C'))

	// SelectableCard — click toggles through onChange.
	const card = findView('card')
	if (card) { await clickAt(card); await pump(150) }
	check('card select toggles', state.cardSelects.includes(true))

	// Teardown.
	settle()
	root.unmount()
	await pump(150)
	check('unmount releases all nodes', container.nodes.size === 0)

	print('GTK_TA ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	window.destroy()
	loop.quit()
}

run().catch((e) => {
	print('GTK_TA_ERROR ' + String(e && (e.stack || e)))
	window.destroy()
	loop.quit()
})
loop.run()
