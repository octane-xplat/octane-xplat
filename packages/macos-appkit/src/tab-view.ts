import type { ElementNode, AppKitView } from './index'
import {
	NSAttributedString,
	NSBundle,
	NSColor,
	NSFontAttributeName,
	NSForegroundColorAttributeName,
	NSImage,
	NSObject,
	NSTabView,
	NSTabViewDelegate,
	NSTabViewItem,
	NSURL,
	NSURLSession,
	NSView,
} from '@octane-xplat/platform/macos'

import { registerGestureClass } from './gestures'
import { defineUniversalComponent } from 'octane/universal/native'
import { loadImage } from './image'
import { resolveFont } from './fonts'

/** Compiler adapter for JSX spreads: read getters once and remove the outer
 * root's children channel while preserving ordinary key/ref/prop ordering. */
export function __tabItemProps(props: any) {
	if (props == null) {
		return props
	}

	const attributes = { ...props }
	if (Object.prototype.hasOwnProperty.call(attributes, 'children')) {
		attributes.__tabContent = attributes.children
		delete attributes.children
	}

	return attributes
}

const contentComponent = defineUniversalComponent('macos', (props: any) => props.content)

// A brand cannot be forged by supplying an object with a matching type string.
const handles = new WeakSet<object>()
const owners = new WeakMap<object, ElementNode>()
const delegates = new WeakMap<object, ElementNode>()

class TabDelegate extends NSObject {
	static ObjCProtocols = [NSTabViewDelegate]
	static {
		registerGestureClass(this)
	}
	tabViewDidSelectTabViewItem(view: any, _item: any) {
		const node = delegates.get(this)
		if (!node || node.tabSyncing) {
			return
		}

		const index = Number(view.indexOfTabViewItem(view.selectedTabViewItem))
		const deliver = () => {
			node.tabRequested = index
			notifySelection(node, index)
		}

		if (node.container.root) {
			node.container.root.eventScope('discrete', deliver)
		} else {
			deliver()
		}
	}
}

/** NSTabView's ordinary tabs do not display the item's image. Include it in
 * label measurement/drawing rather than accepting an invisible iconSource. */
class IconTabItem extends NSTabViewItem {
	static {
		registerGestureClass(this)
	}
	sizeOfLabel(minimum: boolean) {
		const size = super.sizeOfLabel(minimum)
		return this.image ? { width: size.width + 20, height: Math.max(16, size.height) } : size
	}

