import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { CalProbe, InputsProbe, state } from './ui-dates.gtk'

Gtk.init()

const diags: string[] = []
const diag = (tag: string, data: any) => { diags.push(tag + ' ' + JSON.stringify(data)) }
const dumpDiags = () => {
	try {
		GLib.file_set_contents('/tmp/gtk-dates-diag.json', JSON.stringify({ checks: checks.length, failures, diags }))
	} catch (e) { print('DIAG_WRITE_FAIL ' + e) }
}

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}

const window = new Gtk.Window({ title: 'Octane GTK Dates test', default_width: 700, default_height: 720, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

// A full GC while JS controls the stack keeps incremental sweeps from
// straddling GTK dispatch — a blocked source/handler is dropped, not retried.
const settle = () => { try { (globalThis as any).imports.system.gc() } catch { } }
const pump = (ms: number) => new Promise<void>((resolve) => {
	settle()
	let done = false
	const finish = () => { if (!done) { done = true; resolve() } }
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { finish(); return false })
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms + 800, () => { finish(); return false })
})

const findView = (id: string): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.props?.id === id) { return n.view }
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
// A calendar day cell is a masonview (vx-calendar-day) with onTap — the label
// inside it is viewless. Find the CELL view, not the label.
const findDayCell = (needle: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (!JSON.stringify(n.props).includes(needle)) { continue }
		} catch { continue }
		for (let cur = n; cur; cur = cur.parent) {
			if (typeof cur?.props?.className === 'string' && cur.props.className.includes('vx-calendar-day') && !cur.props.className.includes('--empty') && !cur.props.className.includes('--outside')) {
				const v = cur.view
				if (v && v.get_mapped?.()) { return v }
			}
		}
	}
	return null
}
// The day-cell NODE (not just the view) — for className / listener diags.
// Same as pickDayCell but the cell's logical ancestor chain must carry
// `ancestorId` — popover portals keep parentage into their host subtree, so
// this picks cells of the RIGHT field's popover when several are open.
const pickDayCellUnder = (needle: string, ancestorId: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (!JSON.stringify(n.props).includes(needle)) { continue }
		} catch { continue }
		for (let cur = n; cur; cur = cur.parent) {
			const cn = cur?.props?.className
			if (typeof cn !== 'string' || !cn.includes('vx-calendar-day') || cn.includes('--empty') || cn.includes('--outside')) { continue }
			let inScope = false
			for (let a = cur; a; a = a.parent) {
				if (a?.props?.id === ancestorId) { inScope = true; break }
			}
			if (!inScope) { continue }
			const v = cur.view
			if (!v || !v.get_mapped?.()) { continue }
			try {
				const c = point(v)
				if (c.x >= 0 && c.x <= 700 && c.y >= 0 && c.y <= 720) { return v }
			} catch { }
		}
	}
	return null
}
const findDayCellNode = (needle: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (!JSON.stringify(n.props).includes(needle)) { continue }
		} catch { continue }
		for (let cur = n; cur; cur = cur.parent) {
			const cn = cur?.props?.className
			if (typeof cn === 'string' && cn.includes('vx-calendar-day') && !cn.includes('--empty') && !cn.includes('--outside')) {
				if (cur.view && cur.view.get_mapped?.()) { return cur }
			}
		}
	}
	return null
}
// Prefer a day cell that is mapped AND inside the window bounds — skips
// stale popup subtrees that still exist in the node map.
const pickDayCell = (needle: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (!JSON.stringify(n.props).includes(needle)) { continue }
		} catch { continue }
		for (let cur = n; cur; cur = cur.parent) {
			if (typeof cur?.props?.className === 'string' && cur.props.className.includes('vx-calendar-day') && !cur.props.className.includes('--empty') && !cur.props.className.includes('--outside')) {
				const v = cur.view
				if (!v || !v.get_mapped?.()) { continue }
				const c = point(v)
				if (c.x >= 0 && c.x <= 700 && c.y >= 0 && c.y <= 720) { return v }
			}
		}
	}
	return findDayCell(needle)
}
const findUnder = (needle: string, ancestorId?: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (!JSON.stringify(n.props).includes(needle)) { continue }
		} catch { continue }
		let hit = false
		for (let cur = n; cur; cur = cur.parent) {
			if (ancestorId === undefined || cur?.props?.id === ancestorId) { hit = true; break }
		}
		if (!hit) { continue }
		let cur = n
		while (cur && !cur.view) { cur = cur.parent }
		if (cur?.view) { return cur.view }
	}
	return null
}
// Popover/layer content is portalled — scope by an ancestor's className.
const findInClass = (needle: string, classSub: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (!JSON.stringify(n.props).includes(needle)) { continue }
		} catch { continue }
		let hit = false
		for (let cur = n; cur; cur = cur.parent) {
			if (typeof cur?.props?.className === 'string' && cur.props.className.includes(classSub)) {
				hit = true
				break
			}
		}
		if (!hit) { continue }
		let cur = n
		while (cur && !cur.view) { cur = cur.parent }
		if (cur?.view) { return cur.view }
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
const describePoint = (tag: string, widget: any) => {
	try {
		const native = widget.get_native()
		const [ok, rect] = widget.compute_bounds(native)
		const [tx, ty] = native.get_surface_transform()
		const chain: any[] = []
		for (let s = native.get_surface(); s && typeof s.get_parent === 'function'; s = s.get_parent()) {
			chain.push({ name: s.constructor?.name, pos: [s.get_position_x?.(), s.get_position_y?.()] })
		}
		const [wx, wy] = window.get_surface_transform()
		diag('GEOM', { tag, native: native?.constructor?.name, ok, rect: ok ? { x: rect.origin.x, y: rect.origin.y, w: rect.size.width, h: rect.size.height } : null, tx, ty, chain, wx, wy, root: widget.get_root?.()?.constructor?.name })
	} catch (e) { diag('GEOM-ERR', { tag, e: String(e) }) }
}
// Move first, settle, then click — a bare move+click can outrun GTK's
// crossing/grab bookkeeping on a freshly opened popup surface.
const clickAtSettled = async (widget: any) => {
	const c = point(widget)
	await ready({ x: c.x, y: c.y, hover: true })
	await pump(120)
	await ready({ x: c.x, y: c.y })
}
const pickHit = (widget: any) => {
	try {
		const native = widget.get_native()
		const [ok, rect] = widget.compute_bounds(native)
		if (!ok) { return 'no-bounds' }
		const cx = rect.origin.x + rect.size.width / 2
		const cy = rect.origin.y + rect.size.height / 2
		const hit = native.pick?.(cx, cy, 0)
		const names: string[] = []
		for (let w = hit; w; w = w.get_parent?.()) {
			names.push(
				w.constructor?.name +
				':' + (w.get_css_name?.() ?? '') +
				':' + (w.get_label?.() ?? w.get_text?.() ?? '') +
				(w.get_sensitive?.() === false ? ':insensitive' : '') +
				(w.can_target === false ? ':no-target' : ''),
			)
		}
		return names.join(' < ')
	} catch (e) { return 'ERR ' + e }
}
const clickAt = async (widget: any) => {
	const c = point(widget)
	await ready({ x: c.x, y: c.y })
}

