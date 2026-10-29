/** `pager` — the shared paged-container extension element. An NSScrollView
 *  whose document holds one clip-sized host per item laid side by side;
 *  scrolling snaps to the nearest page after the gesture settles (mandatory
 *  scroll-snap semantics, matching the web leaf's scroller). AppKit has no
 *  native paging control — this is the scroll-snap model the shared
 *  contract targets on every target. */

import {
	NSNotificationCenter,
	NSScrollView,
	NSView,
	NSViewBoundsDidChangeNotification,
} from '@octane-xplat/platform/macos'

type View = NSView & Record<string, any>
type Props = Record<string, any>

interface PagerPage {
	host: View
	index: number
	bound: boolean
	portalId?: number
	portalGeneration?: number
	portalItem?: any
	portalActive?: boolean
	portalNotify?: (event: any) => void
}

interface PagerState {
	view: View
	clip: View
	document: View
	pages: PagerPage[]
	pageConstraints: any[]
	props: Props
	count: number
	current: number
	settleTimer?: ReturnType<typeof setTimeout>
	boundsObserver?: any
	closed: boolean
	/** Suppresses the settle callback's onSelectedIndexChange for the
	 *  programmatic scroll it accompanies — writes never echo, same as the
	 *  web leaf's tracked-index mute. */
	mutedTarget?: number
}

const states = new WeakMap<object, PagerState>()
let nextPortalPageId = 0

function pageIndex(state: PagerState): number {
	const width = Number(state.clip.bounds?.size?.width ?? 0)
	if (!(width > 0)) {
		return state.current
	}

	const x = Number(state.clip.bounds?.origin?.x ?? 0)
	return Math.max(0, Math.min(state.count - 1, Math.round(x / width)))
}

function scrollToPage(state: PagerState, index: number) {
	const width = Number(state.clip.bounds?.size?.width ?? 0)
	const x = Math.max(0, Math.min(state.count - 1, index)) * width
	if (x === Number(state.clip.bounds?.origin?.x ?? 0)) {
		return
	}

	state.clip.scrollToPoint({ x, y: 0 })
	state.view.reflectScrolledClipView?.(state.clip)
}

/** After the gesture's bounds changes idle out, land on the nearest page and
 *  report it. Mirrors the web leaf's 90 ms scroll-idle debounce. */
function scheduleSettle(state: PagerState) {
	if (state.settleTimer !== undefined) {
		clearTimeout(state.settleTimer)
	}

	state.settleTimer = setTimeout(() => {
		state.settleTimer = undefined
		if (state.closed) {
			return
		}

		const index = pageIndex(state)
		scrollToPage(state, index)
		if (index === state.current) {
			return
		}

		state.current = index
		if (state.mutedTarget === index) {
			return
		}

		state.props.onSelectedIndexChange?.(
			Object.freeze({ eventName: 'selectedIndexChange', object: state.view, value: index }),
		)
	}, 90)
}

function releasePage(page: PagerPage) {
	if (!page.portalActive) {
		return
	}

	page.portalActive = false
	page.portalNotify?.({ type: 'release', id: page.portalId, generation: page.portalGeneration })
	page.portalNotify = undefined
}

function bindPage(state: PagerState, page: PagerPage, index: number) {
	const item = state.props.items?.[index]
	page.index = index
	page.bound = true
	page.host.bindingContext = item
	if (state.props.__onCellTarget) {
		const changed =
			!page.portalActive || !Object.is(page.portalItem, item) || page.host.__portalIndex !== index
		page.portalId ??= nextPortalPageId++
		if (changed) {
			page.portalGeneration = (page.portalGeneration ?? 0) + 1
		}

		page.portalActive = true
		page.portalItem = item
		page.host.__portalIndex = index
		page.portalNotify = state.props.__onCellTarget
		page.portalNotify({
			type: 'bind',
			id: page.portalId,
			generation: page.portalGeneration,
			target: page.host,
			item,
			index,
		})
	}

	state.props.onItemLoading?.(
		Object.freeze({ eventName: 'itemLoading', object: state.view, index, view: page.host }),
	)
}

