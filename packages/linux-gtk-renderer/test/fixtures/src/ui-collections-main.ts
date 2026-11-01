import Gtk from 'gi://Gtk?version=4.0'
import GLib from 'gi://GLib'
import Gdk from 'gi://Gdk?version=4.0'
import { createGtkRoot } from '@octane-xplat/linux-gtk'
import { CollectionsProbe, events, state } from './ui-collections.gtk'

Gtk.init()

const checks: string[] = []
const failures: string[] = []
const check = (name: string, ok: boolean | unknown) => {
	checks.push(name)
	if (!ok) { failures.push(name) }
}
const osInput = GLib.getenv('GTK_COLL_OS') === '1'

const window = new Gtk.Window({ title: 'Octane GTK Collections test', default_width: 640, default_height: 1000, decorated: false })
const host = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL })
window.set_child(host)
const { root, container } = createGtkRoot(host, {})
const loop = GLib.MainLoop.new(null, false)

const pump = (ms: number) => new Promise<void>((resolve) => {
	GLib.timeout_add(GLib.PRIORITY_DEFAULT, ms, () => { resolve(); return false })
})

const findView = (id: string): any => {
	for (const n of (container as any).nodes.values()) {
		if (n?.props?.id === id) { return n.view }
	}
	return null
}
const hasText = (needle: string): boolean => {
	for (const n of (container as any).nodes.values()) {
		try { if (JSON.stringify(n.props).includes(needle)) { return true } } catch { }
	}
	return false
}
const countText = (needle: string): number => {
	let count = 0
	for (const n of (container as any).nodes.values()) {
		try { if (JSON.stringify(n.props).includes(needle)) { count++ } } catch { }
	}
	return count
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
const findClass = (cls: string): any => {
	for (const n of (container as any).nodes.values()) {
		try {
			if (String(n.props?.className ?? '').includes(cls) && n.view) { return n.view }
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

let readyResolve: (() => void) | null = null
const ready = (payload: any) => {
	print('GTK_COLL_READY ' + JSON.stringify(payload))
	return new Promise<void>((resolve) => { readyResolve = resolve })
}
const keyCtl = new Gtk.EventControllerKey()
window.add_controller(keyCtl)
keyCtl.connect('key-pressed', (_c, keyval) => {
	if (keyval === Gdk.KEY_F12 && readyResolve) { readyResolve(); readyResolve = null }
	return false
})

const clickAt = async (widget: any, tag = '?') => {
	const c = point(widget)
	if (c.x === 0 && c.y === 0) { failures.push('degenerate-bounds:' + tag) }
	// Race the F12 handshake — a swallowed ack (open popover, missed hit)
	// must not deadlock the run.
	await Promise.race([ready({ x: c.x, y: c.y }), pump(2500)])
	await pump(220)
	return c
}

async function run() {
	root.render(CollectionsProbe, {})
	await pump(50)
	window.present()
	await pump(600)

	check('Collapsible mounts', !!findView('coll'))
	check('CollapsibleGroup mounts', !!findView('cgrp'))
	check('Accordion single mounts', !!findView('acc-single'))
	check('Accordion multiple mounts', !!findView('acc-multi'))
	check('GridList mounts', !!findView('grid'))
	check('OverflowList mounts', !!findView('ovf'))
	check('Carousel mounts', !!findView('car'))
	check('TreeList mounts', !!findView('tree'))
	check('VirtualList mounts', !!findView('vlist'))

	check('useGridList reports unsupported + empty props on native',
		state.gridSupported === false && state.gridPropsEmpty === true)

	// Collapsible — real trigger click toggles the body.
	const collTrig = findLabel('COLL TRIGGER')
	if (collTrig) {
		await clickAt(collTrig, 'coll-trig')
		await pump(150)
		check('Collapsible opens on trigger click', hasText('COLL BODY') && state.collapsibleOpen === true)
		await clickAt(findLabel('COLL TRIGGER') ?? collTrig, 'coll-trig-2')
		await pump(150)
		check('Collapsible closes on second click', !hasText('COLL BODY') && state.collapsibleOpen === false)
	}

	// CollapsibleGroup — single mode opens one at a time.
	const gaTrig = findLabel('GA TRIG')
	if (gaTrig) {
		await clickAt(gaTrig, 'ga-trig')
		await pump(150)
		check('Group opens first item', hasText('GA BODY') && state.groupChange === 'ga')
		await clickAt(findLabel('GB TRIG') ?? gaTrig, 'gb-trig')
		await pump(150)
		check('Group single swaps open item',
			hasText('GB BODY') && !hasText('GA BODY') && state.groupChange === 'gb')
	}

	// Accordion single — exclusive open.
	const sectTwo = findLabel('SECT TWO')
	if (sectTwo) {
		await clickAt(sectTwo, 'sect-two')
		await pump(150)
		check('Accordion opens section two', hasText('SECT2 BODY') && state.accordionSingle === 's2')
		await clickAt(findLabel('SECT ONE') ?? sectTwo, 'sect-one')
		await pump(150)
		check('Accordion single closes previous',
			hasText('SECT1 BODY') && !hasText('SECT2 BODY') && state.accordionSingle === 's1')
	}

	// Accordion multiple — both open.
	const multiOne = findLabel('MULTI ONE')
	if (multiOne) {
		await clickAt(multiOne, 'multi-one')
		await pump(150)
		await clickAt(findLabel('MULTI TWO') ?? multiOne, 'multi-two')
		await pump(150)
		check('Accordion multiple keeps both open',
			hasText('MULTI1 BODY') &&
				hasText('MULTI2 BODY') &&
				Array.isArray(state.accordionMulti) &&
				state.accordionMulti.includes('m1') &&
				state.accordionMulti.includes('m2'))
	}

	// GridList — tap selects + fires onAction.
	const gcell2 = findLabel('GCELL 2')
	if (gcell2) {
		await clickAt(gcell2, 'gcell-2')
		await pump(150)
		check('GridList tap selects + actions',
			state.gridAction === 'g2' &&
				Array.isArray(state.gridSelection) &&
				state.gridSelection.includes('g2'))
	}
	const gcell1 = findLabel('GCELL 1')
	if (gcell1) {
		await clickAt(gcell1, 'gcell-1')
		await pump(150)
		check('GridList tap moves selection',
			state.gridAction === 'g1' &&
				Array.isArray(state.gridSelection) &&
				state.gridSelection.includes('g1') &&
				!state.gridSelection.includes('g2'))
	}
	const gcell3 = findLabel('GCELL 3')
	if (gcell3) {
		await clickAt(gcell3, 'gcell-3')
		await pump(150)
		check('GridList row-2 tap selects + actions',
			state.gridAction === 'g3' &&
				Array.isArray(state.gridSelection) &&
				state.gridSelection.includes('g3') &&
				!state.gridSelection.includes('g1'))
	}

	// OverflowList — fixed-width host overflows at mount (property evidence).
	check('OverflowList reports collapsed items',
		state.overflowCount > 0 &&
			hasText('MORE') &&
			Array.isArray(state.overflowIndexes) &&
			state.overflowIndexes.length === state.overflowCount)
	check('OverflowList keeps earlier items visible', hasText('OVF ITEM0'))

	// Carousel — prev/next buttons scroll the viewport.
	const carouselView = findClass('vx-carousel-viewport')
	const carNext = findClass('vx-carousel-next')
	check('Carousel next button mounts', !!carNext)
	if (carNext && carouselView) {
		await clickAt(carNext, 'car-next')
		await pump(500)
		check('Carousel next scrolls viewport forward', (carouselView.scrollLeft ?? 0) > 20)
		const carPrev = findClass('vx-carousel-prev')
		if (carPrev) {
			await clickAt(carPrev, 'car-prev')
			await pump(500)
			check('Carousel prev scrolls back', (carouselView.scrollLeft ?? 0) <= 20)
		}
	}

	// Carousel scrollTo — imperative slide seek (eachChildView offsets).
	if (state.carousel?.current?.scrollTo) {
		state.carousel.current.scrollTo(2)
		await pump(700)
		check('Carousel scrollTo lands on slide offset', (carouselView?.scrollLeft ?? 0) > 100)
	}

	// Carousel snap — a partial offset settles onto the nearest slide edge.
	if (carouselView) {
		carouselView.scrollLeft = 40
		await pump(900)
		check('Carousel snap settles to slide edge',
			Math.abs((carouselView.scrollLeft ?? 0)) < 8 ||
				Math.abs((carouselView.scrollLeft ?? 0) - 160) < 12 ||
				Math.abs((carouselView.scrollLeft ?? 0) - 168) < 12)
	}

	// TreeList — parent row toggles expansion; leaf rows select + action.
	const treeParent = findLabel('PARENT NODE')
	if (treeParent) {
		await clickAt(treeParent, 'tree-parent')
		await pump(200)
		check('TreeList parent expands children',
			hasText('CHILD ONE') &&
				hasText('CHILD TWO') &&
				Array.isArray(state.treeExpanded) &&
				state.treeExpanded.includes('parent'))
	}
	const treeChild = findLabel('CHILD ONE')
	if (treeChild) {
		await clickAt(treeChild, 'tree-child')
		await pump(200)
		check('TreeList leaf selects + actions',
			state.treeAction === 'child1' &&
				Array.isArray(state.treeSelection) &&
				state.treeSelection.includes('child1'))
	}
	const treeParentAgain = findLabel('PARENT NODE')
	if (treeParentAgain) {
		await clickAt(treeParentAgain, 'tree-parent-2')
		await pump(200)
		check('TreeList parent collapses', !hasText('CHILD ONE'))
	}

	// VirtualList — bounded window mounts only part of the data; the handle
	// seeks and mounts the destination rows.
	check('VirtualList renders a bounded window', countText('VROW ') < 60)
	check('VirtualList tail rows unmounted before seek', !hasText('VROW 100'))
	if (state.vlist?.current?.scrollToIndex) {
		state.vlist.current.scrollToIndex(100)
		await pump(800)
		check('VirtualList scrollToIndex mounts destination rows', hasText('VROW 100'))
		const vlistView = findClass('vx-virtual-list')
		check('VirtualList viewport offset follows the seek',
			(vlistView?.scrollTop ?? 0) > 0)
	}

	const result = {
		checks: checks.length,
		failures,
		osInput,
		gtk: Gtk.get_major_version() + '.' + Gtk.get_minor_version(),
		events: events.slice(0, 40),
	}
	print('GTK_COLL ' + JSON.stringify(result))
	loop.quit()
}

run().catch((e) => {
	print('GTK_COLL_FATAL ' + String(e?.message ?? e) + ' | ' + String(e?.stack ?? ''))
	loop.quit()
})
loop.run()