	drawLabelInRect(truncate: boolean, rect: any) {
		if (!this.image) {
			super.drawLabelInRect(truncate, rect)
			return
		}

		this.image.drawInRectFromRectOperationFraction(
			{ origin: rect.origin, size: { width: 16, height: 16 } },
			{ origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
			2,
			1,
		)

		super.drawLabelInRect(truncate, {
			origin: { x: rect.origin.x + 20, y: rect.origin.y },
			size: { width: Math.max(0, rect.size.width - 20), height: rect.size.height },
		})
	}
}

export function validateTabProps(type: string, props: Record<string, any>) {
	if (type === 'tabview') {
		if (
			props.items != null &&
			(!Array.isArray(props.items) ||
				props.items.some((item: any) => !item || !handles.has(item) || item.tabDisposed))
		) {
			throw new TypeError(
				'AppKit tabview items must be an array of live tabviewitem logical handles obtained through refs',
			)
		}

		if (props.items && new Set(props.items).size !== props.items.length) {
			throw new TypeError('AppKit tabview items must not contain duplicate handles')
		}

		if (props.selectedIndex != null && !Number.isInteger(props.selectedIndex)) {
			throw new TypeError('AppKit tabview selectedIndex must be an integer')
		}
	} else {
		if (props.title != null && typeof props.title !== 'string') {
			throw new TypeError('AppKit tabviewitem title must be a string')
		}

		if ('view' in props || 'contentRoot' in props) {
			throw new TypeError(
				'AppKit tabviewitem content root cannot be reassigned; update JSX children instead',
			)
		}

		if (props.iconSource != null && typeof props.iconSource === 'object') {
			iconImage(props.iconSource)
		}

		if (
			props.iconSource != null &&
			typeof props.iconSource !== 'string' &&
			typeof props.iconSource !== 'object'
		) {
			throw new TypeError('AppKit tabviewitem iconSource must be a string or host image source')
		}
	}
}

export function makeTabView(node: ElementNode): AppKitView {
	const view = NSTabView.alloc().init()
	view.translatesAutoresizingMaskIntoConstraints = false
	const delegate = TabDelegate.new()
	delegates.set(delegate, node)
	view.delegate = delegate
	node.tabDelegate = delegate // AppKit holds its delegate weakly.
	node.tabItems = []
	node.tabIndex = -1
	node.tabRequested = -1
	return view as AppKitView
}

export function makeTabItem(node: ElementNode) {
	handles.add(node)
	node.tabContentRoot = null
	const item = IconTabItem.alloc().initWithIdentifier(String(node.id))
	const content = NSView.new()
	content.autoresizingMask = 18 // NSViewWidthSizable | NSViewHeightSizable
	node.tabNativeItem = item
	// Logical refs always have view:null; the host owns this content root.
	node.childHost = content as AppKitView
	item.view = content
	Object.defineProperty(node, 'contentRoot', {
		get: () => node.tabContentRoot,
		set: () => {
			throw new TypeError(
				'AppKit tabviewitem content root cannot be reassigned; update JSX children instead',
			)
		},
	})
}

function iconImage(source: any, style: Record<string, any> = {}): any {
	if (source == null || source === '') {
		return null
	}

	if (typeof source !== 'string') {
		// Shared ImageSource-like handles expose their platform image.
		const image = source.macos ?? source.nativeImage ?? source
		if (typeof image.drawInRectFromRectOperationFraction !== 'function') {
			throw new TypeError('AppKit tabviewitem iconSource host object must contain an NSImage')
		}

		return image
	}

	if (source.startsWith('sys://')) {
		return NSImage.imageWithSystemSymbolNameAccessibilityDescription(source.slice(6), null)
	}

	if (source.startsWith('font://')) {
		const text = NSAttributedString.alloc().initWithStringAttributes(source.slice(7), {
			[NSFontAttributeName]: resolveFont(
				Number(style.fontSize ?? 17),
				style.fontWeight ?? 400,
				style.iconFontFamily ?? style.fontFamily,
			),
			[NSForegroundColorAttributeName]:
				style.color == null ? NSColor.labelColor : resolveIconColor(style.color),
		})

		const size = text.size()
		if (size.width <= 0 || size.height <= 0) {
			return null
		}

		const image = NSImage.alloc().initWithSize(size)
		image.lockFocus()
		try {
			text.drawAtPoint({ x: 0, y: 0 })
		} finally {
			image.unlockFocus()
		}

		return image
	}

	if (source.startsWith('res://')) {
		return NSImage.imageNamed(source.slice(6))
	}

	if (source.startsWith('~/')) {
		return loadImage(NSBundle.mainBundle.resourcePath + '/' + source.slice(2))
	}

	return loadImage(source)
}

// Ownership transfers can detach and attach the same handle in one batch.
// Publish only its final target, avoiding a transient content unmount.
function notifyContentTarget(node: ElementNode) {
	if (typeof node.props.__onContentTarget !== 'function') {
		return
	}

	const generation = (node.tabPortalGeneration = (node.tabPortalGeneration ?? 0) + 1)
	queueMicrotask(() => {
		if (node.tabPortalGeneration !== generation) {
			return
		}

		node.props.__onContentTarget?.(!node.tabDisposed && owners.has(node) ? node.childHost : null)
	})
}

function mountContent(node: ElementNode) {
	if (node.props.__portalContent) {
		notifyContentTarget(node)
		return
	}

	if (!node.tabContentRoot) {
		node.tabContentRoot = createContentRoot(node.childHost!, node.container.fontFamily)
	}

	node.tabContentRoot.render(contentComponent, { content: node.props.__tabContent })
}

// Injected by index.ts to avoid a runtime import cycle through the host driver.
let createContentRoot: (host: AppKitView, fontFamily?: string) => any
let resolveIconColor: (color: any) => any
export function configureTabContentRoots(
	create: typeof createContentRoot,
	color: (value: any) => any,
) {
	createContentRoot = create
	resolveIconColor = color
}

export function syncTabItem(node: ElementNode) {
	if (node.tabDisposed) {
		return
	}

	const item = node.tabNativeItem
	item.label = node.props.title ?? ''
	const style = node.computedStyle ?? node.props.style ?? {}
	const fontInputs =
		typeof node.props.iconSource === 'string' && node.props.iconSource.startsWith('font://')
			? [style.fontSize, style.fontWeight, style.fontFamily, style.iconFontFamily, style.color]
			: []

	if (
		!Object.is(node.tabIconInput, node.props.iconSource) ||
		fontInputs.some((value, index) => !Object.is(value, node.tabIconFontInputs?.[index]))
	) {
		node.tabIconTask?.cancel()
		node.tabIconTask = null
		const generation = (node.tabIconGeneration = (node.tabIconGeneration ?? 0) + 1)
		const source = node.props.iconSource
		if (typeof source === 'string' && /^https?:\/\//i.test(source)) {
			item.image = null
			node.tabIconTask = NSURLSession.sharedSession.dataTaskWithURLCompletionHandler(
				NSURL.URLWithString(source),
				(data: any, _response: any, error: any) => {
					if (node.tabDisposed || node.tabIconGeneration !== generation) {
						return
					}

					item.image = data && !error ? NSImage.alloc().initWithData(data) : null
					const owner = owners.get(node)
					if (owner) {
						owner.view!.needsDisplay = true
					}
				},
			)

			node.tabIconTask.resume()
		} else {
			item.image = iconImage(source, style)
		}

		node.tabIconFontInputs = fontInputs
		node.tabIconInput = source
	}

	const owner = owners.get(node)
	if (owner) {
		owner.view!.needsDisplay = true
		mountContent(node)
	}
}

function notifySelection(node: ElementNode, value: number) {
	const oldIndex = node.tabIndex
	node.tabIndex = value
	if (oldIndex === value || node.tabDisposed) {
		return
	}

	const event = { object: node.view, value, oldIndex, newIndex: value }
	node.props.onSelectedIndexChanged?.({ ...event, eventName: 'selectedIndexChanged' })
	node.props.onSelectedIndexChange?.({ ...event, eventName: 'selectedIndexChange' })
}

/** Detach from the current physical owner, even when the handle arrived via
 * an items array rather than the renderer's parent/children relation. */
export function detachTabItem(item: ElementNode, preserveContent = false) {
	const owner = owners.get(item)
	if (!owner) {
		return
	}

	owner.tabSyncing = true
	try {
		owner.view!.removeTabViewItem(item.tabNativeItem)
	} finally {
		owner.tabSyncing = false
	}

	owner.tabItems = owner.tabItems.filter((candidate: ElementNode) => candidate !== item)
	owners.delete(item)
	if (!preserveContent) {
		item.tabContentRoot?.unmount()
		item.tabContentRoot = null
		notifyContentTarget(item)
	}

	const index = owner.tabItems.length
		? Math.min(Math.max(0, owner.tabRequested), owner.tabItems.length - 1)
		: -1

	if (index >= 0) {
		owner.tabSyncing = true
		try {
			owner.view!.selectTabViewItemAtIndex(index)
		} finally {
			owner.tabSyncing = false
		}
	}

	notifySelection(owner, index)
}

export function flushTabViews(container: any) {
	const dirty = container.tabDirty
	container.tabDirty = undefined
	if (!dirty) {
		return
	}

	const releases = (container.tabReleases = new Set<ElementNode>())
	try {
		for (const node of dirty) {
			syncTabView(node)
		}
	} finally {
		container.tabReleases = undefined
		for (const item of releases) {
			if (!owners.has(item)) {
				item.tabContentRoot?.unmount()
				item.tabContentRoot = null
				notifyContentTarget(item)
			}
		}
	}
}

export function syncTabView(node: ElementNode) {
	if (node.tabDisposed) {
		return
	}

	if (node.container.layoutDirty) {
		;(node.container.tabDirty ??= new Set()).add(node)
		return
	}

	validateTabProps('tabview', node.props)
	const items: ElementNode[] =
		node.props.items != null ? [...node.props.items] : node.children.slice()

	const view = node.view!
	node.tabSyncing = true
	try {
		for (const item of node.tabItems as ElementNode[]) {
			if (!items.includes(item)) {
				view.removeTabViewItem(item.tabNativeItem)
				owners.delete(item)
				if (node.container.tabReleases) {
					node.container.tabReleases.add(item)
				} else {
					item.tabContentRoot?.unmount()
					item.tabContentRoot = null
					notifyContentTarget(item)
				}
			}
		}

		for (const [index, item] of items.entries()) {
			if (owners.get(item) && owners.get(item) !== node) {
				const previous = owners.get(item)!
				detachTabItem(item, true)
				previous.children = previous.children.filter((child) => child !== item)
				if (previous.props.items) {
					previous.props.items = previous.props.items.filter((child: ElementNode) => child !== item)
				}

				if (item.parent === previous) {
					item.parent = null
				}
			}

			// Reordering keeps the native item and its content-root identity.
			if (
				index >= Number(view.numberOfTabViewItems) ||
				view.tabViewItemAtIndex(index) !== item.tabNativeItem
			) {
				if (owners.get(item) === node) {
					view.removeTabViewItem(item.tabNativeItem)
				}

				view.insertTabViewItemAtIndex(item.tabNativeItem, index)
			}

			owners.set(item, node)
			syncTabItem(item)
		}

		node.tabItems = items
		if (!Object.is(node.tabIndexInput, node.props.selectedIndex)) {
			node.tabRequested = node.props.selectedIndex ?? -1
			node.tabIndexInput = node.props.selectedIndex
		}

		const index = items.length ? Math.min(Math.max(0, node.tabRequested), items.length - 1) : -1
		if (index >= 0) {
			view.selectTabViewItemAtIndex(index)
		}

		notifySelection(node, index)
	} finally {
		node.tabSyncing = false
	}
}

export function releaseTabView(node: ElementNode) {
	node.tabDisposed = true
	for (const item of (node.tabItems ?? []).slice()) {
		detachTabItem(item)
	}

	delegates.delete(node.tabDelegate)
	node.view!.delegate = null
	node.tabDelegate = null
}

export function releaseTabItem(node: ElementNode) {
	detachTabItem(node)
	node.tabContentRoot?.unmount()
	node.tabContentRoot = null
	node.tabDisposed = true
	node.tabIconGeneration = (node.tabIconGeneration ?? 0) + 1
	node.tabIconTask?.cancel()
	node.tabIconTask = null
	node.tabIconInput = undefined
	node.tabIconFontInputs = undefined
	node.props.__tabContent = undefined
	node.props.iconSource = undefined
	node.props.title = undefined
	node.tabNativeItem.view = null
	node.tabNativeItem.image = null
	node.childHost?.removeFromSuperview()
	node.childHost = undefined
}