let readyResolve: (() => void) | null = null
// Popovers live in their own Gdk surfaces and take keyboard focus; the F12
// ack must be armed on every root, not just the window.
const armed = new Set<any>()
const onKey = (_c: any, keyval: number) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
}
const armAcks = () => {
	for (const n of (container as any).nodes.values()) {
		const r = n?.view?.get_root?.()
		if (r && !armed.has(r)) {
			armed.add(r)
			const ctl = new Gtk.EventControllerKey()
			ctl.connect('key-pressed', onKey)
			r.add_controller(ctl)
		}
	}
}
const ready = (payload: any) => {
	armAcks()
	settle()
	print('GTK_DATES_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => {
		readyResolve = resolve
		// Fallbacks: popup surfaces can swallow the ack key, and a GC sweep can
		// eat a source dispatch — stagger retries so neither wedges the run.
		for (const ms of [350, 900, 1800, 3000]) {
			GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => {
				if (readyResolve === resolve) { readyResolve = null; resolve() }
				return false
			})
		}
	})
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', onKey)

async function run() {
	root.render(CalProbe, {})
	await pump(50)
	window.present()
	await pump(300)

	check('Calendar mounts', !!findView('cal'))
	check('range Calendar mounts', !!findView('cal-range'))
	check('calendar month title renders', !!findUnder('June 2025', 'cal'))

	// Calendar hooks — navigation flips the derived month grid.
	check('hook month June', state.hookMonth === '2025-06')
	check('hook grid has days', state.hookDays >= 35)
	check('constraint disables outside date', state.hookDisabledOut === true)
	check('constraint allows in-range date', state.hookDisabledIn === false)
	const hookNext = findView('hook-next')
	if (hookNext) { await clickAt(hookNext); await pump(200) }
	check('navigateMonths advances grid', state.hookMonth === '2025-07')

	// Calendar — real click on a day cell writes the ISO date.
	const day15 = pickDayCell('June 15')
	check('day cell present', !!day15)
	if (day15) { await clickAt(day15); await pump(200) }
	check('day pick fires ISO date', state.calPick === '2025-06-15')

	// Month navigation via the chevron Pressable.
	const next = findUnder('Next month', 'cal')
	if (next) { await clickAt(next); await pump(200) }
	check('next month navigates', !!findUnder('July 2025', 'cal'))

	// Range calendar — anchored 'August 2025' — two clicks complete a range.
	check('range day cells present', !!pickDayCell('August 10') && !!pickDayCell('August 20'))
	// Two-click range: click start then end ONCE per attempt — re-clicking the
	// anchor commits a single-day range (applyRangePick same-day semantics).
	for (let attempt = 0; attempt < 5 && !(state.rangePick?.start === '2025-08-10' && state.rangePick?.end === '2025-08-20'); attempt++) {
		const r10 = pickDayCell('August 10')
		diag('r10', { attempt, found: !!r10, state: state.rangePick ?? null })
		if (r10) { await clickAt(r10); await pump(300) }
		const r20 = pickDayCell('August 20')
		diag('r20', { attempt, found: !!r20, state: state.rangePick ?? null })
		if (r20) { await clickAt(r20); await pump(300) }
	}
	diag('range', state.rangePick ?? null)
	check('range pick fires start+end', state.rangePick?.start === '2025-08-10' && state.rangePick?.end === '2025-08-20')

	// Phase 2 — the input column in a fresh render (window-height bound).
	root.render(InputsProbe, {})
	await pump(250)
	check('DateInput mounts', !!findView('di'))
	check('TimeInput mounts', !!findView('ti'))
	check('DateTimeInput mounts', !!findView('dti'))
	check('DateRangeInput mounts', !!findView('dri'))

	// DateInput — 'adaptive-native' resolves to a Popover on a fine-pointer
	// desktop: calendar in an anchored layer, NOT an overlay sheet.
	const diToggle = findUnder('Open di calendar', 'di') ?? findLabel('Open di calendar')
	check('date toggle present', !!diToggle)
	if (diToggle) { await clickAt(diToggle); await pump(500) }
	check('calendar popover opens', !!pickDayCell('June 15'))
	check('no sheet overlay for popover', ((container as any).overlayLayers?.size ?? 0) === 0)
	// Popover autohides on an outside-press: if a click misses and closes it,
	// re-open via the toggle before the next attempt.
	for (let attempt = 0; attempt < 5 && state.datePopover !== '2025-06-15'; attempt++) {
		let popDay = pickDayCell('June 15')
		if (!popDay) {
			await pump(300)
			popDay = pickDayCell('June 15')
		}
		if (!popDay) {
			const tgl = findUnder('Open di calendar', 'di') ?? findLabel('Open di calendar')
			if (tgl) { await clickAt(tgl); await pump(600) }
			popDay = pickDayCell('June 15')
			if (!popDay) { continue }
		}
		if (attempt === 0) { describePoint('popDay', popDay) }
		await clickAtSettled(popDay)
		await pump(300)
	}
	check('popover day pick writes value', state.datePopover === '2025-06-15')
	await ready({ key: 'Escape' })
	await pump(200)

	// Typed entry — click the field, type ISO, commit with Return.
	const diField = findByTypeUnder('textfield', 'di-typed')
	check('typed date field present', !!diField)
	if (diField) { await clickAt(diField); await pump(200); diField.focus?.(); await pump(100) }
	await ready({ type: '2025-07-04' })
	await pump(150)
	await ready({ key: 'Return' })
	await pump(200)
	check('typed date commits', state.dateTyped === '2025-07-04')

	// TimeInput default presentation = typed field on fine pointer.
	const tiField = findByTypeUnder('textfield', 'ti')
	check('time field present', !!tiField)
	if (tiField) { await clickAt(tiField); await pump(200); tiField.focus?.(); await pump(100) }
	await ready({ type: '14:30' })
	await pump(150)
	await ready({ key: 'Return' })
	await pump(200)
	check('typed time commits', state.timeTyped === '14:30')

	// TimeInput 'bottom-sheet' — opens a real BottomSheet with wheel columns.
	const sheetField = findLabel('Open sheet picker')
	check('sheet field present', !!sheetField)
	if (sheetField) { await clickAt(sheetField); await pump(500) }
	check('sheet overlay opens', ((container as any).overlayLayers?.size ?? 0) >= 1)
	const min30 = findLabel('Minute 30')
	check('wheel columns render', !!findLabel('Hour 14') && !!min30)
	// Wheel rows allocate at content offsets — find an Hour row that is mapped
	// and inside the window, click it, and expect its value on Done.
	let hourRow: any = null
	let hourValue = ''
	for (let h = 0; h < 24 && !hourRow; h++) {
		const needle = 'Hour ' + String(h).padStart(2, '0')
		const row = findLabel(needle)
		if (!row) { continue }
		try {
			const c = point(row)
			if (c.y > 150 && c.y < 690 && row.get_mapped?.()) { hourRow = row; hourValue = String(h).padStart(2, '0') }
		} catch { }
	}
	diag('hourRow', { found: !!hourRow, value: hourValue })
	if (hourRow) { await clickAt(hourRow); await pump(150) }
	const done = findLabel('Done')
	if (done) { await clickAt(done); await pump(250) }
	diag('sheet', { committed: state.timeSheet ?? null, expectedHour: hourValue })
	check('sheet time commits', hourValue !== '' && state.timeSheet === hourValue + ':30')
	check('sheet closes after commit', !findLabel('Hour 14'))

	// DateTimeInput — calendar icon opens the popover; day pick keeps the
	// time part of the ISO datetime.
	{
		const toggles: any[] = []
		for (const n of (container as any).nodes.values()) {
			try {
				if (!JSON.stringify(n.props).includes('Open calendar')) { continue }
			} catch { continue }
			const ids: string[] = []
			for (let cur = n; cur; cur = cur.parent) {
				if (cur?.props?.id) { ids.push(cur.props.id) }
			}
			let cur = n
			while (cur && !cur.view) { cur = cur.parent }
			toggles.push({ type: n.type, cls: n?.props?.className, ids, mapped: !!cur?.view?.get_mapped?.() })
		}
		diag('toggles', toggles)
	}
	// 'Open calendar' is shared across date fields — di-typed's vx-dateinput-toggle
	// comes first in node order, so discriminate by the dti toggle's class.
	await ready({ key: 'Escape' })
	await pump(250)
	const dtToggle = findInClass('Open calendar', 'vx-datetimeinput-calendartoggle') ?? findLabel('Open calendar')
	diag('dtToggle-found', { scoped: !!findInClass('Open calendar', 'vx-datetimeinput-calendartoggle'), any: !!dtToggle })
	if (dtToggle) { await clickAt(dtToggle); await pump(500) }
	// The popover month tracks the input's pending value — read the shown
	// month title and pick day 15 of it adaptively.
	let monthTitle = ''
	const MONTHS: Record<string, string> = { January: '01', February: '02', March: '03', April: '04', May: '05', June: '06', July: '07', August: '08', September: '09', October: '10', November: '11', December: '12' }
	for (const n of (container as any).nodes.values()) {
		try {
			const s = JSON.stringify(n.props)
			const m = s.match(/(January|February|March|April|May|June|July|August|September|October|November|December) \d{4}/)
			if (m) { monthTitle = m[0]; break }
		} catch { }
	}
	const mm = monthTitle.match(/(\w+) (\d{4})/)
	const dayNeedle = mm ? mm[1] + ' 15' : 'June 15'
	for (let attempt = 0; attempt < 5 && !/-15T10:00/.test(String(state.dtPick ?? '')); attempt++) {
		let dtDay = pickDayCell(dayNeedle)
		if (!dtDay) {
			await pump(300)
			dtDay = pickDayCell(dayNeedle)
		}
		if (!dtDay) {
			// popover autohided — re-open via the toggle
			if (dtToggle) { await clickAt(dtToggle); await pump(600) }
			dtDay = pickDayCell(dayNeedle)
			if (!dtDay) { continue }
		}
		if (attempt === 0) {
			describePoint('dtday', dtDay)
			// Instrument: does a real press reach the cell's widget tree at all?
			try {
				const ctl = new Gtk.EventControllerLegacy()
				ctl.connect('event', (_c: any, ev: any) => {
					try { diag('pev', { t: ev.get_event_type(), x: ev.get_position?.()?.[0] }) } catch { }
					return false
				})
				dtDay.add_controller(ctl)
				diag('pev-armed', dtDay.get_root?.()?.constructor?.name)
			} catch (e) { diag('pev-err', String(e)) }
		}
		try {
			const dn = findDayCellNode(dayNeedle)
			diag('dtday', { attempt, needle: dayNeedle, pt: point(dtDay), cls: dn?.props?.className, tap: !!dn?.listeners?.has?.('tap'), hit: pickHit(dtDay) })
		} catch (e) { diag('dtday-err', String(e)) }
		await clickAtSettled(dtDay)
		await pump(300)
		// Move off the cell so the next attempt is a fresh single press, not
		// n_press++ on the same spot (double-click suppression territory).
		await ready({ x: 8, y: 8, hover: true })
	}
	diag('dtpick', { month: monthTitle, pick: state.dtPick ?? null, all: { ...state } })
	check('datetime pick keeps time part', /-15T10:00/.test(String(state.dtPick ?? '')))

	// Close the datetime popover before the next surface.
	await ready({ key: 'Escape' })
	await pump(250)

	// DateRangeInput — trigger opens the Popover (fine-pointer surface).
	const driTrigger = findLabel('Select a date range')
	check('range trigger present', !!driTrigger)
	if (driTrigger) { await clickAt(driTrigger); await pump(500) }
	check('range popover calendar opens', !!pickDayCell('June 15') && !!pickDayCell('June 20'))
	for (let attempt = 0; attempt < 6 && !(state.rangeInput?.start === '2025-06-15' && state.rangeInput?.end === '2025-06-20'); attempt++) {
		if (!pickDayCell('June 15')) {
			// popover autohided — re-open the trigger
			if (driTrigger) { await clickAt(driTrigger); await pump(600) }
		}
		const s15 = pickDayCell('June 15')
		try { diag('s15', { attempt, found: !!s15, pt: s15 ? point(s15) : null }) } catch (e) { diag('s15-err', String(e)) }
		if (attempt === 0 && s15) { describePoint('s15', s15) }
		if (s15) { await clickAt(s15); await pump(300) }
		const s20 = pickDayCell('June 20')
		try { diag('s20', { attempt, found: !!s20, pt: s20 ? point(s20) : null }) } catch (e) { diag('s20-err', String(e)) }
		if (s20) { await clickAt(s20); await pump(300) }
	}
	check('range input fires', state.rangeInput?.start === '2025-06-15' && state.rangeInput?.end === '2025-06-20')

	// Teardown.
	settle()
	root.unmount()
	await pump(150)
	check('unmount releases all nodes', container.nodes.size === 0)

	dumpDiags()
	print('GTK_DATES ' + JSON.stringify({ checks: checks.length, failures, osInput: true, gtk: '4.14.5' }))
	window.destroy()
	loop.quit()
}

run().catch((e) => {
	diags.push('ERROR ' + String(e && (e.stack || e)))
	dumpDiags()
	print('GTK_DATES_ERROR ' + String(e && (e.stack || e)))
	window.destroy()
	loop.quit()
})
loop.run()