function unbindPage(state: PagerState, page: PagerPage) {
	if (!page.bound) {
		return
	}

	releasePage(page)
	page.bound = false
	page.index = -1
	page.host.bindingContext = undefined
	page.host.removeFromSuperview()
	state.props.onItemDisposing?.(
		Object.freeze({ eventName: 'itemDisposing', object: state.view, index: page.index, view: page.host }),
	)
}

/** Constrain each page host to the clip size, chained across the document's
 *  width — clip resizes (window/layout) flow through to every page. */
function layoutPages(state: PagerState) {
	for (const constraint of state.pageConstraints ?? []) {
		constraint.active = false
	}

	state.pageConstraints = []
	const clip = state.clip
	let previous: View | null = null
	for (const page of state.pages) {
		const host = page.host
		state.pageConstraints.push(
			host.widthAnchor.constraintEqualToAnchor(clip.widthAnchor),
			host.topAnchor.constraintEqualToAnchor(clip.topAnchor),
			host.bottomAnchor.constraintEqualToAnchor(clip.bottomAnchor),
			previous
				? host.leadingAnchor.constraintEqualToAnchor(previous.trailingAnchor)
				: host.leadingAnchor.constraintEqualToAnchor(state.document.leadingAnchor),
		)
		previous = host
	}

	if (previous) {
		state.pageConstraints.push(
			state.document.trailingAnchor.constraintEqualToAnchor(previous.trailingAnchor),
		)
	}

	for (const constraint of state.pageConstraints) {
		constraint.active = true
	}
}

export function makePagerView(): NSView {
	const view = NSScrollViewMake() as View
	view.translatesAutoresizingMaskIntoConstraints = false
	view.hasHorizontalScroller = false
	view.hasVerticalScroller = false
	view.drawsBackground = false
	const document = NSView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 0, height: 0 },
	}) as View

	view.documentView = document
	const clip = view.contentView
	clip.postsBoundsChangedNotifications = true
	const state: PagerState = {
		view,
		clip,
		document,
		pages: [],
		pageConstraints: [],
		props: {},
		count: 0,
		current: 0,
		closed: false,
	}

	states.set(view, state)
	state.boundsObserver =
		NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
			NSViewBoundsDidChangeNotification,
			clip,
			null,
			() => scheduleSettle(state),
		)

	return view
}

function NSScrollViewMake() {
	return NSScrollView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 200, height: 200 },
	})
}

export function updatePagerView(view: NSView, props: Props) {
	const state = states.get(view)!
	const previous = state.props
	state.props = props
	const count = Number(props.items?.length ?? 0)

	while (state.pages.length < count) {
		const host = NSView.alloc().initWithFrame({
			origin: { x: 0, y: 0 },
			size: { width: 0, height: 0 },
		}) as View

		host.translatesAutoresizingMaskIntoConstraints = false
		state.pages.push({ host, index: -1, bound: false })
	}

	while (state.pages.length > count) {
		unbindPage(state, state.pages.pop()!)
	}

	if (previous.items !== props.items || count !== state.count) {
		layoutPages(state)
	}

	state.count = count
	for (let index = 0; index < count; index++) {
		bindPage(state, state.pages[index], index)
	}

	const selected = Number(props.selectedIndex ?? state.current)
	if (Number.isFinite(selected) && selected !== state.current) {
		// Programmatic writes scroll to the page; the settle reports the
		// arrival but is muted against echoing back through
		// onSelectedIndexChange — matching the web leaf's tracked-index rule.
		state.mutedTarget = Math.max(0, Math.min(count - 1, selected))
		state.current = state.mutedTarget
		scrollToPage(state, state.mutedTarget)
	}
}

export function disposePagerView(view: NSView) {
	const state = states.get(view)
	if (!state || state.closed) {
		return
	}

	state.closed = true
	if (state.settleTimer !== undefined) {
		clearTimeout(state.settleTimer)
		state.settleTimer = undefined
	}

	if (state.boundsObserver) {
		NSNotificationCenter.defaultCenter.removeObserver(state.boundsObserver)
		state.boundsObserver = undefined
	}

	for (const constraint of state.pageConstraints ?? []) {
		constraint.active = false
	}

	for (const page of state.pages) {
		unbindPage(state, page)
	}

	state.pages = []
	state.view.documentView = null
	states.delete(view)
}
