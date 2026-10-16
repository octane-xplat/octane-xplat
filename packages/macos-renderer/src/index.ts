import '@nativescript/macos-node-api'
import {
	configureGesture,
	setPressGesture,
	disposePressGestures,
	swipeDirection,
	registerGestureClass,
} from './gestures'

import { showWindowLayer, type WindowLayerOptions } from './layer'
import { disposeImage, updateImage } from './image'
import {
	makeTabView,
	makeTabItem,
	syncTabView,
	flushTabViews,
	configureTabContentRoots,
	syncTabItem,
	validateTabProps,
	releaseTabView,
	releaseTabItem,
	detachTabItem,
} from './tab-view'

import { installPresentationBridge } from './presentation'
import { installAppearanceBridge } from './appearance'
import { configureScrollAxes, observeScrollGeometry, scrollAxes } from './scroll-view'
import { makeListView, updateListView, disposeListView } from './list-view'
import { validateListProps } from './list-template'
import { makeWebView, updateWebView, disposeWebView } from './webview'
import { createUniversalRoot } from 'octane/universal/native'
import type {
	UniversalHostCommand,
	UniversalHostDriver,
	UniversalHostParent,
	UniversalPortalTargetHandle,
	UniversalRoot,
} from 'octane/universal/native'

import { composeAttributedText, validateTextStyle } from './formatted-text'
import { parseHtmlText, validateHtmlProps } from './html-text'
import { resolveFont as fontForFamilyStyle } from './fonts'
import {
	NSAttributedString,
	NSAutoresizingMaskOptions,
	NSBackingStoreType,
	NSBezelStyle,
	NSBorderType,
	NSButton,
	NSButtonType,
	NSClickGestureRecognizer,
	NSColor,
	NSColorSpace,
	NSControlSize,
	NSDate,
	NSDatePicker,
	NSDatePickerElementFlags,
	NSDatePickerMode,
	NSDatePickerStyle,
	NSEvent,
	NSFontAttributeName,
	NSForegroundColorAttributeName,
	NSImageView,
	NSLayoutAttribute,
	NSLineBreakMode,
	NSMenu,
	NSMenuItem,
	NSMutableParagraphStyle,
	NSNotification,
	NSNotificationCenter,
	NSNumber,
	NSObject,
	NSPanGestureRecognizer,
	NSParagraphStyleAttributeName,
	NSPopover,
	NSPopoverBehavior,
	NSPopoverDidCloseNotification,
	NSPopUpButton,
	NSProgressIndicator,
	NSProgressIndicatorStyle,
	NSRectEdge,
	NSScrollView,
	NSSearchField,
	NSSecureTextField,
	NSSecureTextFieldCell,
	NSSegmentedControl,
	NSSegmentSwitchTracking,
	NSSlider,
	NSStackView,
	NSStackViewDistribution,
	NSStackViewGravity,
	NSTextAlignment,
	NSTextField,
	NSTextFieldCell,
	NSTextFieldDelegate,
	NSTextView,
	NSTextViewDelegate,
	NSTrackingArea,
	NSTrackingAreaOptions,
	NSUserInterfaceLayoutOrientation,
	NSView,
	NSViewBoundsDidChangeNotification,
	NSViewController,
	NSViewFrameDidChangeNotification,
	NSWindow,
	NSWindowDelegate,
	NSWindowOrderingMode,
	NSWindowStyleMask,
	NativeClass,
	WKWebView,
	interop,
} from '@octane-xplat/platform/macos'

import type { NSClass, NSControl } from '@octane-xplat/platform/macos'

export { registerFontFamily } from './fonts'
export { __tabItemProps } from './tab-view'

configureTabContentRoots((host, fontFamily) => createMacOSRoot(host, { fontFamily }), nativeColor)

/** Props arrive from compiled elements as open-ended bags; each leaf
 *  factory or applier reads only the keys it understands. */
type PropBag = Record<string, any>

/** The payload `onPan` listeners receive from `ButtonActionTarget.viewPanned`. */
interface PanEvent {
	deltaX: number
	deltaY: number
	velocityX: number
	velocityY: number
	state: number
	view: NSView
}

/** The AppKit object a node owns. `view` is null for `#text` and `span`
 *  nodes, whose content folds into the parent's attributed string. Members
 *  beyond NSView resolve loosely — each node-type code path knows the
 *  concrete AppKit class its factory created. */
export type AppKitView = NSView & { [key: string]: any }

/** A retained element in the AppKit tree. */
export interface ElementNode {
	id: number
	type: string
	view: AppKitView | null
	projectedChildren?: ElementNode[]
	layoutParent?: ElementNode | null
	childHost?: AppKitView
	datePickerDefault?: Date
	datePickerValue?: Date
	datePickerInputs?: PropBag
	timePickerDefault?: Date
	timePickerValue?: Date
	timePickerInputs?: PropBag
	timePickerBounds?: [number, number]
	props: PropBag
	parent: ElementNode | null
	children: ElementNode[]
	container: RootContainer
	appliedFontFamily: string | undefined
	actionId?: number
	scrollObserverInstalled: boolean
	text: string
	// Per-kind extras: placeholderView, marginHost, marginConstraints,
	// crossAxisConstraint, sizeConstraints, placementPins, styleBg, bgSlot,
	// layoutObserver, scrollObserver, scheme, textRuns, appliedStyle,
	// styleFont*/classFont*/propFontSize, stylePaddingBox/Edges, classInsets,
	// styleRadius, classRadius, classSpacing, classOrientation, ...
	[key: string]: any
}

/** A `<gridlayout>` child's resolved position after props parsing. */
interface GridPlacement {
	child: ElementNode
	row: number | null
	col: number | null
	rowSpan: number
	colSpan: number
}

/** One `rows`/`columns` token: `auto`, `Npx`/`N`, `N%`, or `Nfr`/`N*`. */
interface GridTrack {
	kind: 'auto' | 'fraction' | 'fixed'
	value: number
}

/** Options published through `__xplatAppKit.showAnchoredPopup` (Tooltip/Hoverable). */
interface PopupOptions {
	anchor?: NSView
	at?: { x: number; y: number }
	component?: any
	placement?: string
	[key: string]: any
}

interface ContextMenuItem {
	id?: string
	title?: string
	disabled?: boolean
	divider?: boolean
}

/** Options published through `__xplatAppKit.attachContextMenu`. */
interface ContextMenuOptions {
	items?: ContextMenuItem[]
	[key: string]: any
}

/** Per-root state shared by the driver commands. */
interface RootContainer {
	hostView: NSView
	fontFamily: string | undefined
	nodes: Map<number, ElementNode>
	children: ElementNode[]
	root: UniversalRoot | null
	portalTargetIds: WeakMap<object, number>
	portalTargets: Map<UniversalPortalTargetHandle, PortalTargetEntry>
	nextPortalTargetId: number
	/** Native root projection for top-level viewless containers. */
	projectionRoot?: ElementNode
	/** Parents needing a sibling-wide layout pass; non-null only while a
	 *  command batch is applying. */
	layoutDirty: Set<ElementNode> | null
	tabDirty?: Set<ElementNode>
	tabReleases?: Set<ElementNode>
}

interface PortalTargetEntry {
	root: ElementNode
	registrations: number
}

const nodeContainersByView = new WeakMap<object, RootContainer>()
const portalHandlesByNode = new WeakMap<ElementNode, UniversalPortalTargetHandle>()

function parentReference(parent: ElementNode | null | undefined): UniversalHostParent {
	if (!parent) {
		return null
	}

	const handle =
		typeof portalHandlesByNode === 'undefined' ? undefined : portalHandlesByNode.get(parent)

	return handle ?? parent.id ?? null
}

function resolveParentNode(
	container: RootContainer,
	parent: UniversalHostParent,
): ElementNode | null {
	if (parent === null) {
		return null
	}

	if (typeof parent === 'number') {
		return container.nodes.get(parent) ?? null
	}

	return container.portalTargets.get(parent)?.root ?? null
}

function canContainView(type: string): boolean {
	return VIEW_PARENT_TYPES.has(type) || type === 'portalroot'
}

function isPortalTargetView(target: unknown): target is NSView {
	if (target === null || typeof target !== 'object') {
		return false
	}

	const view = target as NSView
	return (
		typeof view.addSubview === 'function' &&
		typeof view.leadingAnchor?.constraintEqualToAnchor === 'function' &&
		typeof view.trailingAnchor?.constraintEqualToAnchor === 'function' &&
		typeof view.topAnchor?.constraintEqualToAnchor === 'function' &&
		typeof view.bottomAnchor?.constraintEqualToAnchor === 'function'
	)
}

const actionHandlers = new Map<number, (() => void) | null>()
const actionIdsByView = new WeakMap<object, number>()
const textNodesByView = new WeakMap<object, ElementNode>()
const panHandlersByView = new WeakMap<object, ((event: PanEvent) => void) | null>()
const gridLayoutNodesByView = new WeakMap<object, ElementNode>()
const absoluteLayoutNodesByView = new WeakMap<object, ElementNode>()
const rootLayoutNodesByView = new WeakMap<object, ElementNode>()
const wrapLayoutNodesByView = new WeakMap<object, ElementNode>()
const dockLayoutNodesByView = new WeakMap<object, ElementNode>()
const contentViewNodesByView = new WeakMap<object, ElementNode>()
const accessibilityLabels = new Map<number, string>()
const accessibilityRoles = new Map<number, string>()
const stackAccessibilityPropsByView = new WeakMap<object, PropBag>()
const scrollHandlers = new WeakMap<object, () => void>()
let nextActionId = 1
const DEFAULT_TEXT_LINE_HEIGHT_RATIO = 21 / 16

function invokeAction(actionId: number | undefined) {
	const action = actionId === undefined ? undefined : actionHandlers.get(actionId)
	if (action) {
		action()
	}
}

class ButtonActionTarget extends NSObject {
	static ObjCProtocols = [NSTextViewDelegate, NSTextFieldDelegate]

	static ObjCExposedMethods = {
		buttonPressed: { params: [NSButton], returns: interop.types.void },
		'viewPressed:': { params: [NSObject], returns: interop.types.void },
		'viewPanned:': { params: [NSPanGestureRecognizer], returns: interop.types.void },
		controlChanged: { params: [NSObject], returns: interop.types.void },
		controlTextDidChange: { params: [NSNotification], returns: interop.types.void },
		textFieldSubmitted: { params: [NSObject], returns: interop.types.void },
		textDidChange: { params: [NSNotification], returns: interop.types.void },
		controlTextDidBeginEditing: { params: [NSNotification], returns: interop.types.void },
		controlTextDidEndEditing: { params: [NSNotification], returns: interop.types.void },
		textDidBeginEditing: { params: [NSNotification], returns: interop.types.void },
		textDidEndEditing: { params: [NSNotification], returns: interop.types.void },
	}

	static {
		registerGestureClass(this)
	}

	buttonPressed(sender: NSButton) {
		invokeAction(sender.tag)
	}

	['viewPressed:'](sender: NSClickGestureRecognizer) {
		invokeAction(actionIdsByView.get(sender.view))
	}

	controlChanged(sender: NSControl) {
		invokeAction(sender.tag ?? actionIdsByView.get(sender))
	}

	// NSControlTextEditingDelegate: fires on every edit while a single-line
	// field is being edited — the per-edit source for onTextChange.
	controlTextDidChange(notification: NSNotification) {
		const node = textNodesByView.get(notification.object)
		if (node?.type === 'searchbar') {
			notifySearchTextChange(node)
		} else {
			invokeAction(node?.actionId ?? actionIdsByView.get(notification.object))
		}
	}

	// Single-line fields keep target/action for submission (Return). The
	// change handler lives on controlTextDidChange, so the action never
	// masquerades as a value-change event.
	textFieldSubmitted(sender: NSObject) {
		textNodesByView.get(sender)?.submitHandler?.()
	}

	['viewPanned:'](sender: NSPanGestureRecognizer) {
		this.viewPanned(sender)
	}

	viewPanned(sender: NSPanGestureRecognizer) {
		const handler = panHandlersByView.get(sender.view)
		if (!handler) {
			return
		}

		const translation = sender.translationInView(sender.view)
		const velocity = sender.velocityInView(sender.view)
		const flipped =
			typeof sender.view.isFlipped === 'function' ? sender.view.isFlipped() : sender.view.isFlipped

		const signY = flipped ? 1 : -1
		const nativeState = Number(sender.state)
		const state = nativeState === 1 ? 1 : nativeState === 2 ? 2 : nativeState === 3 ? 3 : 0
		try {
			handler({
				deltaX: Number(translation.x ?? 0),
				deltaY: Number(translation.y ?? 0) * signY,
				velocityX: Number(velocity.x ?? 0),
				velocityY: Number(velocity.y ?? 0) * signY,
				state,
				view: sender.view,
			})
		} catch (error) {
			console.error('[macos-event] pan handler failed', error)
		}
	}

	textDidChange(notification: NSNotification) {
		const node = textNodesByView.get(notification.object)
		syncTextViewPlaceholder(node)
		fitTextView(node)
		invokeAction(actionIdsByView.get(notification.object))
	}
	controlTextDidBeginEditing(notification: NSNotification) {
		dispatchTextEvent(textNodesByView.get(notification.object), 'onFocus')
	}

	controlTextDidEndEditing(notification: NSNotification) {
		dispatchTextEvent(textNodesByView.get(notification.object), 'onBlur')
	}

	textDidBeginEditing(notification: NSNotification) {
		this.controlTextDidBeginEditing(notification)
	}

	textDidEndEditing(notification: NSNotification) {
		this.controlTextDidEndEditing(notification)
	}

	// NSSearchField's search action also fires for its cancel button. Consume
	// Return in the field-editor delegate so clearing cannot emit submit.
	controlTextViewDoCommandBySelector(control: NSControl, _editor: NSTextView, selector: string) {
		const node = textNodesByView.get(control)
		if (node?.type !== 'searchbar' || String(selector) !== 'insertNewline:') {
			return false
		}

		node.submitHandler?.()
		return true
	}

	textViewDoCommandBySelector(view: NSTextView, selector: string) {
		const node = textNodesByView.get(view)
		if (
			String(selector) !== 'insertNewline:' ||
			!node ||
			!['done', 'send'].includes(node.props.returnKeyType)
		) {
			return false
		}

		dispatchTextEvent(node, 'onSubmit')
		return true
	}
}

const buttonActionTarget = ButtonActionTarget.new()

class ContentAlignedTextField extends NSSecureTextField {
	static {
		NativeClass(this)
	}

	becomeFirstResponder() {
		const accepted = super.becomeFirstResponder()
		if (accepted) {
			dispatchTextEvent(textNodesByView.get(this), 'onFocus')
		}

		return accepted
	}

	textDidEndEditing(notification: NSNotification) {
		super.textDidEndEditing(notification)
		dispatchTextEvent(textNodesByView.get(this), 'onBlur')
	}

	// These controls have no bezel or background, so the text area and layout
	// frame should share the same edges.
	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	alignmentRectInsets() {
		return { top: 0, left: 0, bottom: 0, right: 0 }
	}
}

class InteractionTextView extends NSTextView {
	static {
		NativeClass(this)
	}
	becomeFirstResponder() {
		const accepted = super.becomeFirstResponder()
		if (accepted) {
			dispatchTextEvent(textNodesByView.get(this), 'onFocus')
		}

		return accepted
	}
	resignFirstResponder() {
		const accepted = super.resignFirstResponder()
		if (accepted) {
			dispatchTextEvent(textNodesByView.get(this), 'onBlur')
		}

		return accepted
	}
}

class InteractionTextFieldCell extends NSTextFieldCell {
	static {
		NativeClass(this)
	}
	endEditing(editor: NSTextView) {
		const node = textNodesByView.get(editor.delegate)
		super.endEditing(editor)
		dispatchTextEvent(node, 'onBlur')
	}
}

class InteractionSecureTextFieldCell extends NSSecureTextFieldCell {
	static {
		NativeClass(this)
	}
	endEditing(editor: NSTextView) {
		const node = textNodesByView.get(editor.delegate)
		super.endEditing(editor)
		dispatchTextEvent(node, 'onBlur')
	}
}

const inputTransparentViews = new WeakSet<object>()

class AccessibleStackView extends NSStackView {
	// Self-drawn AppKit buttons need a responder so modal decisions can use
	// the keyboard as well as accessibility actions.
	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	acceptsFirstResponder() {
		return typeof actionHandlers.get(actionIdsByView.get(this) ?? -1) === 'function'
	}

	keyDown(event: any) {
		if (
			(Number(event.keyCode) === 36 || Number(event.keyCode) === 49) &&
			this.acceptsFirstResponder()
		) {
			invokeAction(actionIdsByView.get(this)!)
			return
		}

		super.keyDown(event)
	}

	hitTest(point: any): any {
		return inputTransparentViews.has(this) ? null : super.hitTest(point)
	}

	static ObjCExposedMethods = {
		accessibilityPerformPress: { params: [], returns: interop.types.bool },
		accessibilityRole: { params: [], returns: interop.types.id },
		accessibilityLabel: { params: [], returns: interop.types.id },
		accessibilityValue: { params: [], returns: interop.types.id },
		accessibilityMinValue: { params: [], returns: interop.types.id },
		accessibilityMaxValue: { params: [], returns: interop.types.id },
		accessibilityValueDescription: { params: [], returns: interop.types.id },
		accessibilityHelp: { params: [], returns: interop.types.id },
		accessibilityIsEnabled: { params: [], returns: interop.types.bool },
		accessibilityIsIgnored: { params: [], returns: interop.types.bool },
	}

	static {
		NativeClass(this)
	}

	accessibilityPerformPress() {
		const actionId = actionIdsByView.get(this)
		if (
			actionId === undefined ||
			typeof actionHandlers.get(actionId) !== 'function' ||
			!this.accessibilityIsEnabled()
		) {
			return false
		}

		invokeAction(actionId)
		return true
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	accessibilityRole() {
		const role = accessibilityRoles.get(actionIdsByView.get(this) ?? -1)
		// ARIA 'meter' is AppKit's level indicator — a gauge of a scalar within
		// a range, distinct from task progress (AXProgressIndicator).
		return role === 'checkbox'
			? 'AXCheckBox'
			: role === 'button'
				? 'AXButton'
				: role === 'meter'
					? 'AXLevelIndicator'
					: role === 'progressbar'
						? 'AXProgressIndicator'
						: 'AXGroup'
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	accessibilityLabel() {
		return accessibilityLabels.get(actionIdsByView.get(this) ?? -1) ?? ''
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	accessibilityValue() {
		const props = stackAccessibilityPropsByView.get(this)
		const role = this.accessibilityRole()
		if (role === 'AXCheckBox') {
			// AppKit uses 0/1/2 for off/on/mixed checkbox values.
			return NSNumber.numberWithDouble(
				props?.accessibilityState?.checked === 'mixed'
					? 2
					: props?.accessibilityState?.checked === true
						? 1
						: 0,
			)
		}

		if (role === 'AXLevelIndicator' || role === 'AXProgressIndicator') {
			return NSNumber.numberWithDouble(Number(props?.accessibilityValue ?? 0))
		}

		return props?.accessibilityValue ?? ''
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	accessibilityMinValue() {
		return NSNumber.numberWithDouble(
			Number(stackAccessibilityPropsByView.get(this)?.accessibilityMinValue ?? 0),
		)
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	accessibilityMaxValue() {
		return NSNumber.numberWithDouble(
			Number(stackAccessibilityPropsByView.get(this)?.accessibilityMaxValue ?? 100),
		)
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	accessibilityValueDescription() {
		return String(stackAccessibilityPropsByView.get(this)?.accessibilityValueDescription ?? '')
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	accessibilityHelp() {
		return stackAccessibilityPropsByView.get(this)?.accessibilityHint ?? ''
	}

	accessibilityIsEnabled() {
		return !stackAccessibilityPropsByView.get(this)?.accessibilityState?.disabled
	}

	accessibilityIsIgnored() {
		return !accessibilityRoles.has(actionIdsByView.get(this) ?? -1)
	}
}

// The macOS Slider uses the grid host as an overlay when no tracks are set.
class GridLayoutView extends NSView {
	static ObjCExposedMethods = {
		accessibilityRole: { params: [], returns: interop.types.id },
		accessibilityLabel: { params: [], returns: interop.types.id },
		accessibilityValue: { params: [], returns: interop.types.id },
		accessibilityMinValue: { params: [], returns: interop.types.id },
		accessibilityMaxValue: { params: [], returns: interop.types.id },
		accessibilityValueDescription: { params: [], returns: interop.types.id },
		accessibilityIsIgnored: { params: [], returns: interop.types.bool },
		accessibilityIsEnabled: { params: [], returns: interop.types.bool },
		accessibilityPerformIncrement: { params: [], returns: interop.types.bool },
		accessibilityPerformDecrement: { params: [], returns: interop.types.bool },
	}

	static {
		NativeClass(this)
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	accessibilityRole() {
		const node = gridLayoutNodesByView.get(this)
		const role = node?.props.accessibilityRole
		return role === 'adjustable'
			? 'AXSlider'
			: role === 'meter'
				? 'AXLevelIndicator'
				: role === 'progressbar'
					? 'AXProgressIndicator'
					: 'AXGroup'
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	accessibilityLabel() {
		return gridLayoutNodesByView.get(this)?.props.accessibilityLabel ?? ''
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	accessibilityValue() {
		return NSNumber.numberWithDouble(
			Number(gridLayoutNodesByView.get(this)?.props.accessibilityValue ?? 0),
		)
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	accessibilityMinValue() {
		return NSNumber.numberWithDouble(
			Number(gridLayoutNodesByView.get(this)?.props.accessibilityMinValue ?? 0),
		)
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	accessibilityMaxValue() {
		return NSNumber.numberWithDouble(
			Number(gridLayoutNodesByView.get(this)?.props.accessibilityMaxValue ?? 100),
		)
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	accessibilityValueDescription() {
		return String(gridLayoutNodesByView.get(this)?.props.accessibilityValueDescription ?? '')
	}

	accessibilityIsIgnored() {
		return !gridLayoutNodesByView.get(this)?.props.accessibilityRole
	}

	accessibilityIsEnabled() {
		return gridLayoutNodesByView.get(this)?.props.disabled !== true
	}

	accessibilityPerformIncrement() {
		return performGridAccessibilityAdjustment(this, 'onAccessibilityIncrement')
	}

	accessibilityPerformDecrement() {
		return performGridAccessibilityAdjustment(this, 'onAccessibilityDecrement')
	}

	layout() {
		super.layout()
		layoutGridChildren(gridLayoutNodesByView.get(this))
	}
}

// Absolute's host — children position via their own left/top/right/bottom
// layout-child props; the layout() pass updates parent-anchored constraints.
class AbsoluteLayoutView extends NSView {
	static {
		NativeClass(this)
	}

	layout() {
		super.layout()
		layoutAbsoluteChildren(absoluteLayoutNodesByView.get(this))
	}
}

// A single native slot, with renderer children retained separately so removing
// a superseded child cannot clear its replacement (NativeScript ContentView).
class ContentViewHost extends NSView {
	static {
		NativeClass(this)
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	get intrinsicContentSize() {
		const node = contentViewNodesByView.get(this)
		const child = node?.projectedChildren ? node.projectedChildren[0] : node?.contentChild
		if (!child?.view) {
			return { width: 0, height: 0 }
		}

		const intrinsic = layoutView(child).intrinsicContentSize
		const fitting = layoutView(child).fittingSize
		const size = (axis: 'width' | 'height') =>
			Math.max(
				0,
				Number(
					child.props.style?.[axis] ??
						(Number(intrinsic?.[axis]) >= 0 ? intrinsic?.[axis] : fitting?.[axis]) ??
						0,
				) || 0,
			)

		return { width: size('width'), height: size('height') }
	}

	layout() {
		super.layout()
		layoutContentChild(contentViewNodesByView.get(this))
	}
}

// Mirrors NativeScript 9.1.2 (MIT): ui/layouts/dock-layout/index.ios.ts
// and ViewHelper's measurement/alignment rules. Ordered strips need NSView,
// not NSStackView's single layout axis.
class DockLayoutView extends NSView {
	static {
		NativeClass(this)
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	get intrinsicContentSize() {
		return dockNaturalSize(dockLayoutNodesByView.get(this))
	}

	layout() {
		super.layout()
		layoutDockChildren(dockLayoutNodesByView.get(this))
	}
}

function makeDockLayout(node: ElementNode) {
	const view = DockLayoutView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 0, height: 0 },
	})

	view.translatesAutoresizingMaskIntoConstraints = false
	dockLayoutNodesByView.set(view, node)
	view.postsFrameChangedNotifications = true
	node.dockGeometryObserver =
		NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
			NSViewFrameDidChangeNotification,
			view,
			null,
			() => {
				if (dockLayoutNodesByView.get(view) === node) {
					queueLayoutReconcile(node.container, node)
				}
			},
		)

	return view
}

// NativeScript 9.1.2 (MIT), RootLayoutBase extends GridLayout. The shared
// rootlayout contract exposes no rows/columns: its implicit single cell
// overlaps all children, including nonzero attached indices clamped to it.
// Window-owned presentation remains in presentation.ts, outside this tree.
class RootLayoutView extends NSView {
	static {
		NativeClass(this)
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	get intrinsicContentSize() {
		return rootNaturalSize(rootLayoutNodesByView.get(this))
	}

	layout() {
		super.layout()
		layoutRootChildren(rootLayoutNodesByView.get(this))
	}
}

function makeRootLayout(node: ElementNode) {
	const view = RootLayoutView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 0, height: 0 },
	})

	view.translatesAutoresizingMaskIntoConstraints = false
	rootLayoutNodesByView.set(view, node)
	view.postsFrameChangedNotifications = true
	node.rootGeometryObserver =
		NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
			NSViewFrameDidChangeNotification,
			view,
			null,
			() => {
				if (rootLayoutNodesByView.get(view) === node) {
					queueLayoutReconcile(node.container, node)
				}
			},
		)

	return view
}

class WrapLayoutView extends NSView {
	static {
		NativeClass(this)
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	get intrinsicContentSize() {
		return wrapNaturalSize(wrapLayoutNodesByView.get(this))
	}

	layout() {
		super.layout()
		layoutWrapChildren(wrapLayoutNodesByView.get(this))
	}
}

// Wrapping must be allowed to shrink on its flow axis. A 750-point
// intrinsic compression priority outranks WindowSizeStayPut (500) and forces
// the window back to the old row/column length before any reflow can occur.
function setWrapSizingPriorities(node: ElementNode, view = node.view) {
	if (!view) {
		return
	}

	const vertical = node.props.orientation === 'vertical'
	view.setContentCompressionResistancePriorityForOrientation(
		vertical ? 750 : 250,
		NSUserInterfaceLayoutOrientation.Horizontal,
	)

	view.setContentCompressionResistancePriorityForOrientation(
		vertical ? 250 : 750,
		NSUserInterfaceLayoutOrientation.Vertical,
	)
}

function makeWrapLayout(node: ElementNode) {
	const view = WrapLayoutView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 0, height: 0 },
	})

	view.translatesAutoresizingMaskIntoConstraints = false
	wrapLayoutNodesByView.set(view, node)
	setWrapSizingPriorities(node, view)
	view.postsFrameChangedNotifications = true
	node.wrapGeometryObserver =
		NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
			NSViewFrameDidChangeNotification,
			view,
			null,
			() => {
				if (wrapLayoutNodesByView.get(view) === node) {
					queueLayoutReconcile(node.container, node)
				}
			},
		)

	return view
}

function makeContentView() {
	const view = ContentViewHost.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 0, height: 0 },
	})

	view.translatesAutoresizingMaskIntoConstraints = false
	return view
}

function observeContentGeometry(node: ElementNode) {
	const view = node.view!
	view.postsFrameChangedNotifications = true
	// Auto Layout can resize an NSView after its layout() callback. Observe
	// the resulting frame, so right/bottom alignment and stretch use the
	// new bounds even when AppKit does not schedule another layout pass.
	node.contentGeometryObserver =
		NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
			NSViewFrameDidChangeNotification,
			view,
			null,
			() => {
				if (contentViewNodesByView.get(view) === node) {
					queueLayoutReconcile(node.container, node)
				}
			},
		)
}

function makeStack(props: PropBag, StackClass: NSClass<NSStackView> = NSStackView) {
	const stack = StackClass.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 480, height: 320 },
	})

	stack.orientation =
		props.flexDirection === 'row'
			? NSUserInterfaceLayoutOrientation.Horizontal
			: NSUserInterfaceLayoutOrientation.Vertical

	stack.alignment = stackAlignmentAttribute(stack, props.alignItems ?? 'stretch')
	stack.distribution = NSStackViewDistribution.GravityAreas
	stack.spacing = Number(props.gap ?? props.spacing ?? 0)
	stack.translatesAutoresizingMaskIntoConstraints = false
	return stack
}

function stackAlignmentAttribute(view: any, value: string) {
	const horizontal = view.orientation === NSUserInterfaceLayoutOrientation.Horizontal
	if (value === 'center') {
		return horizontal ? NSLayoutAttribute.CenterY : NSLayoutAttribute.CenterX
	}

	if (value === 'end' || value === 'flex-end') {
		return horizontal ? NSLayoutAttribute.Bottom : NSLayoutAttribute.Right
	}

	if (value === 'stretch' || value === 'start' || value === 'flex-start' || value === 'normal') {
		return horizontal ? NSLayoutAttribute.Top : NSLayoutAttribute.Left
	}

	if (value === 'baseline' && horizontal) {
		return NSLayoutAttribute.FirstBaseline
	}

	return horizontal ? NSLayoutAttribute.Top : NSLayoutAttribute.Left
}

// Container layout follows the same source order as fonts and padding. Resolve
// whole channels so an axis-specific gap never overrides a higher-source gap.
function syncStackLayout(node: ElementNode) {
	if (!['flexboxlayout', 'stack', 'stacklayout'].includes(node.type)) {
		return
	}

	const stack = node.view! as NSStackView
	const style = node.styleLayout ?? {}
	const previousOrientation = stack.orientation
	stack.orientation =
		node.type === 'stacklayout'
			? node.props.orientation === 'horizontal'
				? NSUserInterfaceLayoutOrientation.Horizontal
				: NSUserInterfaceLayoutOrientation.Vertical
			: style.flexDirection != null
				? style.flexDirection === 'row'
					? NSUserInterfaceLayoutOrientation.Horizontal
					: NSUserInterfaceLayoutOrientation.Vertical
				: (node.classOrientation ??
					(node.props.flexDirection === 'row'
						? NSUserInterfaceLayoutOrientation.Horizontal
						: NSUserInterfaceLayoutOrientation.Vertical))

	const gapKey =
		stack.orientation === NSUserInterfaceLayoutOrientation.Horizontal ? 'columnGap' : 'rowGap'

	stack.spacing = Number(
		style[gapKey] ??
			style.gap ??
			node.classSpacing ??
			node.props[gapKey] ??
			node.props.gap ??
			node.props.spacing ??
			0,
	)

	// StackLayout permits different cross-axis alignment for each child.
	// Disable AppKit's global alignment pins; explicit per-child pins below
	// keep the layout determined without fighting a required leading pin.
	stack.alignment =
		node.type === 'stacklayout'
			? (NSLayoutAttribute.NotAnAttribute ?? 0)
			: stackAlignmentAttribute(stack, stackAlignItems(node))

	const justifyContent = stackJustifyContent(node)
	if (stack.orientation !== previousOrientation || justifyContent !== node.appliedStackJustify) {
		moveStackChildren(node)
	}

	node.appliedStackJustify = justifyContent
	if (node.type === 'stacklayout') {
		for (const child of node.projectedChildren ?? node.children) {
			setStackChildPriorities(node, child)
		}
	}

	updateStackDistribution(node)
	updateCrossAxisConstraints(node)
}

function isStackLayoutInput(name: string) {
	return ['flexDirection', 'gap', 'rowGap', 'columnGap', 'alignItems', 'justifyContent'].includes(
		name,
	)
}

function stackAlignItems(node: ElementNode) {
	if (node.styleLayout?.alignItems != null) {
		return node.styleLayout.alignItems
	}

	const classes = nodeClasses(node)
	if (classes.includes('vx-button') || classes.includes('items-center')) {
		return 'center'
	}

	if (classes.includes('items-stretch')) {
		return 'stretch'
	}

	if (classes.includes('items-baseline')) {
		return 'baseline'
	}

	if (classes.includes('items-start')) {
		return 'start'
	}

	if (classes.includes('items-end')) {
		return 'end'
	}

	return node.props.alignItems ?? 'stretch'
}

function stackJustifyContent(node: ElementNode) {
	if (node.type === 'stacklayout') {
		const alignment =
			node.props.orientation === 'horizontal'
				? node.props.horizontalAlignment
				: node.props.verticalAlignment

		return alignment === 'center' || alignment === 'middle'
			? 'center'
			: alignment === 'right' || alignment === 'bottom'
				? 'end'
				: 'start'
	}

	if (node.styleLayout?.justifyContent != null) {
		return node.styleLayout.justifyContent
	}

	const classes = nodeClasses(node)
	if (classes.includes('justify-center')) {
		return 'center'
	}

	if (classes.includes('justify-end')) {
		return 'end'
	}

	if (classes.includes('justify-start')) {
		return 'start'
	}

	if (nodeClasses(node).includes('vx-button')) {
		return 'center'
	}

	if (nodeClasses(node).includes('justify-between')) {
		return 'space-between'
	}

	return node.props.justifyContent ?? 'start'
}

function updateCrossAxisConstraints(parent: ElementNode) {
	const stack = (parent.childHost ?? parent.view) as NSStackView | undefined
	if (!stack || stack.orientation == null) {
		return
	}

	const horizontal = stack.orientation === NSUserInterfaceLayoutOrientation.Horizontal
	const dimension = horizontal ? 'height' : 'width'
	const alignItems = stackAlignItems(parent)
	const bothScrollAxes =
		parent.type === 'scrollview' &&
		scrollAxes(parent.props).inline &&
		scrollAxes(parent.props).block

	// Stretch must respect edgeInsets — an unconstrained child would
	// otherwise span the stack's full cross size, overflowing the padding.
	const insets = stack.edgeInsets ?? { top: 0, left: 0, bottom: 0, right: 0 }
	const inset = horizontal ? insets.top + insets.bottom : insets.left + insets.right
	for (const child of parent.projectedChildren ?? parent.children) {
		if (child.crossAxisConstraint) {
			child.crossAxisConstraint.active = false
		}

		child.crossAxisConstraint = null
		const childView = arrangedView(child)
		let childAlignment =
			parent.type === 'stacklayout'
				? (child.props[horizontal ? 'verticalAlignment' : 'horizontalAlignment'] ?? 'stretch')
				: alignItems

		if (
			parent.type === 'stacklayout' &&
			childAlignment === 'stretch' &&
			child.sizeConstraintSpecs?.[dimension]
		) {
			childAlignment = horizontal ? 'middle' : 'center'
		}

		if (childView && parent.type === 'stacklayout' && childAlignment !== 'stretch') {
			const centered = childAlignment === 'center' || childAlignment === 'middle'
			const trailing = childAlignment === 'right' || childAlignment === 'bottom'
			const anchor = horizontal
				? centered
					? 'centerYAnchor'
					: trailing
						? 'bottomAnchor'
						: 'topAnchor'
				: centered
					? 'centerXAnchor'
					: trailing
						? 'trailingAnchor'
						: 'leadingAnchor'

			const constant = centered
				? horizontal
					? (insets.bottom - insets.top) / 2
					: (insets.left - insets.right) / 2
				: trailing
					? -(horizontal ? insets.bottom : insets.right)
					: horizontal
						? insets.top
						: insets.left

			child.crossAxisConstraint = childView[anchor].constraintEqualToAnchorConstant(
				stack[anchor],
				constant,
			)

			child.crossAxisConstraint.active = true
			continue
		}

		if (
			bothScrollAxes ||
			childAlignment !== 'stretch' ||
			!childView ||
			child.sizeConstraintSpecs?.[dimension]
		) {
			continue
		}

		const anchor = horizontal ? 'heightAnchor' : 'widthAnchor'
		child.crossAxisConstraint = inset
			? childView[anchor].constraintEqualToAnchorConstant(stack[anchor], -inset)
			: childView[anchor].constraintEqualToAnchor(stack[anchor])

		child.crossAxisConstraint.active = true
	}
}

const MARGIN_SIDES: Record<string, string> = {
	marginTop: 'top',
	marginRight: 'right',
	marginBottom: 'bottom',
	marginLeft: 'left',
}

function marginInsetsOf(node: ElementNode) {
	const insets = node.marginInsets
	return insets && (insets.top || insets.right || insets.bottom || insets.left) ? insets : null
}

function layoutView(node: ElementNode) {
	return node.textViewport ?? node.view
}

/** The view a stack should arrange for a child — a margin wrapper when set. */
function arrangedView(node: ElementNode) {
	return node.marginHost ?? layoutView(node)
}

/** NSStackView has no per-child margins, so a margined child is wrapped in a
 *  plain container: the wrapper is the arranged subview and the child pins
 *  inside it with margin-offset anchors. */
function makeMarginHost(node: ElementNode) {
	const host = NSView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 0, height: 0 },
	})

	host.translatesAutoresizingMaskIntoConstraints = false
	host.addSubview(layoutView(node))
	const insets = marginInsetsOf(node)
	const constraints = [
		layoutView(node).leadingAnchor.constraintEqualToAnchorConstant(host.leadingAnchor, insets.left),
		layoutView(node).trailingAnchor.constraintEqualToAnchorConstant(
			host.trailingAnchor,
			-insets.right,
		),
		layoutView(node).topAnchor.constraintEqualToAnchorConstant(host.topAnchor, insets.top),
		layoutView(node).bottomAnchor.constraintEqualToAnchorConstant(
			host.bottomAnchor,
			-insets.bottom,
		),
	]

	for (const constraint of constraints) {
		constraint.active = true
	}

	node.marginHost = host
	node.marginConstraints = constraints
	return host
}

/** Wrap/unwrap/re-apply margins on a node that is already arranged inside a
 *  stack. Margins set before insert are materialized there instead. */
function syncMarginHost(node: ElementNode) {
	const parent = node.layoutParent ?? node.parent
	if (!node.view || !parent) {
		return
	}

	const stack = (parent.childHost ?? parent.view) as NSStackView | undefined
	if (typeof stack?.addViewInGravity !== 'function') {
		// Grid children are laid out manually and already honor margins.
		if (
			marginInsetsOf(node) &&
			!['gridlayout', 'contentview', 'docklayout', 'wraplayout', 'rootlayout'].includes(parent.type)
		) {
			console.warn('[macos-style] ignored margins on <' + node.type + '> — parent is not a stack')
		}

		return
	}

	const insets = marginInsetsOf(node)
	if (insets && !node.marginHost) {
		const gravity = stackGravity(parent, node)
		const index = gravityInsertIndex(parent, node, gravity)
		stack.removeArrangedSubview(layoutView(node))
		layoutView(node).removeFromSuperview()
		const host = makeMarginHost(node)
		stack.insertViewAtIndexInGravity(host, index, gravity)
		queueLayoutReconcile(node.container, parent)
		setLayoutAction(node, node.props?.onLayoutChanged)
	} else if (node.marginHost) {
		// Once wrapped, the host stays arranged for the node's lifetime —
		// unwrapping would detach a first-responder ancestor and end live
		// editing. Zeroed constants collapse it to the child's frame.
		const [leading, trailing, top, bottom] = node.marginConstraints
		leading.constant = insets?.left ?? 0
		trailing.constant = 0 - (insets?.right ?? 0)
		top.constant = insets?.top ?? 0
		bottom.constant = 0 - (insets?.bottom ?? 0)
	}
}

function setMarginStyle(node: ElementNode, name: string, value: any) {
	const points = Number(value)
	if (!Number.isFinite(points)) {
		console.warn(
			'[macos-style] ignored unsupported style.' + name + ' value ' + JSON.stringify(value),
		)

		return
	}

	const insets: Record<string, number> = (node.marginInsets ??= {
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	})

	if (name === 'margin') {
		insets.top = insets.right = insets.bottom = insets.left = points
	} else {
		insets[MARGIN_SIDES[name]] = points
	}

	if (
		['gridlayout', 'contentview', 'docklayout', 'wraplayout', 'rootlayout'].includes(
			(node.layoutParent ?? node.parent)?.type ?? '',
		)
	) {
		// These parents lay out children manually from props.style — no wrapper needed.
		queueLayoutReconcile(node.container, node.parent)
		return
	}

	syncMarginHost(node)
}

function stackGravity(parent: ElementNode, child: ElementNode) {
	const stack = (parent.childHost ?? parent.view) as NSStackView | undefined
	const horizontal = stack!.orientation === NSUserInterfaceLayoutOrientation.Horizontal
	const leading = horizontal ? NSStackViewGravity.Leading : NSStackViewGravity.Top
	const trailing = horizontal ? NSStackViewGravity.Trailing : NSStackViewGravity.Bottom
	const justifyContent = stackJustifyContent(parent)
	if (justifyContent === 'center') {
		return NSStackViewGravity.Center
	}

	if (justifyContent === 'end' || justifyContent === 'flex-end') {
		return trailing
	}

	if (justifyContent === 'space-between') {
		const index = (parent.projectedChildren ?? parent.children).indexOf(child)
		if (index === 0) {
			return leading
		}

		if (index === (parent.projectedChildren ?? parent.children).length - 1) {
			return trailing
		}

		return NSStackViewGravity.Center
	}

	return leading
}

/** AppKit insertion indices are local to a gravity area — count the
 *  same-gravity siblings ahead of `node`, not its logical child index.
 *  Shared by stack insertion and margin-host reinsertion. */
function gravityInsertIndex(parent: ElementNode, node: ElementNode, gravity: number) {
	let index = 0
	for (const sibling of parent.projectedChildren ?? parent.children) {
		if (sibling === node) {
			break
		}

		if (sibling.view && stackGravity(parent, sibling) === gravity) {
			index++
		}
	}

	return index
}

/** Snapshot one gravity area's arranged views. The bridge returns an
 *  NSArray; `count` may be a method or a property depending on interop. */
function stackViewsInGravity(stack: any, gravity: number) {
	const views = typeof stack?.viewsInGravity === 'function' ? stack.viewsInGravity(gravity) : null
	const count = typeof views?.count === 'function' ? views.count() : (views?.count ?? 0)
	const arrangedViews: any[] = []
	for (let index = 0; index < count; index++) {
		arrangedViews.push(views.objectAtIndex(index))
	}

	return arrangedViews
}

/** Reconcile one gravity area with the children's desired views. Only
 *  re-parented children land in `moved` — detaching a view that is (or
 *  contains) the first responder ends the active editing session. */
function syncStackGravityArea(
	parent: ElementNode,
	stack: any,
	gravity: number,
	moved: Set<ElementNode>,
) {
	const desired: ElementNode[] = []
	for (const child of parent.projectedChildren ?? parent.children) {
		if (child.view && stackGravity(parent, child) === gravity) {
			desired.push(child)
		}
	}

	const keep = new Set(desired.map((child) => arrangedView(child)))
	const arrangedViews = stackViewsInGravity(stack, gravity)
	for (let index = arrangedViews.length - 1; index >= 0; index--) {
		if (!keep.has(arrangedViews[index])) {
			stack.removeArrangedSubview(arrangedViews[index])
			arrangedViews[index].removeFromSuperview()
			arrangedViews.splice(index, 1)
		}
	}

	for (let index = 0; index < desired.length; index++) {
		const child = desired[index]
		const view = arrangedView(child)
		if (arrangedViews[index] === view) {
			continue
		}

		const from = arrangedViews.indexOf(view)
		if (from >= 0) {
			stack.removeArrangedSubview(view)
			view.removeFromSuperview()
			arrangedViews.splice(from, 1)
		}

		stack.insertViewAtIndexInGravity(view, index, gravity)
		arrangedViews.splice(index, 0, view)
		moved.add(child)
	}
}

function moveStackChildren(parent: ElementNode) {
	const stack = (parent.childHost ?? parent.view) as NSStackView | undefined
	if (typeof stack?.addViewInGravity !== 'function') {
		return
	}

	// Diff each gravity area against the live arrangement so unchanged
	// children are never re-parented — AppKit's endEditingFor: fires when a
	// first-responder ancestor leaves its superview. Orientation flips keep
	// identical gravity values (Leading == Top, Trailing == Bottom), so a
	// pure orientation change is a no-op here.
	const moved = new Set<ElementNode>()
	for (const gravity of [
		NSStackViewGravity.Leading,
		NSStackViewGravity.Center,
		NSStackViewGravity.Trailing,
	]) {
		syncStackGravityArea(parent, stack, gravity, moved)
	}

	for (const child of moved) {
		// Removing a view drops constraints to its old superview, including
		// percentage dimensions. Reinstall them after reattaching.
		applySizeConstraints(child)
		setStackChildPriorities(parent, child)
	}

	updateStackDistribution(parent)
	updateCrossAxisConstraints(parent)
}

function updateStackDistribution(parent: ElementNode) {
	const stack = (parent.childHost ?? parent.view) as NSStackView | undefined
	if (stack?.orientation == null) {
		return
	}

	if (stackJustifyContent(parent) === 'space-between') {
		stack.distribution = NSStackViewDistribution.EqualSpacing
		return
	}

	const grows = (parent.projectedChildren ?? parent.children).some(
		(child) => child.view && nodeClasses(child).includes('flex-1'),
	)

	stack.distribution = grows ? NSStackViewDistribution.Fill : NSStackViewDistribution.GravityAreas
}

function setStackChildPriorities(parent: ElementNode, child: ElementNode) {
	const stack = (parent.childHost ?? parent.view) as NSStackView | undefined
	if (stack?.orientation == null || !child.view) {
		return
	}

	const mainAxis = stack.orientation
	const grow = nodeClasses(child).includes('flex-1')
	for (const orientation of [
		NSUserInterfaceLayoutOrientation.Horizontal,
		NSUserInterfaceLayoutOrientation.Vertical,
	]) {
		// Cross-axis hugging must stay below AppKit's WindowSizeStayPut (500):
		// along the required contentView→root pin chain, any nested child
		// hugging higher than 500 outranks the window's own hold and locks the
		// window at the content's fitting size in that axis.
		const priority = orientation === mainAxis ? (grow ? 1 : 750) : 250
		const target = arrangedView(child)
		target.setContentHuggingPriorityForOrientation(priority, orientation)
		target.setContentCompressionResistancePriorityForOrientation(750, orientation)
	}

	if (child.type === 'wraplayout') {
		setWrapSizingPriorities(child, arrangedView(child))
	}
}

function makeFlexbox(props: PropBag) {
	const stack = makeStack(props, AccessibleStackView as unknown as NSClass<NSStackView>)
	const interactive = typeof props.onTap === 'function' || props.accessibilityRole === 'button'

	// Accessibility props need the AX id too — a 'checkbox'/'link' role or a
	// bare accessibilityLabel must not drop every accessibility prop.
	const actionId =
		interactive || props.accessibilityRole !== undefined || props.accessibilityLabel !== undefined
			? nextActionId++
			: undefined

	if (actionId !== undefined) {
		if (interactive) {
			stack.addGestureRecognizer(
				configureGesture(
					NSClickGestureRecognizer.alloc().initWithTargetAction(buttonActionTarget, 'viewPressed:'),
				),
			)
		}

		actionIdsByView.set(stack, actionId)
		actionHandlers.set(actionId, null)
	}

	return { view: stack, actionId }
}

function makeLabel(): NSTextField {
	const label = NSTextField.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 400, height: 32 },
	})

	label.bezeled = false
	label.drawsBackground = false
	label.editable = false
	label.selectable = false
	label.alignment = NSTextAlignment.Left
	label.cell.wraps = true
	label.cell.usesSingleLineMode = false
	label.translatesAutoresizingMaskIntoConstraints = false
	label.font = fontForStyle(16)
	label.textColor = nativeColor('#0a0a0a')
	return label
}

function makeButton(props: PropBag) {
	const button = NSButton.buttonWithTitleTargetAction(
		String(props.title ?? 'Button'),
		buttonActionTarget,
		'buttonPressed:',
	)

	button.bezelStyle = NSBezelStyle.Rounded
	button.setButtonType(NSButtonType.MomentaryLight)
	button.translatesAutoresizingMaskIntoConstraints = false
	const actionId = nextActionId++
	button.tag = actionId
	actionHandlers.set(actionId, null)
	return { view: button, actionId }
}

function makeScrollView() {
	const scroll = NSScrollView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 480, height: 320 },
	})

	const content = makeStack({ flexDirection: 'column' })
	scroll.hasVerticalScroller = true
	scroll.drawsBackground = false
	scroll.borderType = NSBorderType.No
	scroll.translatesAutoresizingMaskIntoConstraints = false
	scroll.documentView = content
	return { view: scroll, childHost: content }
}

function setScrollAction(node: ElementNode, handler: ((event: any) => void) | undefined) {
	const clipView = (node.view! as NSScrollView).contentView
	if (typeof handler !== 'function') {
		scrollHandlers.delete(clipView)
		return
	}

	if (!node.scrollObserverInstalled) {
		clipView.postsBoundsChangedNotifications = true
		node.scrollObserver =
			NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
				NSViewBoundsDidChangeNotification,
				clipView,
				null,
				() => scrollHandlers.get(clipView)?.(),
			)

		node.scrollObserverInstalled = true
	}

	scrollHandlers.set(clipView, () => {
		const startedAt = performance.now()
		const bounds = clipView.bounds
		const contentHeight = Number(
			(node.view! as NSScrollView).documentView?.frame?.size?.height ?? 0,
		)

		const event = {
			verticalOffset: Number(bounds.origin.y ?? 0),
			viewportHeight: Number(bounds.size.height ?? 0),
			contentHeight,
		}

		try {
			node.container.root!.eventScope('discrete', () => handler(event))
		} catch (error) {
			console.error('[macos-event] scroll handler failed', error)
		}

		if ((process.env as { [key: string]: string | undefined }).OCTANE_MACOS_AUTOMATION === '1') {
			node.scrollMetrics ??= { events: [] }
			const sample = {
				verticalOffset: event.verticalOffset,
				callbackMs: performance.now() - startedAt,
				mountedRows: null as number | null,
				afterEventMs: null as number | null,
			}

			node.scrollMetrics.events.push(sample)
			if (node.scrollMetrics.events.length > 2000) {
				node.scrollMetrics.events.shift()
			}

			setTimeout(() => {
				sample.afterEventMs = performance.now() - startedAt
				sample.mountedRows = [...node.container.nodes.values()].filter(
					(candidate) =>
						/^(?:row-r|bench-row-)\d+$/.test(String(candidate.props.id ?? '')) &&
						candidate.parent !== null &&
						candidate.view?.superview != null,
				).length
			}, 0)
		}
	})
}

const layoutHandlers = new WeakMap<object, () => void>()

/** Margin changes swap a node's arranged view without touching the node.
 *  Drop the observer and handler bound to the stale target — the caller
 *  re-runs `setLayoutAction`, which rebuilds both against the current
 *  arranged view so events keep reporting that view's bounds. */
function syncLayoutObserver(node: ElementNode) {
	const observed = node.layoutObservedView
	if (!observed || observed === arrangedView(node)) {
		return
	}

	layoutHandlers.delete(observed)
	if (node.layoutObserver) {
		NSNotificationCenter.defaultCenter.removeObserver(node.layoutObserver)
	}

	node.scrollGeometryDetach?.()
	node.scrollGeometryDetach = null
	node.layoutObserver = null
	node.layoutObservedView = null
}

/** `onLayoutChanged` prop: NSViewFrameDidChangeNotification on the arranged
 *  view (margin host when present) — the windowed VirtualList leaf measures
 *  rows through it. */
function setLayoutAction(node: ElementNode, handler: ((event: any) => void) | undefined) {
	const target = arrangedView(node)
	if (!target || node.type === '#text' || node.type === 'span') {
		return
	}

	syncLayoutObserver(node)
	if (typeof handler !== 'function') {
		layoutHandlers.delete(target)
		node.scrollGeometryDetach?.()
		node.scrollGeometryDetach = null
		return
	}

	target.postsFrameChangedNotifications = true
	if (node.type === 'scrollview') {
		if (!node.scrollGeometryDetach) {
			node.scrollGeometryDetach = observeScrollGeometry(node, target, () =>
				layoutHandlers.get(target)?.(),
			)

			node.layoutObservedView = target
		}
	} else if (!node.layoutObserver) {
		node.layoutObserver =
			NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
				typeof NSViewFrameDidChangeNotification !== 'undefined'
					? NSViewFrameDidChangeNotification
					: 'NSViewFrameDidChangeNotification',
				target,
				null,
				() => layoutHandlers.get(target)?.(),
			)

		node.layoutObservedView = target
	}

	layoutHandlers.set(target, () => {
		const bounds = target.bounds
		try {
			node.container.root!.eventScope('discrete', () =>
				handler({
					object: target,
					width: Number(bounds.size.width ?? 0),
					height: Number(bounds.size.height ?? 0),
				}),
			)
		} catch (error) {
			console.error('[macos-event] layout handler failed', error)
		}
	})
}

function setTextFieldPlaceholder(field: NSTextField, props: PropBag, scheme = 'light') {
	const placeholder = String(props.placeholder ?? '')
	if (!placeholder) {
		field.placeholderAttributedString = null as unknown as NSAttributedString
		field.placeholderString = placeholder
		return
	}

	field.placeholderString = placeholder
	field.placeholderAttributedString = NSAttributedString.alloc().initWithStringAttributes(
		placeholder,
		{
			[NSFontAttributeName]: field.font,
			[NSForegroundColorAttributeName]: nativeColor(
				props.placeholderTextColor != null
					? String(props.placeholderTextColor)
					: SCHEME_COLORS[scheme].placeholder,
			),
		},
	)
}

function makeTextField(props: PropBag, multiline = false) {
	const field = multiline
		? InteractionTextView.alloc().initWithFrame({
				origin: { x: 0, y: 0 },
				size: { width: 320, height: 72 },
			})
		: ContentAlignedTextField.alloc().initWithFrame({
				origin: { x: 0, y: 0 },
				size: { width: 320, height: 28 },
			})

	field.translatesAutoresizingMaskIntoConstraints = false
	field.font = fontForStyle(14)
	field.textColor = nativeColor('#0a0a0a')
	if (multiline) {
		const textView = field as InteractionTextView
		textView.editable = true
		textView.selectable = true
		textView.drawsBackground = false
		textView.textContainerInset = { width: 0, height: 0 }
		textView.textContainer.lineFragmentPadding = 0
		textView.string = String(props.value ?? '')
	} else {
		const textField = field as ContentAlignedTextField
		textField.bezeled = false
		textField.drawsBackground = false
		textField.editable = true
		const looseField = textField as any
		looseField.selectable = true
		looseField.sendsActionOnEndEditing = false
		setTextFieldPlaceholder(textField as unknown as NSTextField, props)
		textField.stringValue = String(props.value ?? '')
	}

	return field
}

function makeSearchBar() {
	const field = NSSearchField.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 320, height: 28 },
	})

	field.translatesAutoresizingMaskIntoConstraints = false
	field.stringValue = ''
	field.placeholderString = ''
	// Per-edit changes use the delegate; Return uses its field-editor command.
	// Suppress delayed search and end-editing actions, including cancellation.
	field.sendsSearchStringImmediately = false
	field.sendsWholeSearchString = true
	field.cell.sendsActionOnEndEditing = false
	return field
}

/** Match NativeScript property changes, including programmatic writes and
 * clearing, without emitting an event for an unchanged string. */
function notifySearchTextChange(node: ElementNode) {
	const value = String(node.view!.stringValue ?? '')
	const oldValue = node.text
	if (value === oldValue) {
		return
	}

	node.text = value
	const handler = node.props.onTextChange
	if (typeof handler === 'function') {
		setControlAction(node, handler, () => ({
			eventName: 'textChange',
			object: node.view,
			value,
			oldValue,
		}))

		invokeAction(node.actionId)
	}
}

function syncSearchBar(node: ElementNode, props: PropBag) {
	if ('hint' in props) {
		node.view!.placeholderString = String(node.props.hint ?? '')
	}

	if ('text' in props) {
		node.view!.stringValue = String(node.props.text ?? '')
		notifySearchTextChange(node)
	}
}

function makeSwitch(props: PropBag) {
	const button = NSButton.buttonWithTitleTargetAction('', buttonActionTarget, 'controlChanged:')
	button.setButtonType(NSButtonType.Switch)
	button.state = props.checked ? 1 : 0
	button.translatesAutoresizingMaskIntoConstraints = false
	const actionId = nextActionId++
	button.tag = actionId
	actionHandlers.set(actionId, null)
	return { view: button, actionId }
}

/** A noneditable AppKit picker for the shared NativeScript item/index API. */
function makeListPicker(node: ElementNode) {
	const view = NSPopUpButton.alloc().initWithFramePullsDown(
		{
			origin: { x: 0, y: 0 },
			size: { width: 120, height: 26 },
		},
		false,
	)

	view.target = buttonActionTarget
	view.action = 'controlChanged:'
	view.translatesAutoresizingMaskIntoConstraints = false
	const actionId = nextActionId++
	view.tag = actionId
	actionHandlers.set(actionId, null)
	node.listPickerIndex = -1
	node.listPickerRequested = -1
	return { view, actionId }
}

function notifyListPickerChange(node: ElementNode, value: number) {
	const oldValue = node.listPickerIndex
	node.listPickerIndex = value
	if (value !== oldValue && typeof node.props.onSelectedIndexChange === 'function') {
		node.props.onSelectedIndexChange({
			eventName: 'selectedIndexChange',
			object: node.view,
			value,
			oldValue,
		})
	}
}

function syncListPicker(node: ElementNode) {
	const view = node.view! as NSPopUpButton
	const items = node.props.items ?? []
	const titles = Array.from(items, (item, index) => (item == null ? String(index) : item + ''))
	// Adding by title can merge duplicate labels. Explicit menu items preserve
	// every entry and its index, including empty or repeated labels.
	if (
		!node.listPickerTitles ||
		titles.length !== node.listPickerTitles.length ||
		titles.some((title, index) => title !== node.listPickerTitles[index])
	) {
		view.removeAllItems()
		for (const title of titles) {
			view.menu!.addItem(NSMenuItem.alloc().initWithTitleActionKeyEquivalent(title, null, ''))
		}

		node.listPickerTitles = titles
		view.invalidateIntrinsicContentSize()
	}

	if (!Object.is(node.listPickerInput, node.props.selectedIndex)) {
		node.listPickerRequested = node.props.selectedIndex ?? -1
		node.listPickerInput = node.props.selectedIndex
	}

	const value = titles.length
		? Math.max(0, Math.min(node.listPickerRequested, titles.length - 1))
		: -1

	view.selectItemAtIndex(value)
	setControlAction(
		node,
		() => {
			const index = Number(view.indexOfSelectedItem)
			node.listPickerRequested = index
			notifyListPickerChange(node, index)
		},
		() => undefined,
	)

	notifyListPickerChange(node, value)
}

/** Raw shared SegmentedBar: ordered item titles with one retained selection. */
function makeSegmentedBar(node: ElementNode) {
	const view = NSSegmentedControl.segmentedControlWithLabelsTrackingModeTargetAction(
		[],
		NSSegmentSwitchTracking.SelectOne,
		buttonActionTarget,
		'controlChanged:',
	)

	view.translatesAutoresizingMaskIntoConstraints = false
	view.selectedSegmentBezelColor = nativeColor('#0000ff')
	const actionId = nextActionId++
	view.tag = actionId
	actionHandlers.set(actionId, null)
	node.segmentedBarIndex = -1
	node.segmentedBarRequested = -1
	return { view, actionId }
}

function notifySegmentedBarChange(node: ElementNode, value: number) {
	const oldIndex = node.segmentedBarIndex
	node.segmentedBarIndex = value
	if (value !== oldIndex && typeof node.props.onSelectedIndexChange === 'function') {
		node.props.onSelectedIndexChange({
			eventName: 'selectedIndexChange',
			object: node.view,
			value,
			oldIndex,
			newIndex: value,
		})
	}
}

function syncSegmentedBar(node: ElementNode) {
	const view = node.view! as NSSegmentedControl
	// Builder items precede authored children, matching NativeScript's append path.
	const titles = [
		...Array.from(node.props.items ?? [], (item: any) => String(item.title ?? '')),
		...node.children.map((item) => item.props.title ?? ''),
	]

	if (
		!node.segmentedBarTitles ||
		titles.length !== node.segmentedBarTitles.length ||
		titles.some((title, index) => title !== node.segmentedBarTitles[index])
	) {
		view.segmentCount = titles.length
		for (const [index, title] of titles.entries()) {
			view.setLabelForSegment(title, index)
		}

		node.segmentedBarTitles = titles
		view.invalidateIntrinsicContentSize()
		queueLayoutReconcile(node.container, node.parent)
	}

	if (!Object.is(node.segmentedBarInput, node.props.selectedIndex)) {
		node.segmentedBarRequested = node.props.selectedIndex ?? -1
		node.segmentedBarInput = node.props.selectedIndex
	}

	const value = titles.length
		? Math.max(0, Math.min(node.segmentedBarRequested, titles.length - 1))
		: -1

	view.selectedSegment = value
	setControlAction(
		node,
		() => {
			const index = Number(view.selectedSegment)
			node.segmentedBarRequested = index
			notifySegmentedBarChange(node, index)
		},
		() => undefined,
	)

	notifySegmentedBarChange(node, value)
}

/** Shared time-of-day values discard calendar dates, seconds and milliseconds. */
function timeOfDay(value: Date | string): Date {
	if (typeof value === 'string') {
		const match = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value)
		if (
			!match ||
			match[0] !== value ||
			Number(match[1]) > 23 ||
			Number(match[2]) > 59 ||
			Number(match[3] ?? 0) > 59
		) {
			throw new TypeError(
				'AppKit timepicker time must be a valid Date or 24-hour HH:mm[:ss] string',
			)
		}

		return new Date(0, 0, 0, Number(match[1]), Number(match[2]))
	}

	if (!(value instanceof Date) || !Number.isFinite(value.getTime())) {
		throw new TypeError('AppKit timepicker time must be a valid Date or 24-hour HH:mm[:ss] string')
	}

	return new Date(0, 0, 0, value.getHours(), value.getMinutes())
}

function makeTimePicker(node: ElementNode) {
	const view = NSDatePicker.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 100, height: 24 },
	})

	view.datePickerStyle = NSDatePickerStyle.TextFieldAndStepper
	view.datePickerElements = NSDatePickerElementFlags.HourMinute
	view.datePickerMode = NSDatePickerMode.Single
	view.bezeled = true
	view.drawsBackground = true
	view.target = buttonActionTarget
	view.action = 'controlChanged:'
	view.sizeToFit()
	view.translatesAutoresizingMaskIntoConstraints = false
	const actionId = nextActionId++
	view.tag = actionId
	actionHandlers.set(actionId, null)
	node.timePickerDefault = timeOfDay(new Date())
	node.timePickerValue = node.timePickerDefault
	node.timePickerBounds = [0, 1439]
	view.dateValue = NSDate.dateWithTimeIntervalSince1970(node.timePickerDefault.getTime() / 1000)
	return { view, actionId }
}

function notifyTimeChange(node: ElementNode, value: Date) {
	const normalized = timeOfDay(value)
	const [minimum, maximum] = node.timePickerBounds!
	const minutes = Math.min(
		Math.max(normalized.getHours() * 60 + normalized.getMinutes(), minimum),
		maximum,
	)

	const time = new Date(0, 0, 0, 0, minutes)
	const oldValue = node.timePickerValue!
	node.timePickerValue = time

	;(node.view! as NSDatePicker).dateValue = NSDate.dateWithTimeIntervalSince1970(
		time.getTime() / 1000,
	)

	if (time.getHours() !== oldValue.getHours() || time.getMinutes() !== oldValue.getMinutes()) {
		if (typeof node.props.onTimeChange === 'function') {
			node.props.onTimeChange({
				eventName: 'timeChange',
				object: node.view,
				value: new Date(time),
				oldValue: new Date(oldValue),
			})
		}
	}
}

function syncTimePicker(node: ElementNode, props: PropBag) {
	const view = node.view! as NSDatePicker
	const minimum = (node.props.minHour ?? 0) * 60 + (node.props.minMinute ?? 0)
	const maximum = (node.props.maxHour ?? 23) * 60 + (node.props.maxMinute ?? 59)
	// Bounds are one atomic range. Never partially apply an inverted proposal.
	if (minimum <= maximum) {
		node.timePickerBounds = [minimum, maximum]
	}

	const [lower, upper] = node.timePickerBounds!
	view.minDate = null as any
	view.maxDate = null as any
	view.minDate = NSDate.dateWithTimeIntervalSince1970(new Date(0, 0, 0, 0, lower).getTime() / 1000)
	view.maxDate = NSDate.dateWithTimeIntervalSince1970(new Date(0, 0, 0, 0, upper).getTime() / 1000)
	let time = new Date(node.timePickerValue!)
	const previous = node.timePickerInputs ?? {}
	for (const name of Object.keys(props)) {
		if (!['time', 'hour', 'minute'].includes(name)) {
			continue
		}

		const value = props[name]
		if (name === 'time') {
			const next = value == null ? node.timePickerDefault! : timeOfDay(value)
			const old = previous.time == null ? node.timePickerDefault! : timeOfDay(previous.time)
			if (
				(value == null) === (previous.time == null) &&
				next.getHours() === old.getHours() &&
				next.getMinutes() === old.getMinutes()
			) {
				continue
			}

			time = new Date(next)
		} else if (!Object.is(previous[name], value)) {
			if (name === 'hour') {
				time.setHours(value ?? node.timePickerDefault!.getHours())
			} else {
				time.setMinutes(value ?? node.timePickerDefault!.getMinutes())
			}
		}
	}

	// Keep copies so mutating a caller-owned Date cannot alter equality history.
	node.timePickerInputs = {
		...node.props,
		time: node.props.time == null ? undefined : timeOfDay(node.props.time),
	}

	view.enabled = node.props.isEnabled !== false
	setControlAction(
		node,
		() => notifyTimeChange(node, new Date(Number(view.dateValue!.timeIntervalSince1970) * 1000)),
		() => undefined,
	)

	notifyTimeChange(node, time)
}

/** DatePicker's shared values carry a local calendar day, never time-of-day. */
function calendarDate(value: Date | string): Date {
	const date = new Date(value)
	if (!Number.isFinite(date.getTime())) {
		throw new Error('AppKit datepicker requires a valid date')
	}

	date.setHours(0, 0, 0, 0)
	return date
}

function makeDatePicker(node: ElementNode) {
	const view = NSDatePicker.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 140, height: 24 },
	})

	view.datePickerStyle = NSDatePickerStyle.TextFieldAndStepper
	view.datePickerElements = NSDatePickerElementFlags.YearMonthDay
	view.datePickerMode = NSDatePickerMode.Single
	view.bezeled = true
	view.drawsBackground = true
	view.dateValue = NSDate.dateWithTimeIntervalSince1970(calendarDate(new Date()).getTime() / 1000)
	view.target = buttonActionTarget
	view.action = 'controlChanged:'
	view.sizeToFit()
	view.translatesAutoresizingMaskIntoConstraints = false
	const actionId = nextActionId++
	view.tag = actionId
	actionHandlers.set(actionId, null)
	node.datePickerDefault = calendarDate(new Date())
	node.datePickerValue = node.datePickerDefault
	return { view, actionId }
}

function notifyDateChange(node: ElementNode, value: Date) {
	const oldValue = node.datePickerValue as Date
	const date = calendarDate(value)
	node.datePickerValue = date

	;(node.view! as NSDatePicker).dateValue = NSDate.dateWithTimeIntervalSince1970(
		date.getTime() / 1000,
	)

	if (date.getTime() !== oldValue.getTime() && typeof node.props.onDateChange === 'function') {
		node.props.onDateChange({
			eventName: 'dateChange',
			object: node.view,
			value: new Date(date),
			oldValue: new Date(oldValue),
		})
	}
}

function syncDatePicker(node: ElementNode, props: PropBag) {
	const view = node.view! as NSDatePicker
	// Clear both old bounds before applying a new range, so moving the range
	// does not leave AppKit temporarily constrained by the previous endpoint.
	view.minDate = null as any
	view.maxDate = null as any
	if (node.props.minDate != null) {
		view.minDate = NSDate.dateWithTimeIntervalSince1970(
			calendarDate(node.props.minDate).getTime() / 1000,
		)
	}

	if (node.props.maxDate != null) {
		view.maxDate = NSDate.dateWithTimeIntervalSince1970(
			calendarDate(node.props.maxDate).getTime() / 1000,
		)
	}

	let date = new Date(node.datePickerValue as Date)
	const previous = node.datePickerInputs ?? {}
	// Property order matches NativeScript's sequential setters. An explicit
	// date sets all components; subsequent component props adjust that date.
	for (const name of Object.keys(props)) {
		if (
			!['date', 'year', 'month', 'day'].includes(name) ||
			Object.is(previous[name], props[name])
		) {
			continue
		}

		const value = props[name]
		if (name === 'date') {
			date = value == null ? new Date(node.datePickerDefault as Date) : calendarDate(value)
		} else if (name === 'year') {
			date.setFullYear(value ?? (node.datePickerDefault as Date).getFullYear())
		} else if (name === 'month') {
			date.setMonth((value ?? (node.datePickerDefault as Date).getMonth() + 1) - 1)
		} else {
			date.setDate(value ?? (node.datePickerDefault as Date).getDate())
		}
	}

	node.datePickerInputs = { ...node.props }
	if (node.props.minDate != null && date < calendarDate(node.props.minDate)) {
		date = calendarDate(node.props.minDate)
	}

	if (node.props.maxDate != null && date > calendarDate(node.props.maxDate)) {
		date = calendarDate(node.props.maxDate)
	}

	view.enabled = node.props.isEnabled !== false
	setControlAction(
		node,
		() => notifyDateChange(node, new Date(Number(view.dateValue!.timeIntervalSince1970) * 1000)),
		() => undefined,
	)

	notifyDateChange(node, date)
}

function makeProgress() {
	const view = NSProgressIndicator.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 140, height: 16 },
	})

	view.style = NSProgressIndicatorStyle.Bar
	view.controlSize = NSControlSize.Regular
	view.indeterminate = false
	view.displayedWhenStopped = true
	view.minValue = 0
	view.maxValue = 100
	view.doubleValue = 0
	view.sizeToFit()
	view.translatesAutoresizingMaskIntoConstraints = false
	return view
}

function syncProgress(node: ElementNode) {
	const view = node.view! as NSProgressIndicator
	const maximum = node.props.maxValue ?? 100
	// A positive native range keeps the degenerate shared case at 0%,
	// without asking AppKit to divide by zero or accept a negative range.
	view.maxValue = maximum > 0 ? maximum : 100
	view.doubleValue = maximum > 0 ? Math.min(Math.max(node.props.value ?? 0, 0), maximum) : 0
}

function makeActivityIndicator() {
	const view = NSProgressIndicator.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 16, height: 16 },
	})

	view.style = NSProgressIndicatorStyle.Spinning
	view.controlSize = NSControlSize.Regular
	view.indeterminate = true
	view.displayedWhenStopped = false
	view.sizeToFit()
	view.translatesAutoresizingMaskIntoConstraints = false
	return view
}

function syncActivityIndicator(node: ElementNode) {
	const view = node.view! as NSProgressIndicator
	if (node.props.busy === true) {
		view.startAnimation(null)
	} else {
		view.stopAnimation(null)
	}

	// NSStackView detaches hidden arranged views. Suppress drawing instead
	// so a stopped spinner retains its NativeScript-style layout slot.
	view.alphaValue = node.props.busy === true ? Number(node.appliedStyle?.opacity ?? 1) : 0
}

function makeSlider(props: PropBag) {
	const slider = NSSlider.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 140, height: 24 },
	})

	slider.minValue = Number(props.minValue ?? 0)
	slider.maxValue = Number(props.maxValue ?? 1)
	slider.doubleValue = Number(props.value ?? 0)
	slider.target = buttonActionTarget
	slider.action = 'controlChanged:'
	slider.translatesAutoresizingMaskIntoConstraints = false
	const actionId = nextActionId++
	slider.tag = actionId
	actionHandlers.set(actionId, null)
	return { view: slider, actionId }
}

function makeGridLayout() {
	const view = GridLayoutView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 140, height: 28 },
	})

	view.translatesAutoresizingMaskIntoConstraints = false
	return view
}

function makeAbsoluteLayout() {
	const view = AbsoluteLayoutView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 140, height: 28 },
	})

	view.translatesAutoresizingMaskIntoConstraints = false
	return view
}

function layoutLength(value: any, available: number, fallback: number) {
	if (typeof value === 'string' && value.trim().endsWith('%')) {
		const percent = Number(value.trim().slice(0, -1))
		return Number.isFinite(percent) ? (available * percent) / 100 : fallback
	}

	const length = Number(value)
	return Number.isFinite(length) ? length : fallback
}

function parseGridTracks(spec: any): GridTrack[] {
	if (typeof spec !== 'string' || !spec.trim()) {
		return []
	}

	return spec
		.split(/[\s,]+/)
		.filter(Boolean)
		.map((token): GridTrack => {
			if (token === 'auto') {
				return { kind: 'auto', value: 0 }
			}

			const fraction = /^(\d+(?:\.\d+)?|\.\d+)?(?:\*|fr)$/.exec(token)
			if (fraction) {
				const weight = Number(fraction[1] || 1)
				if (weight > 0) {
					return { kind: 'fraction', value: weight }
				}
			}

			const fixed = /^(\d+(?:\.\d+)?|\.\d+)(?:px)?$/.exec(token)
			if (fixed) {
				return { kind: 'fixed', value: Number(fixed[1]) }
			}

			throw new Error('[macos-host] unsupported grid track ' + JSON.stringify(token))
		})
}

function gridIndex(value: any) {
	const index = Number(value ?? 0)
	return Number.isFinite(index) ? Math.max(0, Math.floor(index)) : 0
}

function gridSpan(value: any) {
	const span = Number(value ?? 1)
	return Number.isFinite(span) ? Math.max(1, Math.floor(span)) : 1
}

function gridAreaIsFree(
	occupied: Set<string>,
	row: number,
	col: number,
	rowSpan: number,
	colSpan: number,
) {
	for (let currentRow = row; currentRow < row + rowSpan; currentRow++) {
		for (let currentCol = col; currentCol < col + colSpan; currentCol++) {
			if (occupied.has(currentRow + ':' + currentCol)) {
				return false
			}
		}
	}

	return true
}

function occupyGridArea(
	occupied: Set<string>,
	row: number,
	col: number,
	rowSpan: number,
	colSpan: number,
) {
	for (let currentRow = row; currentRow < row + rowSpan; currentRow++) {
		for (let currentCol = col; currentCol < col + colSpan; currentCol++) {
			occupied.add(currentRow + ':' + currentCol)
		}
	}
}

function autoPlaceGridChildren(parent: ElementNode, placements: GridPlacement[]) {
	const explicitColumns = parseGridTracks(parent.props.columns).length
	const placedColumnCount = Math.max(
		0,
		...placements
			.filter((placement) => placement.col != null)
			.map((placement) => placement.col! + placement.colSpan),
	)

	const columnCount = Math.max(
		1,
		explicitColumns,
		placedColumnCount,
		...placements.map((placement) => placement.colSpan),
	)

	const occupied = new Set<string>()
	for (const placement of placements) {
		if (placement.row != null && placement.col != null) {
			occupyGridArea(occupied, placement.row, placement.col, placement.rowSpan, placement.colSpan)
		}
	}

	for (const placement of placements) {
		if (placement.row == null || placement.col != null) {
			continue
		}

		let col = 0
		while (!gridAreaIsFree(occupied, placement.row, col, placement.rowSpan, placement.colSpan)) {
			col++
		}

		placement.col = col
		occupyGridArea(occupied, placement.row, col, placement.rowSpan, placement.colSpan)
	}

	for (const placement of placements) {
		if (placement.col == null || placement.row != null) {
			continue
		}

		let row = 0
		while (!gridAreaIsFree(occupied, row, placement.col, placement.rowSpan, placement.colSpan)) {
			row++
		}

		placement.row = row
		occupyGridArea(occupied, row, placement.col, placement.rowSpan, placement.colSpan)
	}

	let cursorRow = 0
	let cursorCol = 0
	for (const placement of placements) {
		if (placement.row != null && placement.col != null) {
			continue
		}

		while (true) {
			const availableColumns = Math.max(columnCount, placement.colSpan)
			if (cursorCol + placement.colSpan > availableColumns) {
				cursorRow++
				cursorCol = 0
				continue
			}

			if (gridAreaIsFree(occupied, cursorRow, cursorCol, placement.rowSpan, placement.colSpan)) {
				break
			}

			cursorCol++
		}

		placement.row = cursorRow
		placement.col = cursorCol
		occupyGridArea(occupied, cursorRow, cursorCol, placement.rowSpan, placement.colSpan)
		cursorCol += placement.colSpan
		if (cursorCol >= columnCount) {
			cursorRow++
			cursorCol = 0
		}
	}
}

function gridAxisTracks(spec: any, placements: GridPlacement[], axis: 'rows' | 'columns') {
	const indexKey = axis === 'columns' ? 'col' : 'row'
	const spanKey = axis === 'columns' ? 'colSpan' : 'rowSpan'
	const explicit = parseGridTracks(spec)
	const requiredCount = Math.max(
		1,
		...placements.map((placement) => (placement[indexKey] ?? 0) + placement[spanKey]),
	)

	const tracks = explicit.length
		? explicit
		: Array.from({ length: requiredCount }, (): GridTrack => ({ kind: 'auto', value: 0 }))

	while (tracks.length < requiredCount) {
		tracks.push({ kind: 'auto', value: 0 })
	}

	return tracks
}

function gridPreferredSize(child: ElementNode, axis: 'rows' | 'columns', available: number) {
	const name = axis === 'columns' ? 'width' : 'height'
	const styled = child.props.style?.[name]
	if (styled != null) {
		return Math.max(0, layoutLength(styled, available, 0))
	}

	const intrinsic = Number(layoutView(child).intrinsicContentSize?.[name] ?? 0)
	return Number.isFinite(intrinsic) ? Math.max(0, intrinsic) : 0
}

function resolveGridTrackSizes(
	tracks: GridTrack[],
	placements: GridPlacement[],
	axis: 'rows' | 'columns',
	available: number,
) {
	const sizes = tracks.map((track) => (track.kind === 'fixed' ? track.value : 0))
	for (const placement of placements) {
		const start = placement[axis === 'columns' ? 'col' : 'row']!
		const span = placement[axis === 'columns' ? 'colSpan' : 'rowSpan']
		const autoTracks: number[] = []
		let currentSize = 0
		for (let index = start; index < Math.min(start + span, tracks.length); index++) {
			currentSize += sizes[index]
			if (tracks[index].kind === 'auto') {
				autoTracks.push(index)
			}
		}

		if (!autoTracks.length) {
			continue
		}

		const preferred = gridPreferredSize(placement.child, axis, available)
		const extra = Math.max(0, preferred - currentSize) / autoTracks.length
		for (const index of autoTracks) {
			sizes[index] += extra
		}
	}

	const fixedAndAuto = sizes.reduce(
		(sum, size, index) => sum + (tracks[index].kind === 'fraction' ? 0 : size),
		0,
	)

	const fractionWeight = tracks.reduce(
		(sum, track) => sum + (track.kind === 'fraction' ? track.value : 0),
		0,
	)

	const fractionSize =
		fractionWeight > 0 ? Math.max(0, available - fixedAndAuto) / fractionWeight : 0

	for (let index = 0; index < tracks.length; index++) {
		if (tracks[index].kind === 'fraction') {
			sizes[index] = fractionSize * tracks[index].value
		}
	}

	return sizes
}

function trackOffset(sizes: number[], index: number) {
	let offset = 0
	for (let current = 0; current < index; current++) {
		offset += sizes[current]
	}

	return offset
}

/** Pin a grid/absolute child to the rect its parent's layout pass computed.
 *  Children are translates=false views, so Auto Layout owns their frames —
 *  an imperative frame write only holds until the next solve shrinks the
 *  child back to fitting size. Each axis gets one edge pin against the
 *  parent plus one size pin, so parent geometry stays an input; a pin set
 *  that also implied the parent's size would outrank the window's
 *  500-priority WindowSizeStayPut hold and lock the window at the content's
 *  fitting size. */
function pinLayoutChild(
	child: ElementNode,
	parentView: any,
	x: number,
	top: number,
	width: number,
	height: number,
) {
	const pins = (child.placementPins ??= {})
	if (!pins.leading) {
		pins.leading = layoutView(child).leadingAnchor.constraintEqualToAnchorConstant(
			parentView.leadingAnchor,
			0,
		)

		pins.top = layoutView(child).topAnchor.constraintEqualToAnchorConstant(parentView.topAnchor, 0)
		pins.width = layoutView(child).widthAnchor.constraintEqualToConstant(0)
		pins.height = layoutView(child).heightAnchor.constraintEqualToConstant(0)
		for (const pin of [pins.leading, pins.top, pins.width, pins.height]) {
			pin.active = true
		}
	}

	const same = (a: number, b: number) => a === b || (Number.isNaN(a) && Number.isNaN(b))
	if (
		same(Number(pins.leading.constant), x) &&
		same(Number(pins.top.constant), top) &&
		same(Number(pins.width.constant), width) &&
		same(Number(pins.height.constant), height)
	) {
		return
	}

	pins.leading.constant = x
	pins.top.constant = top
	pins.width.constant = width
	pins.height.constant = height
	// Constant writes inside a layout() pass apply only on the next solve, and
	// a needsLayout mark made now is cleared when that pass ends. Defer the
	// mark so the next layoutSubtreeIfNeeded/display cycle applies the pins —
	// without it, real-window resizes leave children at stale frames. The bare
	// vm slices in tests have no microtask queue, so fall back to a direct
	// mark there.
	const mark = () => {
		parentView.needsLayout = true
	}

	if (typeof queueMicrotask === 'function') {
		queueMicrotask(mark)
	} else {
		mark()
	}
}

/** Drop the pins a grid/absolute parent installed — a constraint that keeps
 *  referencing the old parent view is invalid once the child reparents. */
function releasePlacementPins(node: ElementNode) {
	const pins = node.placementPins
	if (!pins) {
		return
	}

	for (const pin of Object.values(pins) as { active: boolean }[]) {
		pin.active = false
	}

	node.placementPins = null
}

function layoutGridChildren(parent: ElementNode | undefined) {
	if (!parent?.view) {
		return
	}

	const width = Number(parent.view.bounds.size.width)
	const height = Number(parent.view.bounds.size.height)
	const overlayChildren = parent.props.overlayChildren === true
	const placements = (parent.projectedChildren ?? parent.children)
		.filter((child) => child.view)
		.map((child) => ({
			child,
			row: overlayChildren ? 0 : child.props.row == null ? null : gridIndex(child.props.row),
			col: overlayChildren ? 0 : child.props.col == null ? null : gridIndex(child.props.col),
			rowSpan: overlayChildren ? 1 : gridSpan(child.props.rowSpan),
			colSpan: overlayChildren ? 1 : gridSpan(child.props.colSpan),
		}))

	const hasTracks = Boolean(
		String(parent.props.rows ?? '').trim() || String(parent.props.columns ?? '').trim(),
	)

	const hasPlacement = placements.some(
		({ child, row, col, rowSpan, colSpan }) =>
			(child.props.row != null && row !== 0) ||
			(child.props.col != null && col !== 0) ||
			rowSpan !== 1 ||
			colSpan !== 1,
	)

	// Preserve overlay behavior for Slider and Stack. Explicit tracks or
	// non-default cell placement opt into track layout. Configured grids
	// auto-place children with no row or column using the web renderer's default
	// row flow, unless the host explicitly requests overlay behavior.
	if (hasTracks || hasPlacement) {
		if (!overlayChildren) {
			autoPlaceGridChildren(parent, placements)
		}

		const columns = gridAxisTracks(parent.props.columns, placements, 'columns')
		const rows = gridAxisTracks(parent.props.rows, placements, 'rows')
		const columnSizes = resolveGridTrackSizes(columns, placements, 'columns', width)
		const rowSizes = resolveGridTrackSizes(rows, placements, 'rows', height)

		for (const placement of placements) {
			const { child, row, col, rowSpan, colSpan } = placement
			const style = child.props.style ?? {}
			const cellX = trackOffset(columnSizes, col!)
			const cellTop = trackOffset(rowSizes, row!)
			const cellWidth = columnSizes.slice(col!, col! + colSpan).reduce((sum, size) => sum + size, 0)
			const cellHeight = rowSizes.slice(row!, row! + rowSpan).reduce((sum, size) => sum + size, 0)
			const horizontal = child.props.horizontalAlignment ?? 'stretch'
			const vertical = child.props.verticalAlignment ?? 'stretch'
			const intrinsic = layoutView(child).intrinsicContentSize ?? { width: 0, height: 0 }
			const childWidth =
				style.width == null
					? horizontal === 'stretch'
						? cellWidth
						: Math.max(0, Number(intrinsic.width ?? 0))
					: layoutLength(style.width, cellWidth, 0)

			const childHeight =
				style.height == null
					? vertical === 'stretch'
						? cellHeight
						: Math.max(0, Number(intrinsic.height ?? 0))
					: layoutLength(style.height, cellHeight, 0)

			let x = cellX
			if (horizontal === 'center' || horizontal === 'middle') {
				x += (cellWidth - childWidth) / 2
			} else if (horizontal === 'right') {
				x += cellWidth - childWidth
			}

			const insets = marginInsetsOf(child)
			x += layoutLength(style.left, cellWidth, 0) + (insets?.left ?? 0)

			let top = cellTop
			if (vertical === 'middle' || vertical === 'center') {
				top += (cellHeight - childHeight) / 2
			} else if (vertical === 'bottom') {
				top += cellHeight - childHeight
			}

			top += layoutLength(style.top, cellHeight, 0) + (insets?.top ?? 0)
			pinLayoutChild(
				child,
				parent.view,
				x,
				top,
				Math.max(0, childWidth - (insets?.right ?? 0)),
				Math.max(0, childHeight - (insets?.bottom ?? 0)),
			)
		}

		return
	}

	for (const { child } of placements) {
		const style = child.props.style ?? {}
		const horizontal = child.props.horizontalAlignment ?? 'stretch'
		const vertical = child.props.verticalAlignment ?? 'stretch'
		const intrinsic = layoutView(child).intrinsicContentSize ?? { width: 0, height: 0 }
		const childWidth =
			style.width == null
				? horizontal === 'stretch'
					? width
					: Math.max(0, Number(intrinsic.width ?? 0))
				: layoutLength(style.width, width, 0)

		const childHeight =
			style.height == null
				? vertical === 'stretch'
					? height
					: Math.max(0, Number(intrinsic.height ?? 0))
				: layoutLength(style.height, height, 0)

		let x = 0
		if (horizontal === 'center' || horizontal === 'middle') {
			x = (width - childWidth) / 2
		} else if (horizontal === 'right') {
			x = width - childWidth
		} else if (horizontal === 'left') {
			x = layoutLength(style.left, width, 0) + Number(style.marginLeft ?? 0)
		}

		let y = 0
		if (vertical === 'middle' || vertical === 'center') {
			y = (height - childHeight) / 2
		} else if (vertical === 'top') {
			y = height - childHeight - Number(style.marginTop ?? 0)
		}

		pinLayoutChild(child, parent.view, x, height - y - childHeight, childWidth, childHeight)
	}
}

function layoutAbsoluteChildren(parent: ElementNode | undefined) {
	if (!parent?.view) {
		return
	}

	const width = Number(parent.view.bounds.size.width)
	const height = Number(parent.view.bounds.size.height)

	for (const child of parent.projectedChildren ?? parent.children) {
		if (!child.view) {
			continue
		}

		const style = child.props.style ?? {}
		const intrinsic = layoutView(child).intrinsicContentSize ?? { width: 0, height: 0 }
		const left = layoutLength(child.props.left, width, Number.NaN)
		const right = layoutLength(child.props.right, width, Number.NaN)
		const top = layoutLength(child.props.top, height, Number.NaN)
		const bottom = layoutLength(child.props.bottom, height, Number.NaN)
		const childWidth =
			style.width == null
				? Number.isFinite(left) && Number.isFinite(right)
					? Math.max(0, width - left - right)
					: Math.max(0, Number(intrinsic.width ?? 0))
				: layoutLength(style.width, width, 0)

		const childHeight =
			style.height == null
				? Number.isFinite(top) && Number.isFinite(bottom)
					? Math.max(0, height - top - bottom)
					: Math.max(0, Number(intrinsic.height ?? 0))
				: layoutLength(style.height, height, 0)

		const x = Number.isFinite(left) ? left : Number.isFinite(right) ? width - right - childWidth : 0

		const offsetTop = Number.isFinite(top)
			? top
			: Number.isFinite(bottom)
				? height - bottom - childHeight
				: 0

		pinLayoutChild(child, parent.view, x, offsetTop, childWidth, childHeight)
	}
}

// Width/height percentages use the parent's full measured size, not the
// progressively smaller strip. Explicit lengths are capped by the measure slot
// (NativeScript ViewHelper.getMeasureSpec); margins consume additional space.
function dockChildSize(
	child: ElementNode,
	axis: 'width' | 'height',
	available: number,
	basis: number,
) {
	const spec = child.sizeConstraintSpecs?.[axis]
	const desired = child.props.style?.[axis]
	const intrinsic = layoutView(child).intrinsicContentSize?.[axis]
	const fitting = layoutView(child).fittingSize?.[axis]
	const natural = Math.max(0, Number(Number(intrinsic) >= 0 ? intrinsic : fitting) || 0)
	const length =
		desired != null
			? typeof desired === 'string' && desired.endsWith('%') && !Number.isFinite(basis)
				? natural
				: layoutLength(desired, basis, natural)
			: spec?.kind === 'points'
				? spec.points
				: spec?.kind === 'percent' && Number.isFinite(basis)
					? spec.multiplier * basis
					: natural

	const margins = child.marginInsets ?? {}
	const margin =
		axis === 'width'
			? (margins.left ?? 0) + (margins.right ?? 0)
			: (margins.top ?? 0) + (margins.bottom ?? 0)

	return Math.max(
		0,
		Math.min(desired != null || spec ? available : Math.max(0, available - margin), length),
	)
}

function dockNaturalSize(parent: ElementNode | undefined) {
	let width = 0,
		height = 0,
		usedWidth = 0,
		usedHeight = 0

	for (const child of parent?.projectedChildren ?? parent?.children ?? []) {
		if (!child.view) {
			continue
		}

		const margins = child.marginInsets ?? {}
		const w =
			dockChildSize(child, 'width', Infinity, Infinity) + (margins.left ?? 0) + (margins.right ?? 0)

		const h =
			dockChildSize(child, 'height', Infinity, Infinity) +
			(margins.top ?? 0) +
			(margins.bottom ?? 0)

		if (['top', 'bottom'].includes(child.props.dock)) {
			usedHeight += h
			width = Math.max(width, usedWidth + w)
			height = Math.max(height, usedHeight)
		} else {
			usedWidth += w
			width = Math.max(width, usedWidth)
			height = Math.max(height, usedHeight + h)
		}
	}

	const padding = parent?.dockInsets ?? {}
	return {
		width: width + (padding.left ?? 0) + (padding.right ?? 0),
		height: height + (padding.top ?? 0) + (padding.bottom ?? 0),
	}
}

function layoutDockChildren(parent: ElementNode | undefined) {
	if (!parent?.view) {
		return
	}

	const padding = parent.dockInsets ?? {}
	const width = Math.max(
		0,
		Number(parent.view.bounds.size.width) - (padding.left ?? 0) - (padding.right ?? 0),
	)

	const height = Math.max(
		0,
		Number(parent.view.bounds.size.height) - (padding.top ?? 0) - (padding.bottom ?? 0),
	)

	let x = padding.left ?? 0,
		top = padding.top ?? 0,
		remainingWidth = width,
		remainingHeight = height

	const children = (parent.projectedChildren ?? parent.children).filter((child) => child.view)
	for (const [index, child] of children.entries()) {
		const margins = child.marginInsets ?? {}
		const ml = margins.left ?? 0,
			mr = margins.right ?? 0,
			mt = margins.top ?? 0,
			mb = margins.bottom ?? 0

		const measuredWidth = dockChildSize(
			child,
			'width',
			remainingWidth,
			Number(parent.view.bounds.size.width),
		)

		const measuredHeight = dockChildSize(
			child,
			'height',
			remainingHeight,
			Number(parent.view.bounds.size.height),
		)

		const stretch = index === children.length - 1 && parent.props.stretchLastChild !== false
		let slotX = x,
			slotTop = top,
			slotWidth = remainingWidth,
			slotHeight = remainingHeight

		if (!stretch) {
			switch (child.props.dock ?? 'left') {
				case 'top':
					slotHeight = measuredHeight + mt + mb
					top += slotHeight
					remainingHeight = Math.max(0, remainingHeight - slotHeight)
					break
				case 'bottom':
					slotHeight = measuredHeight + mt + mb
					slotTop += remainingHeight - slotHeight
					remainingHeight = Math.max(0, remainingHeight - slotHeight)
					break
				case 'right':
					slotWidth = measuredWidth + ml + mr
					slotX += remainingWidth - slotWidth
					remainingWidth = Math.max(0, remainingWidth - slotWidth)
					break
				default:
					slotWidth = measuredWidth + ml + mr
					x += slotWidth
					remainingWidth = Math.max(0, remainingWidth - slotWidth)
			}
		}

		const axis = (
			slot: number,
			measured: number,
			fixed: boolean,
			alignment: string,
			start: number,
			end: number,
		) => {
			const space = Math.max(0, slot - start - end)
			const size = alignment === 'stretch' && !fixed ? space : measured
			const offset =
				alignment === 'right' || alignment === 'bottom'
					? slot - end - size
					: ['stretch', 'center', 'middle'].includes(alignment)
						? start + (space - size) / 2
						: start

			return [offset, size]
		}

		const [dx, w] = axis(
			slotWidth,
			measuredWidth,
			child.props.style?.width != null || !!child.sizeConstraintSpecs?.width,
			child.props.horizontalAlignment ?? 'stretch',
			ml,
			mr,
		)

		const [dy, h] = axis(
			slotHeight,
			measuredHeight,
			child.props.style?.height != null || !!child.sizeConstraintSpecs?.height,
			child.props.verticalAlignment ?? 'stretch',
			mt,
			mb,
		)

		// NativeScript rounds both edges independently.
		const left = Math.round(slotX + dx),
			childTop = Math.round(slotTop + dy)

		pinLayoutChild(
			child,
			parent.view,
			left,
			childTop,
			Math.round(slotX + dx + w) - left,
			Math.round(slotTop + dy + h) - childTop,
		)
	}
}

// NativeScript 9.1.2 (MIT): ui/layouts/wrap-layout/index.ios.ts,
// wrap-layout-common.ts, and ViewHelper's measure/alignment rules. Positive
// item lengths define slots; nonpositive/absent lengths measure naturally.
// Measured children and slots remain distinct so fixed children can align.
function wrapMeasure(parent: ElementNode, width: number, height: number) {
	const padding = parent.dockInsets ?? {}
	const availableWidth = Math.max(0, width - (padding.left ?? 0) - (padding.right ?? 0))
	const availableHeight = Math.max(0, height - (padding.top ?? 0) - (padding.bottom ?? 0))
	const itemWidth = parent.props.itemWidth > 0 ? parent.props.itemWidth : 0
	const itemHeight = parent.props.itemHeight > 0 ? parent.props.itemHeight : 0
	const vertical = parent.props.orientation === 'vertical'
	const limit = vertical ? availableHeight : availableWidth
	const lines: { length: number; cross: number; entries: any[] }[] = []
	for (const child of parent.projectedChildren ?? parent.children) {
		if (!child.view) {
			continue
		}

		const margins = child.marginInsets ?? {}
		const mx = (margins.left ?? 0) + (margins.right ?? 0)
		const my = (margins.top ?? 0) + (margins.bottom ?? 0)
		const fixedWidth = child.props.style?.width != null || !!child.sizeConstraintSpecs?.width
		const fixedHeight = child.props.style?.height != null || !!child.sizeConstraintSpecs?.height
		const measuredWidth =
			itemWidth && !fixedWidth && (child.props.horizontalAlignment ?? 'stretch') === 'stretch'
				? Math.max(0, itemWidth - mx)
				: dockChildSize(child, 'width', itemWidth || availableWidth, width)

		const measuredHeight =
			itemHeight && !fixedHeight && (child.props.verticalAlignment ?? 'stretch') === 'stretch'
				? Math.max(0, itemHeight - my)
				: dockChildSize(child, 'height', itemHeight || availableHeight, height)

		const slotWidth = itemWidth || Math.round(measuredWidth + mx)
		const slotHeight = itemHeight || Math.round(measuredHeight + my)
		const length = vertical ? slotHeight : slotWidth
		const cross = vertical ? slotWidth : slotHeight
		let line = lines[lines.length - 1]
		if (!line) {
			line = { length: 0, cross: 0, entries: [] }
			lines.push(line)
		}

		if (line.length + length > limit) {
			// The pinned implementation records both cross lengths when the
			// first item exceeds the bound; retain that measure behavior.
			if (!line.entries.length) {
				line.cross = cross
			}

			line = { length: 0, cross: 0, entries: [] }
			lines.push(line)
		}

		line.entries.push({
			child,
			measuredWidth,
			measuredHeight,
			slotWidth,
			slotHeight,
			fixedWidth,
			fixedHeight,
		})

		line.length += length
		line.cross = Math.max(line.cross, cross)
	}

	const main = Math.max(0, ...lines.map((line) => line.length))
	const cross = lines.reduce((sum, line) => sum + line.cross, 0)
	return {
		lines,
		width: (vertical ? cross : main) + (padding.left ?? 0) + (padding.right ?? 0),
		height: (vertical ? main : cross) + (padding.top ?? 0) + (padding.bottom ?? 0),
	}
}

function wrapNaturalSize(parent: ElementNode | undefined) {
	if (!parent) {
		return { width: 0, height: 0 }
	}

	// AppKit asks for intrinsic size before and after assigning a frame. Use
	// explicit dimensions first, then an assigned main-axis bound; the free
	// cross axis must stay unbounded so the intrinsic height/width can grow.
	const vertical = parent.props.orientation === 'vertical'
	const bound = (axis: 'width' | 'height') => {
		const spec = parent.sizeConstraintSpecs?.[axis]
		if (spec?.kind === 'points') {
			return spec.points
		}

		const value = Number(parent.view?.bounds.size[axis])
		return (axis === 'height') === vertical && value > 0 ? value : Infinity
	}

	const { width, height } = wrapMeasure(parent, bound('width'), bound('height'))
	return { width, height }
}

function layoutWrapChildren(parent: ElementNode | undefined) {
	if (!parent?.view) {
		return
	}

	const width = Number(parent.view.bounds.size.width)
	const height = Number(parent.view.bounds.size.height)
	const padding = parent.dockInsets ?? {}
	const vertical = parent.props.orientation === 'vertical'
	const { lines } = wrapMeasure(parent, width, height)
	const mainStart = vertical ? (padding.top ?? 0) : (padding.left ?? 0)
	const mainEnd = vertical ? height - (padding.bottom ?? 0) : width - (padding.right ?? 0)
	const crossEnd = vertical ? width - (padding.right ?? 0) : height - (padding.bottom ?? 0)
	let cross = vertical ? (padding.left ?? 0) : (padding.top ?? 0)
	let main = mainStart
	let lineIndex = 0
	for (const entry of lines.flatMap((line) => line.entries)) {
		const { child, measuredWidth, measuredHeight, slotWidth, slotHeight, fixedWidth, fixedHeight } =
			entry

		let lineCross = lines[lineIndex]?.cross ?? 0
		const length = vertical ? slotHeight : slotWidth
		const first = main === mainStart
		if (main + length > mainEnd && cross + lineCross <= crossEnd) {
			main = mainStart
			if (!first) {
				cross += lineCross
			}

			lineIndex++
			lineCross = lines[first ? lineIndex - 1 : lineIndex]?.cross ?? 0
		}

		const margins = child.marginInsets ?? {}
		const axis = (
			slot: number,
			measured: number,
			fixed: boolean,
			alignment: string,
			start: number,
			end: number,
		) => {
			const space = Math.max(0, slot - start - end)
			const size = alignment === 'stretch' && !fixed ? space : measured
			const offset =
				alignment === 'right' || alignment === 'bottom'
					? slot - end - size
					: ['center', 'middle'].includes(alignment) || (alignment === 'stretch' && fixed)
						? start + (space - size) / 2
						: start

			return [offset, size]
		}

		const [dx, w] = axis(
			vertical ? lineCross : slotWidth,
			measuredWidth,
			fixedWidth,
			child.props.horizontalAlignment ?? 'stretch',
			margins.left ?? 0,
			margins.right ?? 0,
		)

		const [dy, h] = axis(
			vertical ? slotHeight : lineCross,
			measuredHeight,
			fixedHeight,
			child.props.verticalAlignment ?? 'stretch',
			margins.top ?? 0,
			margins.bottom ?? 0,
		)

		const x = (vertical ? cross : main) + dx
		const top = (vertical ? main : cross) + dy
		// NativeScript leaves an out-of-bounds child at its last frame.
		if (main < mainEnd && cross < crossEnd) {
			pinLayoutChild(
				child,
				parent.view,
				Math.round(x),
				Math.round(top),
				Math.round(x + w) - Math.round(x),
				Math.round(top + h) - Math.round(top),
			)
		}

		main += vertical ? slotHeight : slotWidth
	}
}

function rootNaturalSize(parent: ElementNode | undefined) {
	let width = 0,
		height = 0

	for (const child of parent?.projectedChildren ?? parent?.children ?? []) {
		if (!child.view) {
			continue
		}

		const margins = child.marginInsets ?? {}
		width = Math.max(
			width,
			dockChildSize(child, 'width', Infinity, Infinity) +
				(margins.left ?? 0) +
				(margins.right ?? 0),
		)

		height = Math.max(
			height,
			dockChildSize(child, 'height', Infinity, Infinity) +
				(margins.top ?? 0) +
				(margins.bottom ?? 0),
		)
	}

	const padding = parent?.dockInsets ?? {}
	return {
		width: width + (padding.left ?? 0) + (padding.right ?? 0),
		height: height + (padding.top ?? 0) + (padding.bottom ?? 0),
	}
}

function layoutRootChildren(parent: ElementNode | undefined) {
	if (!parent?.view) {
		return
	}

	// Each child receives the whole padded cell. Reuse the established
	// NativeScript measure/alignment implementation for a final stretching
	// slot, independently for every child; attached dock metadata has no effect.
	for (const child of parent.projectedChildren ?? parent.children) {
		if (!child.view) {
			continue
		}

		layoutDockChildren({ ...parent, props: {}, projectedChildren: [child] })
	}

	// JSX order is also native back-to-front order. Reorder only our own
	// children; window presentation layers and their ownership stay untouched.
	const children = (parent.projectedChildren ?? parent.children).filter((child) => child.view)
	const views = children.map(layoutView)
	const native = parent.view.subviews
	const count = native?.count
	const actual = Array.from({ length: Number(count ?? 0) }, (_, i) =>
		native.objectAtIndex(i),
	).filter((view) => views.includes(view))

	if (views.some((view, index) => view !== actual[index])) {
		let previous: NSView | null = null
		for (const view of views) {
			parent.view.addSubviewPositionedRelativeTo(view, 1, previous)
			previous = view
		}
	}
}

function layoutContentChild(parent: ElementNode | undefined) {
	const child = parent?.projectedChildren ? parent.projectedChildren[0] : parent?.contentChild
	if (!parent?.view || !child?.view) {
		return
	}

	const width = Number(parent.view.bounds.size.width)
	const height = Number(parent.view.bounds.size.height)
	const style = child.props.style ?? {}
	const intrinsic = layoutView(child).intrinsicContentSize ?? { width: 0, height: 0 }
	const horizontal = child.props.horizontalAlignment ?? 'stretch'
	const vertical = child.props.verticalAlignment ?? 'stretch'
	const margins = child.marginInsets ?? {}
	const axis = (
		available: number,
		desired: any,
		natural: number,
		alignment: string,
		start: number,
		end: number,
	) => {
		const space = Math.max(0, available - start - end)
		const size =
			desired == null
				? alignment === 'stretch'
					? space
					: Math.max(0, Number(natural) || 0)
				: Math.max(0, layoutLength(desired, available, 0))

		const offset =
			alignment === 'right' || alignment === 'bottom'
				? available - end - size
				: ['stretch', 'center', 'middle'].includes(alignment)
					? start + (space - size) / 2
					: start

		return [offset, size]
	}

	const [x, childWidth] = axis(
		width,
		style.width,
		intrinsic.width,
		horizontal,
		margins.left ?? 0,
		margins.right ?? 0,
	)

	const [top, childHeight] = axis(
		height,
		style.height,
		intrinsic.height,
		vertical,
		margins.top ?? 0,
		margins.bottom ?? 0,
	)

	pinLayoutChild(child, parent.view, x, top, childWidth, childHeight)
}

function performGridAccessibilityAdjustment(view: any, name: string) {
	const node = gridLayoutNodesByView.get(view)!
	const handler = node?.props[name]
	if (typeof handler !== 'function') {
		return false
	}

	try {
		node!.container.root!.eventScope('discrete', handler)
		return true
	} catch (error) {
		console.error('[macos-event] slider accessibility adjustment failed', error)
		return false
	}
}

class InputImageView extends NSImageView {
	static {
		NativeClass(this)
	}
	hitTest(point: any): any {
		return inputTransparentViews.has(this) ? null : super.hitTest(point)
	}
}

function makeImageView(props: PropBag) {
	const image = InputImageView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 24, height: 24 },
	})

	image.translatesAutoresizingMaskIntoConstraints = false
	updateImage(image, props.src)

	return image
}

/** Types whose views arrange child views; mirrors the check in insert(). */
const VIEW_PARENT_TYPES = new Set([
	'docklayout',
	'wraplayout',
	'rootlayout',
	'contentview',
	'proxyviewcontainer',
	'stack',
	'stacklayout',
	'flexboxlayout',
	'scrollview',
	'gridlayout',
	'absolutelayout',
])

/** Every type the factory switch below can build. */
const SUPPORTED_TYPES = new Set([
	...VIEW_PARENT_TYPES,
	'label',
	'htmlview',
	'#text',
	'button',
	'textfield',
	'textview',
	'searchbar',
	'switch',
	'slider',
	'activityindicator',
	'progress',
	'datepicker',
	'timepicker',
	'listpicker',
	'listview',
	'segmentedbar',
	'tabview',
	'tabviewitem',
	'segmentedbaritem',
	'webview',
	'image',
	'span',
	'formattedstring',
])

function typeHasView(type: string) {
	return (
		type !== 'tabviewitem' &&
		type !== 'segmentedbaritem' &&
		type !== '#text' &&
		type !== 'span' &&
		type !== 'formattedstring' &&
		type !== 'proxyviewcontainer'
	)
}

function assertSupportedType(type: string) {
	if (!SUPPORTED_TYPES.has(type)) {
		throw new Error('AppKit spike does not support <' + type + '>')
	}
}

/** Deterministic prop failures that would otherwise throw after views and
 *  registrations exist. `baseProps` supplies already-applied props for
 *  update commands so merged-prop rules (e.g. placeholder color) stay exact. */
function validateNodeProps(type: string, props: PropBag | undefined, baseProps?: PropBag) {
	if (type === 'listview') {
		validateListProps(props ?? {}, (template) =>
			template.validate(
				(tag, values) => {
					try {
						assertSupportedType(tag)
						validateNodeProps(tag, values)
					} catch (error) {
						throw new TypeError('[macos-host] listview itemTemplate: ' + String(error))
					}
				},
				(parent, child) => {
					validateTextNesting(parent, child)
					if (
						parent &&
						(typeHasView(child) || child === 'proxyviewcontainer') &&
						!VIEW_PARENT_TYPES.has(parent)
					) {
						throw new TypeError(
							'[macos-host] listview itemTemplate: <' + parent + '> cannot contain child views',
						)
					}
				},
			),
		)

		if (props?.separatorColor != null) {
			nativeColor(props.separatorColor)
		}
	}

	if (type === 'tabview' || type === 'tabviewitem') {
		validateTabProps(type, props ?? {})
	}

	if (type === 'segmentedbaritem' && props?.title != null && typeof props.title !== 'string') {
		throw new Error('AppKit segmentedbaritem title must be a string')
	}

	if (type === 'segmentedbar') {
		if (props?.items != null && !Array.isArray(props.items)) {
			throw new Error('AppKit segmentedbar items must be an array')
		}

		for (const item of props?.items ?? []) {
			if (!item || typeof item !== 'object') {
				throw new Error('AppKit segmentedbar items must be objects with optional titles')
			}

			if (item.title != null && typeof item.title !== 'string') {
				throw new Error('AppKit segmentedbar item title must be a string')
			}
		}

		if (props?.selectedIndex != null && !Number.isInteger(props.selectedIndex)) {
			throw new Error('AppKit segmentedbar selectedIndex must be an integer')
		}

		if (props?.style?.selectedBackgroundColor != null) {
			nativeColor(props.style.selectedBackgroundColor)
		}
	}

	if (type === 'listpicker') {
		if (props?.items != null && !Array.isArray(props.items)) {
			throw new Error('AppKit listpicker items must be an array')
		}

		if (props?.selectedIndex != null && !Number.isInteger(props.selectedIndex)) {
			throw new Error('AppKit listpicker selectedIndex must be an integer')
		}

		// Validate item conversion before allocating a view or registration.
		for (const item of props?.items ?? []) {
			if (item != null) {
				void (item + '')
			}
		}
	}

	if (type === 'timepicker') {
		if (props?.time != null) {
			timeOfDay(props.time)
		}

		for (const name of ['hour', 'minute', 'minHour', 'minMinute', 'maxHour', 'maxMinute']) {
			const value = props?.[name]
			const maximum = name.toLowerCase().includes('hour') ? 23 : 59
			if (value != null && (!Number.isInteger(value) || value < 0 || value > maximum)) {
				throw new TypeError(
					'AppKit timepicker ' + name + ' must be an integer from 0 through ' + maximum,
				)
			}
		}
	}

	if (type === 'datepicker') {
		for (const name of ['date', 'minDate', 'maxDate']) {
			if (props?.[name] != null) {
				if (!(props[name] instanceof Date) && typeof props[name] !== 'string') {
					throw new Error('AppKit datepicker ' + name + ' must be Date or string')
				}

				calendarDate(props[name])
			}
		}

		for (const name of ['year', 'month', 'day']) {
			if (props?.[name] != null && !Number.isInteger(props[name])) {
				throw new Error('AppKit datepicker ' + name + ' must be an integer')
			}
		}
	}

	if (type === 'progress') {
		for (const name of ['value', 'maxValue']) {
			if (
				props?.[name] != null &&
				(typeof props[name] !== 'number' || !Number.isFinite(props[name]))
			) {
				throw new Error('AppKit progress ' + name + ' must be a finite number')
			}
		}
	}

	if (type === 'activityindicator' && props?.busy != null && typeof props.busy !== 'boolean') {
		throw new Error('AppKit activityindicator busy must be boolean')
	}

	if (type === 'htmlview') {
		validateHtmlProps(props ?? {})
	}

	if (type === 'span' || type === 'formattedstring') {
		validateTextStyle(props ?? {}, nativeColor)
		return
	}

	if (type === '#text') {
		return
	}

	const style = props?.style
	if (style != null) {
		if (typeof style !== 'object') {
			throw new Error('AppKit spike expects style to be an object')
		}

		// applyStyle feeds these straight into nativeColor.
		if (style.backgroundColor != null) {
			nativeColor(style.backgroundColor)
		}

		if (style.borderColor != null) {
			nativeColor(style.borderColor)
		}

		if (
			['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(type) &&
			style.color != null
		) {
			nativeColor(style.color)
		}
	}

	if (
		['stacklayout', 'wraplayout'].includes(type) &&
		props?.orientation != null &&
		!['horizontal', 'vertical'].includes(props.orientation)
	) {
		throw new Error('[macos-host] ' + type + ' orientation must be horizontal or vertical')
	}

	if (
		type === 'docklayout' &&
		props?.stretchLastChild != null &&
		typeof props.stretchLastChild !== 'boolean'
	) {
		throw new Error('[macos-host] docklayout stretchLastChild must be boolean')
	}

	if (type === 'wraplayout') {
		for (const name of ['itemWidth', 'itemHeight']) {
			const value = props?.[name]
			if (value != null && (typeof value !== 'number' || !Number.isFinite(value))) {
				throw new Error('[macos-host] wraplayout ' + name + ' must be a finite number')
			}
		}
	}

	if (props?.dock != null && !['left', 'top', 'right', 'bottom'].includes(props.dock)) {
		throw new Error('[macos-host] dock must be left, top, right or bottom')
	}

	if (type === 'gridlayout') {
		// layoutGridChildren parses the track lists on every apply.
		parseGridTracks(props?.rows)
		parseGridTracks(props?.columns)
	}

	if (type === 'textfield' && props?.placeholderTextColor != null) {
		// setTextFieldPlaceholder only reaches the color when text exists.
		const placeholder = props.placeholder ?? baseProps?.placeholder
		if (String(placeholder ?? '') !== '') {
			nativeColor(props.placeholderTextColor)
		}
	}

	if (type === 'label') {
		// syncLabelOverflow and syncNodeFont throw the same deterministic
		// errors inside applyProps — validate here so pre-flight honors its
		// contract and the batch aborts before earlier commands mutate state.
		const merged = { ...baseProps, ...props }
		if (merged.whiteSpace != null && !['normal', 'nowrap'].includes(merged.whiteSpace)) {
			throw new Error('[macos-host] label whiteSpace supports only normal and nowrap')
		}

		if (merged.textOverflow != null && !['clip', 'ellipsis'].includes(merged.textOverflow)) {
			throw new Error('[macos-host] label textOverflow supports only clip and ellipsis')
		}

		if (merged.maxLines != null && (!Number.isInteger(merged.maxLines) || merged.maxLines < 0)) {
			throw new Error('[macos-host] label maxLines must be a non-negative integer')
		}

		if (props?.fontSize !== undefined && !Number.isFinite(Number(props.fontSize))) {
			throw new Error('[macos-host] label fontSize must be a finite number')
		}
	}
}

function makeNode(container: RootContainer, id: number, type: string, props: PropBag) {
	// Reject malformed props before factories allocate views or register
	// actions — the node only reaches container.nodes after this returns, so
	// a throwing prop below must unwind whatever was already acquired.
	assertSupportedType(type)
	validateNodeProps(type, props)

	const node: ElementNode = {
		id,
		type,
		view: null,
		props: {},
		parent: null,
		children: [],
		container,
		appliedFontFamily: container.fontFamily,
		scrollObserverInstalled: false,
		text: '',
	}

	try {
		switch (type) {
			case 'stack':
				node.view = makeStack(props)
				break
			case 'stacklayout': {
				const stack = makeFlexbox({
					...props,
					// Keep the recognizer ready for a handler added after creation.
					onTap: props.onTap ?? props.onClick ?? props.onPress ?? (() => {}),
					flexDirection: props.orientation === 'horizontal' ? 'row' : 'column',
				})

				node.view = stack.view
				node.actionId = stack.actionId
				break
			}
			case 'flexboxlayout': {
				const flexbox = makeFlexbox(props)
				node.view = flexbox.view
				node.actionId = flexbox.actionId
				break
			}
			case 'rootlayout':
				node.view = makeRootLayout(node)
				break
			case 'wraplayout':
				node.view = makeWrapLayout(node)
				break
			case 'docklayout':
				node.view = makeDockLayout(node)
				break
			case 'contentview':
				node.view = makeContentView()
				contentViewNodesByView.set(node.view!, node)
				observeContentGeometry(node)
				break
			case 'gridlayout':
				node.view = makeGridLayout() as unknown as NSView
				break
			case 'absolutelayout':
				node.view = makeAbsoluteLayout()
				break
			case 'tabview':
				node.view = makeTabView(node)
				break
			case 'tabviewitem':
				makeTabItem(node)
				break
			case 'segmentedbar': {
				const control = makeSegmentedBar(node)
				node.view = control.view
				node.actionId = control.actionId
				break
			}
			case 'listview':
				node.view = makeListView({
					createRoot: (host) => createMacOSRoot(host, { fontFamily: container.fontFamily }),
					releaseOwnedRoot: (host) => ownedRoots.get(host)?.unmount(),
					color: nativeColor,
				}) as AppKitView

				break
			case 'listpicker': {
				const control = makeListPicker(node)
				node.view = control.view
				node.actionId = control.actionId
				break
			}
			case 'timepicker': {
				const control = makeTimePicker(node)
				node.view = control.view
				node.actionId = control.actionId
				break
			}
			case 'datepicker': {
				const control = makeDatePicker(node)
				node.view = control.view
				node.actionId = control.actionId
				break
			}
			case 'progress':
				node.view = makeProgress()
				break
			case 'activityindicator':
				node.view = makeActivityIndicator()
				break
			case 'htmlview':
				node.view = makeLabel()
				// @ts-ignore selectable is writable on NSTextView; generated decl marks it readonly.
				node.view.selectable = true
				break
			case 'label':
				node.view = makeLabel()
				break
			case '#text':
				break
			case 'button': {
				const button = makeButton(props)
				node.view = button.view
				node.actionId = button.actionId
				break
			}
			case 'scrollview': {
				const scroll = makeScrollView()
				node.view = scroll.view
				node.childHost = scroll.childHost
				break
			}
			case 'searchbar':
				node.view = makeSearchBar()
				break
			case 'textfield':
				node.view = makeTextField(props) as unknown as NSView
				break
			case 'textview':
				node.view = makeTextField(props, true) as unknown as NSView
				break
			case 'switch': {
				const control = makeSwitch(props)
				node.view = control.view
				node.actionId = control.actionId
				break
			}
			case 'slider': {
				const control = makeSlider(props)
				node.view = control.view
				node.actionId = control.actionId
				break
			}
			case 'webview':
				node.view = makeWebView()
				break
			case 'image':
				node.view = makeImageView(props)
				break
			case 'proxyviewcontainer':
			case 'formattedstring':
			case 'segmentedbaritem':
			case 'span':
				break
			default:
				throw new Error('AppKit spike does not support <' + type + '>')
		}

		if (type === 'textfield' || type === 'textview' || type === 'searchbar') {
			node.actionId = nextActionId++
			actionIdsByView.set(node.view!, node.actionId)
			actionHandlers.set(node.actionId, null)
			if (type !== 'textview') {
				// Per-edit events arrive through controlTextDidChange (delegate);
				// the target/action is reserved for submission on Return.
				const textField = node.view! as NSTextField
				textField.delegate = buttonActionTarget
				textField.target = buttonActionTarget
				if (type === 'searchbar') {
					// @ts-ignore clearing the action needs null; generated decl types it non-null.
					textField.action = null
				} else {
					textField.action = 'textFieldSubmitted:'
				}
			} else {
				;(node.view! as NSTextView).delegate = buttonActionTarget
			}
		}

		if (['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(type)) {
			const textControl = node.view! as NSTextField | NSTextView
			if (textControl.font) {
				textControl.font = fontForFamilyStyle(textControl.font.pointSize, 400, container.fontFamily)
			}
		}

		if (type === 'gridlayout') {
			gridLayoutNodesByView.set(node.view!, node)
		}

		if (type === 'absolutelayout') {
			absoluteLayoutNodesByView.set(node.view!, node)
		}

		if (type === 'textfield' || type === 'searchbar') {
			textNodesByView.set(node.view!, node)
		}

		if (type === 'textview') {
			const textView = node.view! as NSTextView
			const viewport = NSScrollView.alloc().initWithFrame(textView.frame)
			viewport.translatesAutoresizingMaskIntoConstraints = false
			viewport.drawsBackground = false
			viewport.borderType = NSBorderType.No
			viewport.hasVerticalScroller = true
			viewport.autohidesScrollers = true
			textView.translatesAutoresizingMaskIntoConstraints = true
			textView.autoresizingMask = NSAutoresizingMaskOptions.WidthSizable
			textView.verticallyResizable = true
			textView.horizontallyResizable = false
			textView.maxSize = { width: Number.MAX_SAFE_INTEGER, height: Number.MAX_SAFE_INTEGER }
			textView.textContainer.widthTracksTextView = true
			viewport.documentView = textView
			node.textViewport = viewport
			viewport.contentView.postsFrameChangedNotifications = true
			node.textLayoutObserver =
				NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
					NSViewFrameDidChangeNotification,
					viewport.contentView,
					null,
					() => fitTextView(node),
				)

			const placeholder = makeLabel()
			placeholder.font = fontForFamilyStyle(14, 400, node.appliedFontFamily)
			placeholder.textColor = nativeColor('#666666')
			placeholder.stringValue = String(props.placeholder ?? '')
			placeholder.translatesAutoresizingMaskIntoConstraints = false
			placeholder.heightAnchor.constraintEqualToConstant(
				Math.ceil(14 * DEFAULT_TEXT_LINE_HEIGHT_RATIO),
			).active = true

			placeholder.hidden = String(props.value ?? '').length > 0
			node.view!.addSubview(placeholder)
			placeholder.leadingAnchor.constraintEqualToAnchorConstant(
				node.view!.leadingAnchor,
				0,
			).active = true

			placeholder.topAnchor.constraintEqualToAnchor(node.view!.topAnchor).active = true
			node.placeholderView = placeholder
			textNodesByView.set(node.view!, node)
		}

		applyProps(node, props)
		if (node.view) {
			const owner = nodeContainersByView.get(node.view)
			if (owner && owner !== container) {
				throw new Error('AppKit node view is already owned by another Octane root.')
			}

			nodeContainersByView.set(node.view, container)
		}

		return node
	} catch (error) {
		// Release whatever the failed creation registered — action slots,
		// observers, WebView delegates — since no caller can destroy it.
		destroy(node)
		throw error
	}
}

const EDGE_INSET_PROPS = new Map([
	['paddingTop', ['top']],
	['paddingRight', ['right']],
	['paddingBottom', ['bottom']],
	['paddingLeft', ['left']],
	['paddingVertical', ['top', 'bottom']],
	['paddingHorizontal', ['left', 'right']],
])

// number | 'N' | 'V H' | 'T R B L' → NSEdgeInsets (top/left/bottom/right).
function parseEdgeInsets(value: any) {
	if (typeof value === 'number' || !isNaN(Number(value))) {
		const n = Number(value)
		return { top: n, left: n, bottom: n, right: n }
	}

	const parts = String(value)
		.split(/\s+/)
		.map((p) => parseFloat(p) || 0)

	const top = parts[0] ?? 0
	const right = parts.length > 1 ? parts[1] : top
	const bottom = parts.length > 2 ? parts[2] : top
	const left = parts.length > 3 ? parts[3] : right
	return { top, left, bottom, right }
}

function nativeColor(value: any): NSColor {
	const string = String(value)
	let match = /^#([\da-f]{6})$/i.exec(string)
	if (match) {
		const hex = match[1]
		return NSColor.colorWithRedGreenBlueAlpha(
			parseInt(hex.slice(0, 2), 16) / 255,
			parseInt(hex.slice(2, 4), 16) / 255,
			parseInt(hex.slice(4, 6), 16) / 255,
			1,
		)
	}

	match = /^#([\da-f]{8})$/i.exec(string)
	if (match) {
		const hex = match[1]
		return NSColor.colorWithRedGreenBlueAlpha(
			parseInt(hex.slice(0, 2), 16) / 255,
			parseInt(hex.slice(2, 4), 16) / 255,
			parseInt(hex.slice(4, 6), 16) / 255,
			parseInt(hex.slice(6, 8), 16) / 255,
		)
	}

	match = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)[,\s/]*([\d.]*)\s*(%?)\s*\)$/i.exec(
		string,
	)

	if (match) {
		// Clamp components like CSS does; a percent alpha is /100, a bare
		// number is already 0–1.
		const component = (raw: string) => Math.min(255, Math.max(0, Number(raw))) / 255
		const alpha = match[4] === '' ? 1 : match[5] === '%' ? Number(match[4]) / 100 : Number(match[4])

		return NSColor.colorWithRedGreenBlueAlpha(
			component(match[1]),
			component(match[2]),
			component(match[3]),
			Math.min(1, Math.max(0, alpha)),
		)
	}

	throw new Error(
		'AppKit spike expects #rrggbb, #rrggbbaa, or rgb()/rgba() colors, received ' + string,
	)
}

// The renderer has no CSS layer, so the shared `dark`/`ns-dark` scheme classes
// can't cascade through selectors. Each themeable color carries a semantic
// slot and the resolved value tracks the nearest `dark`/`ns-dark` ancestor —
// the same mechanism ns-dark uses to re-theme native subtrees. Light values
// are the pre-existing hardcoded palette; dark values mirror tokens.css's
// `.dark` overrides (--color-text/text-secondary/onprimary/primary/surface).
const SCHEME_COLORS: Record<string, Record<string, string>> = {
	light: {
		text: '#0a0a0a',
		muted: '#71717a',
		onprimary: '#ffffff',
		placeholder: '#666666',
		primary: '#2563eb',
		danger: '#dc2626',
		secondary: '#3f3f46',
		surface: '#ffffff',
	},
	dark: {
		text: '#ededed',
		muted: '#a1a1a1',
		onprimary: '#171717',
		placeholder: '#a1a1a1',
		primary: '#ededed',
		danger: '#dc2626',
		secondary: '#3f3f46',
		surface: '#0a0a0a',
	},
}

function nodeScheme(node: ElementNode) {
	for (let current: ElementNode | null = node; current; current = current.parent) {
		const classes = nodeClasses(current)
		if (classes.includes('dark') || classes.includes('ns-dark')) {
			return 'dark'
		}
	}

	return 'light'
}

// Re-resolve a node's class-driven colors under its current scheme. Explicit
// style.color/style.backgroundColor always win over class palette slots.
function applyThemeColors(node: ElementNode) {
	const view = node.view!
	if (!view) {
		return
	}

	node.scheme = nodeScheme(node)
	const colors = SCHEME_COLORS[node.scheme]
	if (['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(node.type)) {
		view.textColor = nativeColor(node.styleColor ?? colors[node.colorSlot ?? 'text'])
		if (node.type === 'label') {
			setLabelText(node, String(view.stringValue ?? ''))
		}
	}

	if (node.type === 'textfield') {
		setTextFieldPlaceholder(view as NSTextField, node.props, node.scheme)
	}

	if (node.type === 'textview' && node.placeholderView) {
		node.placeholderView.textColor = nativeColor(colors.placeholder)
	}

	if (node.bgSlot || node.styleBg != null) {
		node.bgApplied = true
		view.wantsLayer = true
		view.layer.backgroundColor = nativeColor(node.styleBg ?? colors[node.bgSlot]).CGColor
	} else if (node.bgApplied) {
		node.bgApplied = false
		view.layer.backgroundColor = null
	}
}

// Colors resolve through the parent chain, so a node mounted under (or into)
// a differently-schemed subtree re-resolves its whole branch on insertion.
function syncScheme(node: ElementNode) {
	const scheme = nodeScheme(node)
	if (scheme === (node.scheme ?? 'light')) {
		return
	}

	for (const entry of [node, ...descendants(node)]) {
		applyThemeColors(entry)
	}
}

function fontForStyle(size: number, weight: number | string = 400) {
	return fontForFamilyStyle(size, weight)
}

function setSizeConstraint(node: ElementNode, name: string, value: any) {
	const spec = sizeConstraintSpec(value)
	const specs = (node.sizeConstraintSpecs ??= {})
	if (!spec) {
		delete specs[name]
		// null/undefined is an intentional clear — only malformed values warn.
		if (value != null) {
			console.warn(
				'[macos-style] ignored unsupported style.' + name + ' value ' + JSON.stringify(value),
			)
		}
	} else {
		specs[name] = spec
	}

	if (
		['gridlayout', 'absolutelayout', 'docklayout', 'wraplayout', 'rootlayout'].includes(
			(node.layoutParent ?? node.parent)?.type ?? '',
		)
	) {
		deactivateSizeConstraints(node)
		queueLayoutReconcile(node.container, node.parent)
		return
	}

	applySizeConstraint(node, name)
	if (node.parent) {
		queueLayoutReconcile(node.container, node.parent)
	}
}

function sizeConstraintSpec(value: any) {
	if (typeof value === 'string') {
		const text = value.trim()
		const percent = text.match(/^([+-]?(?:\d+\.?\d*|\.\d+))%$/)
		if (percent) {
			const multiplier = Number(percent[1]) / 100
			return Number.isFinite(multiplier) && multiplier >= 0 ? { kind: 'percent', multiplier } : null
		}

		const px = text.match(/^([+-]?(?:\d+\.?\d*|\.\d+))px$/i)
		if (px) {
			const points = Number(px[1])
			return Number.isFinite(points) && points >= 0 ? { kind: 'points', points } : null
		}
	}

	const points = typeof value === 'number' ? value : Number(value)
	return Number.isFinite(points) && points >= 0 ? { kind: 'points', points } : null
}

function sizeConstraintParentView(node: ElementNode) {
	if (node.parent) {
		return (node.layoutParent ?? node.parent).childHost ?? (node.layoutParent ?? node.parent).view
	}

	return node.container.children.includes(node) ? node.container.hostView : null
}

function applySizeConstraint(node: ElementNode, name: string) {
	const constraints = (node.sizeConstraints ??= {})
	if (constraints[name]) {
		constraints[name].active = false
		delete constraints[name]
	}

	const spec = node.sizeConstraintSpecs?.[name]
	if (
		!spec ||
		!node.view ||
		['contentview', 'docklayout', 'wraplayout', 'rootlayout'].includes(
			(node.layoutParent ?? node.parent)?.type ?? '',
		)
	) {
		return
	}

	let constraint
	if (spec.kind === 'percent') {
		const parentView = sizeConstraintParentView(node)
		if (!parentView) {
			return
		}

		const anchor = name === 'width' ? layoutView(node).widthAnchor : layoutView(node).heightAnchor
		const parentAnchor = name === 'width' ? parentView.widthAnchor : parentView.heightAnchor
		constraint = anchor.constraintEqualToAnchorMultiplier(parentAnchor, spec.multiplier)
	} else {
		constraint =
			name === 'width'
				? layoutView(node).widthAnchor.constraintEqualToConstant(spec.points)
				: layoutView(node).heightAnchor.constraintEqualToConstant(spec.points)
	}

	constraints[name] = constraint
	constraint.active = true
}

function applySizeConstraints(node: ElementNode) {
	for (const name of ['width', 'height']) {
		applySizeConstraint(node, name)
	}
}

function deactivateSizeConstraints(node: ElementNode) {
	for (const name of ['width', 'height']) {
		const constraint = node.sizeConstraints?.[name]
		if (constraint) {
			constraint.active = false
			delete node.sizeConstraints[name]
		}
	}
}

// Style, class, and (for labels) prop sources all write one native font.
// Each source is tracked on the node so removing one re-resolves the rest —
// explicit style wins over classes, which win over the element defaults.
function syncNodeFont(node: ElementNode) {
	const size =
		node.styleFontSize ??
		node.propFontSize ??
		node.classFontSize ??
		(['label', 'htmlview'].includes(node.type) ? 16 : 14)

	const weight = node.styleFontWeight ?? node.classFontWeight ?? 400
	node.appliedFontWeight = String(weight)
	node.appliedFontFamily = node.styleFontFamily ?? node.container.fontFamily
	node.view!.font = fontForFamilyStyle(size, weight, node.appliedFontFamily)
}

// NSStackView edgeInsets blend padding styles over class padding over zero.
// Edges a style never set fall through to the class contribution.
function syncEdgeInsets(node: ElementNode) {
	const view = node.view
	if (!view) {
		return
	}

	const edges = node.stylePaddingEdges
	const box = node.stylePaddingBox
	const klass = node.classInsets
	if (!edges && !box && !klass && !node.insetsApplied) {
		return
	}

	node.insetsApplied = true
	const insets = {
		top: edges?.top ?? box?.top ?? klass?.top ?? 0,
		right: edges?.right ?? box?.right ?? klass?.right ?? 0,
		bottom: edges?.bottom ?? box?.bottom ?? klass?.bottom ?? 0,
		left: edges?.left ?? box?.left ?? klass?.left ?? 0,
	}

	if (node.type === 'docklayout' || node.type === 'wraplayout' || node.type === 'rootlayout') {
		node.dockInsets = insets
		queueLayoutReconcile(node.container, node)
	} else {
		view.edgeInsets = insets
	}
}

// borderRadius (style) and rounded-* (class) share cornerRadius; either source
// keeps masksToBounds on only while a positive radius is in effect.
function syncCornerRadius(node: ElementNode) {
	const view = node.view
	if (!view) {
		return
	}

	const radius = Number(node.styleRadius ?? node.classRadius ?? 0) || 0
	if (radius <= 0 && !node.radiusApplied) {
		return
	}

	node.radiusApplied = radius > 0
	view.wantsLayer = true
	view.layer.cornerRadius = Math.max(0, radius)
	view.layer.masksToBounds = radius > 0
}

// Zero the margin sides a removed style owned, then let the stack unwrap or
// the grid relayout — marginInsetsOf() returns null once every side is zero.
function clearMarginStyle(node: ElementNode, name: string) {
	const insets = node.marginInsets
	if (!insets) {
		return
	}

	if (name === 'margin') {
		insets.top = insets.right = insets.bottom = insets.left = 0
	} else {
		insets[MARGIN_SIDES[name]] = 0
	}

	if ((node.layoutParent ?? node.parent)?.type === 'gridlayout') {
		layoutGridChildren(node.layoutParent ?? node.parent ?? undefined)
		return
	}

	syncMarginHost(node)
}

// A style key present in the last bag but absent or nulled in the new one must
// put back the native state it installed: constraints deactivate, hit-testing
// reverts, and shared properties resolve their class/default source again.
function resetStyle(node: ElementNode, name: string) {
	const view = node.view
	if (!view) {
		return
	}

	const textControl = ['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(
		node.type,
	)

	if (name === 'selectedBackgroundColor' && node.type === 'segmentedbar') {
		view.selectedSegmentBezelColor = nativeColor('#0000ff')
	} else if (name === 'pointerEvents') {
		inputTransparentViews.delete(view)
	} else if (name === 'objectFit' && node.type === 'image') {
		// NSImageScaleProportionallyDown — the makeImageView/AppKit default.
		view.imageScaling = 0
	} else if (name === 'fontSize' && textControl) {
		node.styleFontSize = undefined
		syncNodeFont(node)
	} else if (name === 'fontFamily' && textControl) {
		node.styleFontFamily = undefined
		syncNodeFont(node)
	} else if (name === 'fontWeight' && textControl) {
		node.styleFontWeight = undefined
		syncNodeFont(node)
	} else if (name === 'color' && textControl) {
		node.styleColor = undefined
		applyThemeColors(node)
	} else if (
		name === 'padding' &&
		['flexboxlayout', 'stacklayout', 'docklayout', 'wraplayout', 'rootlayout'].includes(node.type)
	) {
		node.stylePaddingBox = undefined
		syncEdgeInsets(node)
	} else if (
		EDGE_INSET_PROPS.has(name) &&
		['flexboxlayout', 'stacklayout', 'docklayout', 'wraplayout', 'rootlayout'].includes(node.type)
	) {
		for (const edge of EDGE_INSET_PROPS.get(name)!) {
			delete node.stylePaddingEdges?.[edge]
		}

		syncEdgeInsets(node)
	} else if (name === 'backgroundColor') {
		node.styleBg = undefined
		applyThemeColors(node)
	} else if (name === 'borderRadius') {
		node.styleRadius = undefined
		syncCornerRadius(node)
	} else if (name === 'width' || name === 'height') {
		setSizeConstraint(node, name, undefined)
	} else if (name === 'left' || name === 'top' || name === 'right' || name === 'bottom') {
		if ((node.layoutParent ?? node.parent)?.type === 'gridlayout') {
			layoutGridChildren(node.layoutParent ?? node.parent ?? undefined)
		}

		if ((node.layoutParent ?? node.parent)?.type === 'absolutelayout') {
			layoutAbsoluteChildren(node.layoutParent ?? node.parent ?? undefined)
		}
	} else if (name === 'translateX' || name === 'translateY') {
		if (typeof view.layer?.setValueForKeyPath === 'function') {
			view.layer.setValueForKeyPath(
				0,
				name === 'translateY' ? 'transform.translation.y' : 'transform.translation.x',
			)
		}
	} else if (name === 'zIndex') {
		if (view.layer) {
			view.layer.zPosition = 0
		}
	} else if (name === 'opacity') {
		view.alphaValue = 1
	} else if (name === 'textAlign' && node.type === 'label') {
		view.alignment = nodeClasses(node).includes('vx-sheet-grabber')
			? NSTextAlignment.Center
			: NSTextAlignment.Left
	} else if (name === 'borderWidth') {
		if (view.layer) {
			view.layer.borderWidth = 0
		}
	} else if (name === 'borderColor') {
		if (view.layer) {
			view.layer.borderColor = null
		}
	} else if (MARGIN_SIDES[name] || name === 'margin') {
		clearMarginStyle(node, name)
	}
	// lineHeight folds into setLabelText from props.style — no native reset.
}

function applyStyle(node: ElementNode, style: PropBag) {
	if (style != null && typeof style !== 'object') {
		throw new Error('AppKit spike expects style to be an object')
	}

	// The style prop replaces wholesale, so keys dropped or nulled since the
	// last apply must reset the native state they installed before the current
	// values go on — otherwise removed styles linger on the view.
	const next: PropBag = style ?? {}
	if (['flexboxlayout', 'stack', 'stacklayout'].includes(node.type)) {
		node.styleLayout = Object.fromEntries(
			Object.entries(next).filter(([name]) => isStackLayoutInput(name)),
		)
	}

	const prev: PropBag = node.appliedStyle ?? {}
	for (const name of Object.keys(prev)) {
		if (prev[name] != null && next[name] == null) {
			resetStyle(node, name)
		}
	}

	for (const [name, value] of Object.entries(next)) {
		if (value == null) {
			continue
		}

		if (['flexboxlayout', 'stack', 'stacklayout'].includes(node.type) && isStackLayoutInput(name)) {
			// Applied together below, after all style inputs have reconciled.
			continue
		} else if (name === 'pointerEvents') {
			if (value === 'none') {
				inputTransparentViews.add(node.view!)
			} else {
				inputTransparentViews.delete(node.view!)
			}
		} else if (name === 'selectedBackgroundColor' && node.type === 'segmentedbar') {
			node.view!.selectedSegmentBezelColor = nativeColor(value)
		} else if (name === 'objectFit' && node.type === 'image') {
			// NSImageScaling: 0 ProportionallyDown, 1 AxesIndependently,
			// 2 None (centered, unscaled), 3 ProportionallyUpOrDown.
			// AppKit has no cover mode — 'cover' degrades to scale-down.
			const imageScaling: Record<string, number> = {
				contain: 3,
				'scale-down': 0,
				fill: 1,
				none: 2,
			}

			node.view!.imageScaling = imageScaling[String(value)] ?? 0
		} else if (
			name === 'fontSize' &&
			['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(node.type)
		) {
			node.styleFontSize = value
			syncNodeFont(node)
		} else if (
			name === 'fontFamily' &&
			['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(node.type)
		) {
			node.styleFontFamily = String(value)
			syncNodeFont(node)
		} else if (
			name === 'color' &&
			['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(node.type)
		) {
			node.styleColor = String(value)
			node.view!.textColor = nativeColor(value)
		} else if (name === 'lineHeight' && node.type === 'label') {
			// syncText applies this to each paragraph; it is not the label's fixed height.
			continue
		} else if (
			name === 'padding' &&
			['flexboxlayout', 'stacklayout', 'docklayout', 'wraplayout', 'rootlayout'].includes(node.type)
		) {
			node.stylePaddingBox = parseEdgeInsets(value)
			syncEdgeInsets(node)
		} else if (
			EDGE_INSET_PROPS.has(name) &&
			['flexboxlayout', 'stacklayout', 'docklayout', 'wraplayout', 'rootlayout'].includes(node.type)
		) {
			const edges = (node.stylePaddingEdges ??= {})
			for (const edge of EDGE_INSET_PROPS.get(name)!) {
				edges[edge] = Number(value) || 0
			}

			syncEdgeInsets(node)
		} else if (name === 'backgroundColor' && node.view) {
			node.styleBg = String(value)
			node.bgApplied = true
			node.view.wantsLayer = true
			node.view.layer.backgroundColor = nativeColor(value).CGColor
		} else if (name === 'borderRadius' && node.view) {
			node.styleRadius = value
			syncCornerRadius(node)
		} else if ((name === 'width' || name === 'height') && node.view) {
			setSizeConstraint(node, name, value)
		} else if (name === 'left' && node.view) {
			if (
				['gridlayout', 'absolutelayout'].includes((node.layoutParent ?? node.parent)?.type ?? '')
			) {
				queueLayoutReconcile(node.container, node.parent)
			}
		} else if ((name === 'translateX' || name === 'translateY' || name === 'zIndex') && node.view) {
			node.view.wantsLayer = true
			const layer = node.view.layer
			if (name === 'zIndex') {
				layer.zPosition = Number(value) || 0
			} else {
				// Core Animation layers use y-up coordinates; public drag deltas use y-down.
				layer.setValueForKeyPath(
					(Number(value) || 0) * (name === 'translateY' ? -1 : 1),
					name === 'translateY' ? 'transform.translation.y' : 'transform.translation.x',
				)
			}
		} else if (name === 'opacity' && node.view) {
			node.view.alphaValue = Number(value)
		} else if (
			name === 'fontWeight' &&
			['label', 'htmlview', 'textfield', 'textview', 'searchbar'].includes(node.type)
		) {
			node.styleFontWeight = String(value)
			syncNodeFont(node)
		} else if (name === 'textAlign' && node.type === 'label') {
			node.view!.alignment =
				value === 'left'
					? NSTextAlignment.Left
					: value === 'right'
						? NSTextAlignment.Right
						: NSTextAlignment.Center
		} else if (name === 'borderWidth' && node.view) {
			node.view.wantsLayer = true
			node.view.layer.borderWidth = Number(value)
		} else if (name === 'borderColor' && node.view) {
			node.view.wantsLayer = true
			node.view.layer.borderColor = nativeColor(value).CGColor
		} else if (MARGIN_SIDES[name] || name === 'margin') {
			setMarginStyle(node, name, value)
		} else {
			console.warn('[macos-style] ignored unsupported style.' + name + ' on <' + node.type + '>')
		}
	}

	node.appliedStyle = next
	syncStackLayout(node)
}

// `className` composes clsx-style on the DOM renderer and the NativeScript
// driver; this mirrors octane's `normalizeClass` (native dist must not import
// bare `octane`, and peers older than 0.11 predate the export) so a
// declarative array or object reaches the tokenizer instead of String(value)'s
// comma-join.
function normalizeClass(value: any): string {
	if (typeof value === 'string') {
		return value
	}

	if (typeof value !== 'object') {
		return typeof value === 'number' && value ? '' + value : ''
	}

	if (value === null) {
		return ''
	}

	let str = ''
	if (Array.isArray(value)) {
		for (const item of value) {
			if (item) {
				const inner = normalizeClass(item)
				if (inner) {
					str = str ? str + ' ' + inner : inner
				}
			}
		}
	} else {
		for (const key in value) {
			if (value[key]) {
				str = str ? str + ' ' + key : key
			}
		}
	}

	return str
}

function applyClassName(node: ElementNode, value: any) {
	const classes = normalizeClass(value).split(/\s+/).filter(Boolean)

	// Class effects re-derive from scratch on every apply: the class-owned
	// fields reset here and re-populate below, so removing a class drops the
	// native state it installed instead of leaving stale values behind.
	node.classFontSize = undefined
	node.classFontWeight = undefined
	node.classInsets = undefined
	node.classRadius = undefined
	node.classSpacing = undefined
	node.classOrientation = undefined
	node.colorSlot = undefined
	node.bgSlot = undefined

	if (node.type === 'label') {
		const grabber = classes.includes('vx-sheet-grabber')
		if (grabber) {
			node.classLineHeight = 24
			setSizeConstraint(node, 'height', 24)
		}

		const sizes: Record<string, number> = {
			'text-xs': 12,
			'text-sm': 13,
			'text-base': 16,
			'text-lg': 18,
			'text-xl': 20,
			'text-2xl': 28,
		}

		const lineHeights: Record<string, number> = {
			'text-sm': 20,
			'text-lg': 28,
			'text-xl': 28,
			'text-2xl': 36,
		}

		const headingMetrics: Record<string, { size: number; height: number }> = {
			'vx-h1': { size: 32, height: 41 },
			'vx-h2': { size: 24, height: 31 },
			'vx-h3': { size: 18.72, height: 25 },
			'vx-h4': { size: 16, height: 21 },
			'vx-h5': { size: 13.28, height: 17 },
			'vx-h6': { size: 10.72, height: 14 },
		}

		node.headingDefaultHeight = undefined
		node.classLineHeight = undefined
		for (const name of classes) {
			const heading = headingMetrics[name]
			if (heading) {
				node.classFontWeight = '700'
				node.classFontSize = heading.size
				node.headingDefaultHeight = heading.height
			}

			if (sizes[name]) {
				node.classFontSize = sizes[name]
				node.headingDefaultHeight = undefined
			}

			if (lineHeights[name] != null) {
				node.classLineHeight = lineHeights[name]
			}

			if (name === 'font-semibold') {
				node.classFontWeight = '600'
			}

			if (name === 'font-bold') {
				node.classFontWeight = '700'
			}

			if (name === 'text-muted') {
				node.colorSlot = 'muted'
			}

			if (name === 'text-onprimary') {
				node.colorSlot = 'onprimary'
			}
		}

		syncNodeFont(node)

		if (!grabber && node.props?.style?.height != null) {
			// The grabber's 24pt pin shares the height spec with style.height —
			// re-assert the style value once the class is gone.
			setSizeConstraint(node, 'height', node.props.style.height)
		}

		if (grabber) {
			node.view!.alignment = NSTextAlignment.Center
		} else {
			// Without the grabber the label returns to its textAlign — or the
			// Left default when no alignment style is in effect.
			const textAlign = node.props?.style?.textAlign
			node.view!.alignment =
				textAlign == null || textAlign === 'left'
					? NSTextAlignment.Left
					: textAlign === 'right'
						? NSTextAlignment.Right
						: NSTextAlignment.Center
		}
	}

	if (
		node.type === 'flexboxlayout' ||
		node.type === 'stacklayout' ||
		node.type === 'stack' ||
		node.type === 'scrollview' ||
		node.type === 'gridlayout'
	) {
		const gaps: Record<string, number> = {
			'gap-1': 4,
			'gap-2': 8,
			'gap-3': 12,
			'gap-4': 16,
			'gap-6': 24,
		}

		for (const name of classes) {
			if (gaps[name] !== undefined) {
				node.classSpacing = gaps[name]
			}

			if (name === 'flex-row') {
				node.classOrientation = NSUserInterfaceLayoutOrientation.Horizontal
			}

			if (name === 'flex-col') {
				node.classOrientation = NSUserInterfaceLayoutOrientation.Vertical
			}

			if (name === 'vx-toast' && node.type === 'flexboxlayout') {
				node.classInsets = { top: 12, right: 12, bottom: 12, left: 12 }
			}

			if (name === 'vx-toast-viewport') {
				node.classSpacing = 8
			}

			if (name === 'vx-button') {
				node.classOrientation = NSUserInterfaceLayoutOrientation.Horizontal
			}

			if (name === 'flex-1') {
				node.view!.setContentHuggingPriorityForOrientation(
					1,
					NSUserInterfaceLayoutOrientation.Vertical,
				)

				node.view!.setContentCompressionResistancePriorityForOrientation(
					1,
					NSUserInterfaceLayoutOrientation.Vertical,
				)
			}

			if (name === 'shrink-0') {
				node.view!.setContentHuggingPriorityForOrientation(
					750,
					NSUserInterfaceLayoutOrientation.Vertical,
				)
			}

			if (name === 'rounded-full' || name.startsWith('rounded-')) {
				node.classRadius = name === 'rounded-full' ? 12 : 8
			}

			if (name === 'bg-primary' || name === 'btn') {
				node.bgSlot = 'primary'
				node.classInsets = { top: 6, right: 10, bottom: 6, left: 10 }
			}

			if (name === 'bg-danger') {
				node.bgSlot = 'danger'
			}

			if (name === 'btn-secondary' || name === 'chip' || name === 'chip-off') {
				node.bgSlot = 'secondary'
				node.classInsets = { top: 4, right: 8, bottom: 4, left: 8 }
			}

			// Panels that paint the web body's --color-surface. On this host the
			// root view fills the window, so the surface slot re-themes the whole
			// background the way `body { background }` does in a browser.
			if (
				name === 'vx-app' ||
				name === 'sheet-panel' ||
				name === 'overlay-panel' ||
				name === 'modal-panel'
			) {
				node.bgSlot = 'surface'
			}
		}

		syncStackLayout(node)

		syncEdgeInsets(node)
		syncCornerRadius(node)
	}

	if (node.type === 'textfield' || node.type === 'textview') {
		if (classes.includes('vx-input') || classes.includes('vx-textarea')) {
			node.classFontSize = 14
			node.colorSlot = 'text'
			node.view!.drawsBackground = false
			if (node.type === 'textfield') {
				node.view!.bezeled = false
			}

			if (node.type === 'textview') {
				node.view!.textContainerInset = { width: 0, height: 0 }
			}
		}

		syncNodeFont(node)
	}

	applyThemeColors(node)
	// `dark`/`ns-dark` re-themes descendants too (the ns-dark cascade), so a
	// scheme flip on this node re-resolves the whole subtree.
	const dark = classes.includes('dark') || classes.includes('ns-dark')
	if (dark !== Boolean(node.hasDarkClass)) {
		node.hasDarkClass = dark
		for (const child of descendants(node)) {
			applyThemeColors(child)
		}
	}

	if (node.parent) {
		queueLayoutReconcile(node.container, node.parent)
	}

	updateStackDistribution(node)
}

function textContent(node: ElementNode): string {
	if (node.type === '#text') {
		return node.text
	}

	if (node.type === 'label') {
		return node.view!.stringValue
	}

	return node.children.map(textContent).join('')
}

// Keep the native value intact: AppKit truncates only when drawing in the frame.
function syncLabelOverflow(node: ElementNode) {
	const { maxLines, whiteSpace, textOverflow } = node.props
	if (whiteSpace != null && !['normal', 'nowrap'].includes(whiteSpace)) {
		throw new Error('[macos-host] label whiteSpace supports only normal and nowrap')
	}

	if (textOverflow != null && !['clip', 'ellipsis'].includes(textOverflow)) {
		throw new Error('[macos-host] label textOverflow supports only clip and ellipsis')
	}

	if (maxLines != null && (!Number.isInteger(maxLines) || maxLines < 0)) {
		throw new Error('[macos-host] label maxLines must be a non-negative integer')
	}

	const singleLine = whiteSpace === 'nowrap' || maxLines === 1
	const view = node.view as NSTextField

	view.maximumNumberOfLines = singleLine ? 1 : (maxLines ?? 0)
	view.cell.wraps = !singleLine
	view.cell.scrollable = false
	view.cell.usesSingleLineMode = singleLine
	view.cell.lineBreakMode = singleLine
		? textOverflow === 'ellipsis'
			? NSLineBreakMode.TruncatingTail
			: NSLineBreakMode.Clipping
		: NSLineBreakMode.WordWrapping

	view.cell.truncatesLastVisibleLine = !singleLine && textOverflow === 'ellipsis'
	view.invalidateIntrinsicContentSize()
}

function syncHtmlView(node: ElementNode) {
	const view = node.view!
	view.attributedStringValue = parseHtmlText(node.props.html ?? '', {
		fontSize: Number(view.font.pointSize),
		fontFamily: String(view.font.familyName),
		fontWeight: node.appliedFontWeight ?? '400',
		color: view.textColor,
		style: node.props.style ?? {},
	})

	view.invalidateIntrinsicContentSize()
	queueLayoutReconcile(node.container, node.parent)
}

function setLabelText(node: ElementNode, text: any) {
	const lineHeight = Number(node.props?.style?.lineHeight)
	if (!Number.isFinite(lineHeight) || lineHeight <= 0) {
		node.view!.stringValue = text
		return
	}

	const paragraphStyle = NSMutableParagraphStyle.alloc().init()
	paragraphStyle.lineBreakMode = (node.view as NSTextField).cell.lineBreakMode
	// An attributed string's own paragraph style governs rendering — carry
	// the control's alignment or textAlign silently renders left.
	paragraphStyle.alignment = node.view!.alignment
	paragraphStyle.minimumLineHeight = lineHeight
	paragraphStyle.maximumLineHeight = lineHeight
	node.view!.attributedStringValue = NSAttributedString.alloc().initWithStringAttributes(text, {
		[NSParagraphStyleAttributeName]: paragraphStyle,
		[NSFontAttributeName]: node.view!.font,
		[NSForegroundColorAttributeName]: node.view!.textColor,
	})
}

function syncText(parent: ElementNode | null | undefined) {
	while (parent && ['span', 'formattedstring'].includes(parent.type)) {
		parent = parent.parent
	}

	if (!parent || !['label', 'button', 'textfield', 'textview', 'searchbar'].includes(parent.type)) {
		return
	}

	const rich = parent.children.some(
		(child) => child.type === 'formattedstring' || child.type === 'span',
	)

	if (rich) {
		const view = parent.view!
		const attributed = composeAttributedText(
			parent.children,
			view,
			parent.props,
			fontForFamilyStyle,
			nativeColor,
			{
				fontFamily: parent.appliedFontFamily,
				fontSize: Number(view.font?.pointSize ?? (parent.type === 'label' ? 16 : 14)),
				fontWeight: parent.appliedFontWeight ?? 400,
				color: view.textColor,
			},
		)

		if (parent.type === 'button') {
			view.attributedTitle = attributed
		} else if (parent.type === 'textview') {
			view.textStorage.setAttributedString(attributed)
		} else {
			view.attributedStringValue = attributed
		}

		parent.formattedTextActive = true
		view.invalidateIntrinsicContentSize()
		if (parent.type === 'textview') {
			fitTextView(parent)
		}

		queueLayoutReconcile(parent.container, parent.parent)
		return
	}

	if (parent.type !== 'label' && !parent.formattedTextActive) {
		return
	}

	parent.formattedTextActive = false
	const text = parent.children.length
		? parent.children.map(textContent).join('')
		: String(parent.props?.text ?? '')

	if (parent.type === 'label') {
		setLabelText(parent, text)
	} else if (parent.type === 'button') {
		parent.view!.title = text
	} else if (parent.type === 'textview') {
		parent.view!.string = text
	} else {
		parent.view!.stringValue = text
	}

	parent.view!.invalidateIntrinsicContentSize()
}

function dispatchTextEvent(node: ElementNode | undefined, name: string) {
	if (!node) {
		return
	}

	if (name === 'onFocus' || name === 'onBlur') {
		const focused = name === 'onFocus'
		if (Boolean(node.textFocused) === focused) {
			return
		}

		node.textFocused = focused
	}

	const handler = node.props[name]
	if (typeof handler !== 'function') {
		return
	}

	try {
		node!.container.root!.eventScope('discrete', handler)
	} catch (error) {
		console.error('[macos-event] text ' + name + ' handler failed', error)
	}
}

/** NSSecureTextField can host either cell; an ordinary NSTextField cannot host a secure
 *  editor. Keep the secure-capable view mounted and swap its cell to retain refs/layout. */
function syncSecureTextField(node: ElementNode) {
	const secure = Boolean(node.props.secure)
	if (secure === node.secureMode) {
		return
	}

	const field = node.view!
	const editor = field.currentEditor()
	const selection = editor?.selectedRange
	const window = field.window
	const focused = editor != null && window != null
	const value = String(editor?.string ?? field.stringValue ?? '')
	const previous = field.cell
	if (focused) {
		window.makeFirstResponder(null)
	}

	const cell = (secure ? InteractionSecureTextFieldCell : InteractionTextFieldCell)
		.alloc()
		.initTextCell(value)

	for (const name of [
		'font',
		'textColor',
		'alignment',
		'editable',
		'selectable',
		'enabled',
		'bezeled',
		'bordered',
		'drawsBackground',
		'backgroundColor',
		'sendsActionOnEndEditing',
		'target',
		'action',
		'tag',
	]) {
		;(cell as any)[name] = (previous as any)[name]
	}

	field.cell = cell
	field.stringValue = value
	node.secureMode = secure
	if (focused) {
		window.makeFirstResponder(field)
		if (selection) {
			const editor = field.currentEditor()
			if (editor) {
				editor.selectedRange = selection
			}
		}
	}
}

/** Measure wrapped content with AppKit, then size the viewport rather than truncate text. */
function fitTextView(node: ElementNode | undefined) {
	if (!node?.textViewport || node.fittingText) {
		return
	}

	node.fittingText = true
	try {
		const view = node.view!
		const viewport = node.textViewport
		const width = Number(viewport.contentView.bounds.size.width)
		if (width > 0) {
			view.textContainer.containerSize = { width, height: Number.MAX_SAFE_INTEGER }
		}

		view.layoutManager.ensureLayoutForTextContainer(view.textContainer)
		const used = view.layoutManager.usedRectForTextContainer(view.textContainer)
		const font = view.font
		const measured = Number(font?.ascender) - Number(font?.descender) + Number(font?.leading)
		const line = Math.max(
			1,
			Math.round(
				measured > 0 ? measured : Number(font?.pointSize ?? 14) * DEFAULT_TEXT_LINE_HEIGHT_RATIO,
			),
		)

		const rows = Math.max(1, Math.floor(Number(node.props.rows) || (node.props.autoGrow ? 1 : 3)))
		const cap =
			Number(node.props.maxRows) > 0
				? Math.max(rows, Math.floor(Number(node.props.maxRows))) * line
				: Infinity

		// TextKit's used rect excludes the extra fragment after a trailing newline.
		const extra = view.layoutManager.extraLineFragmentRect
		const content = Math.max(
			line,
			Math.ceil(Number(used.origin?.y ?? 0) + Number(used.size.height)),
			Math.ceil(Number(extra?.origin?.y ?? 0) + Number(extra?.size?.height ?? 0)),
		)

		const height = node.props.autoGrow ? Math.min(cap, Math.max(rows * line, content)) : rows * line
		if (node.props.style?.height == null && node.sizeConstraintSpecs?.height?.points !== height) {
			setSizeConstraint(node, 'height', height)
		}

		const visibleHeight = Number(viewport.contentView.bounds.size.height) || height
		view.minSize = { width: 0, height: visibleHeight }
		view.setFrameSize({
			width: width || Number(view.frame.size.width),
			height: Math.max(visibleHeight, content),
		})
	} finally {
		node.fittingText = false
	}
}

function syncTextViewPlaceholder(node: ElementNode | undefined) {
	if (node?.placeholderView) {
		node.placeholderView.hidden = String(node.view!.string ?? '').length > 0
	}
}

function setAction(node: ElementNode, value: any) {
	if (node.actionId === undefined) {
		node.actionId = nextActionId++
		actionIdsByView.set(node.view!, node.actionId)
		actionHandlers.set(node.actionId, null)
		node.view!.addGestureRecognizer(
			configureGesture(
				NSClickGestureRecognizer.alloc().initWithTargetAction(buttonActionTarget, 'viewPressed:'),
			),
		)
	}

	actionHandlers.set(
		node.actionId,
		typeof value === 'function'
			? () => {
					try {
						if (!node.props.disabled) {
							node.container.root!.eventScope('discrete', value)
						}
					} catch (error) {
						console.error('[macos-event] press handler failed', error)
					}
				}
			: null,
	)
}

function setPanAction(node: ElementNode, _value: any) {
	const enabled =
		!node.props.disabled &&
		(typeof node.props.onPan === 'function' || typeof node.props.onSwipe === 'function')

	if (enabled && !node.panGestureRecognizer) {
		node.panGestureRecognizer = configureGesture(
			NSPanGestureRecognizer.alloc().initWithTargetAction(buttonActionTarget, 'viewPanned:'),
		)

		node.view!.addGestureRecognizer(node.panGestureRecognizer)
	}

	if (node.panGestureRecognizer) {
		node.panGestureRecognizer.enabled = enabled
	}

	panHandlersByView.set(
		node.view!,
		enabled
			? (event: PanEvent) => {
					if (node.props.disabled) {
						return
					}

					try {
						node.container.root!.eventScope('discrete', () => {
							node.props.onPan?.(event)
							const direction = swipeDirection(event)
							if (direction !== null && !node.props.disabled) {
								node.props.onSwipe?.({ direction })
							}
						})
					} catch (error) {
						console.error('[macos-event] pan/swipe handler failed', error)
					}
				}
			: null,
	)
}

function setControlAction(node: ElementNode, value: any, readValue: () => any) {
	if (node.actionId === undefined) {
		return
	}

	actionHandlers.set(
		node.actionId,
		typeof value === 'function'
			? () => {
					try {
						node.container.root!.eventScope('discrete', () => value(readValue()))
					} catch (error) {
						console.error('[macos-event] control handler failed', error)
					}
				}
			: null,
	)
}

/** Return-key submission for single-line fields, invoked by the field's
 *  target/action — kept distinct from per-edit `onTextChange`. */
function setTextSubmitAction(node: ElementNode, value: any) {
	node.submitHandler =
		typeof value === 'function'
			? () => {
					try {
						node.container.root!.eventScope('discrete', value)
					} catch (error) {
						console.error('[macos-event] text submit handler failed', error)
					}
				}
			: null
}

/** `isEnabled`/`editable` → AppKit state. Disabled fields reject edits and
 *  selection; read-only fields stay selectable so text can be copied. */
function syncTextControlState(node: ElementNode) {
	const enabled = node.props.isEnabled !== false && node.props.enabled !== false
	const editable = enabled && node.props.editable !== false
	const view = node.view!
	if (node.type === 'textfield') {
		view.enabled = enabled
	}

	const textTarget = view as any
	textTarget.editable = editable
	textTarget.selectable = editable || enabled
}

function applyAccessibility(node: ElementNode, name: string, value: any) {
	if (['flexboxlayout', 'stacklayout'].includes(node.type) && node.actionId !== undefined) {
		const props = stackAccessibilityPropsByView.get(node.view!) ?? {}
		stackAccessibilityPropsByView.set(node.view!, { ...props, [name]: value })
		if (name === 'accessibilityLabel') {
			accessibilityLabels.set(node.actionId!, String(value ?? ''))
		}

		if (name === 'accessibilityRole') {
			accessibilityRoles.set(node.actionId!, String(value ?? ''))
		}
	}

	if (['label', 'htmlview'].includes(node.type) && name === 'accessibilityLabel') {
		node.view!.setAccessibilityLabel?.(String(value ?? ''))
	}

	if (['textfield', 'textview', 'searchbar'].includes(node.type)) {
		if (name === 'accessibilityLabel') {
			node.view!.setAccessibilityLabel?.(String(value ?? ''))
		} else if (name === 'accessibilityHint') {
			node.view!.setAccessibilityHint?.(String(value ?? ''))
		} else if (name === 'accessible') {
			node.view!.setAccessibilityElement?.(value !== false)
		} else if (name === 'accessibilityState' && node.type === 'textview') {
			// NSTextField reports AX enabled through its `enabled` flag;
			// NSTextView has no enabled state, so it is mirrored here.
			node.view!.setAccessibilityEnabled?.(value?.disabled !== true)
		}
	}
}

/** Host updates carry the complete next prop bag, but applyProps merges — a
 *  key that vanishes would keep its last value forever. Every dropped key
 *  with a recorded value gets an explicit `undefined` clear: node.props then
 *  reads it as removed and each handler resets the native state the prop
 *  installed (sync readers consult the merged bag; writers map `?? default`).
 *  A prior `undefined`/`null` applied nothing, so it needs no clear. */
function droppedPropClears(node: ElementNode, next: PropBag): PropBag {
	const clears: PropBag = {}
	for (const name of Object.keys(node.props)) {
		if (node.props[name] != null && !(name in next)) {
			clears[name] = undefined
		}
	}

	const authored = node.authoredProps
	if (authored !== undefined) {
		for (const name of Object.keys(authored)) {
			if (authored[name] != null && !(name in next) && !(name in clears)) {
				clears[name] = undefined
			}
		}
	}

	return clears
}

function applyProps(node: ElementNode, props: PropBag) {
	if (node.type === 'timepicker') {
		validateNodeProps(node.type, props)
	}

	node.props = { ...node.props, ...props }
	if (
		node.authoredProps ||
		node.parent?.type === 'proxyviewcontainer' ||
		node.type === 'proxyviewcontainer'
	) {
		node.authoredProps = { ...node.authoredProps, ...props }
	}

	if (node.type === 'tabviewitem') {
		syncTabItem(node)
		return
	}

	if (node.type === 'segmentedbaritem') {
		if (node.parent) {
			syncSegmentedBar(node.parent)
		}

		return
	}

	if (node.type === 'proxyviewcontainer') {
		queueLayoutReconcile(node.container, node)
		return
	}

	if (node.type === '#text') {
		if ('value' in props) {
			node.text = String(props.value ?? '')
		}

		syncText(node.parent)
		return
	}

	if (node.type === 'span' || node.type === 'formattedstring') {
		syncText(node.parent)
		return
	}

	const layoutChildProps: Record<string, readonly string[]> = {
		absolutelayout: ['left', 'top', 'right', 'bottom'],
		rootlayout: ['row', 'col', 'rowSpan', 'colSpan', 'horizontalAlignment', 'verticalAlignment'],
		wraplayout: ['horizontalAlignment', 'verticalAlignment'],
		docklayout: ['dock', 'horizontalAlignment', 'verticalAlignment'],
		contentview: ['horizontalAlignment', 'verticalAlignment'],
		stacklayout: ['horizontalAlignment', 'verticalAlignment'],
		gridlayout: ['row', 'col', 'rowSpan', 'colSpan', 'horizontalAlignment', 'verticalAlignment'],
	}

	for (const [name, value] of Object.entries(props)) {
		if (
			(node.layoutParent ?? node.parent) &&
			layoutChildProps[(node.layoutParent ?? node.parent)!.type]?.includes(name)
		) {
			continue
		}

		if (['flexboxlayout', 'stack', 'stacklayout'].includes(node.type) && isStackLayoutInput(name)) {
			continue
		}

		if (
			node.type === 'stacklayout' &&
			['orientation', 'horizontalAlignment', 'verticalAlignment'].includes(name)
		) {
			continue
		}

		// Attached alignment metadata is retained before the batch inserts
		// the child; its parent consumes it during layout reconciliation.
		if (!node.parent && ['dock', 'horizontalAlignment', 'verticalAlignment'].includes(name)) {
			continue
		}

		if (name === 'onLayoutChanged') {
			setLayoutAction(node, value)
			continue
		}

		if (['flexboxlayout', 'stacklayout', 'gridlayout', 'absolutelayout'].includes(node.type)) {
			if (['onTouch', 'onLongPress', 'onDoubleTap'].includes(name)) {
				setPressGesture(node, name)
				continue
			}

			if (name === 'onSwipe') {
				setPanAction(node, value)
				continue
			}

			if (name === 'disabled') {
				setPanAction(node, node.props.onPan)
				for (const event of ['onTouch', 'onLongPress', 'onDoubleTap']) {
					setPressGesture(node, event)
				}

				continue
			}
		}

		switch (node.type) {
			case 'wraplayout':
				if (['orientation', 'itemWidth', 'itemHeight'].includes(name)) {
					continue
				}
			case 'docklayout':
				if (name === 'stretchLastChild') {
					continue
				}
			// Common styling uses the same reconciliation as ContentView.
			case 'rootlayout':
			case 'contentview':
				if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name !== 'id' && value !== undefined) {
					console.warn('[macos-host] ignored ' + node.type + ' prop ' + name)
				}

				break
			case 'stack':
				if (name === 'spacing') {
					syncStackLayout(node)
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'id') {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored stack prop ' + name)
				}

				break
			case 'stacklayout':
			case 'flexboxlayout':
				if (name === 'spacing') {
					syncStackLayout(node)
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'id') {
					continue
				} else if (
					name === 'onTap' ||
					(node.type === 'stacklayout' && ['onClick', 'onPress'].includes(name))
				) {
					const handler =
						node.type === 'stacklayout'
							? (node.props.onTap ?? node.props.onClick ?? node.props.onPress)
							: value

					setAction(
						node,
						node.type === 'stacklayout' && typeof handler === 'function'
							? () => handler({ eventName: 'tap', object: node.view })
							: handler,
					)
				} else if (name === 'onPan') {
					setPanAction(node, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (
					[
						'alignItems',
						'justifyContent',
						'flexWrap',
						'flexGrow',
						'flexShrink',
						'alignSelf',
						'order',
					].includes(name)
				) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored flexboxlayout prop ' + name)
				}

				break
			case 'gridlayout':
				if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className' || name === 'id') {
					continue
				} else if (name === 'overlayChildren') {
					continue
				} else if (name === 'disabled') {
					continue
				} else if (name === 'onPan') {
					setPanAction(node, value)
				} else if (name === 'onAccessibilityIncrement' || name === 'onAccessibilityDecrement') {
					continue
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (['rows', 'columns'].includes(name)) {
					queueLayoutReconcile(node.container, node)
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored gridlayout prop ' + name)
				}

				break
			case 'absolutelayout':
				if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className' || name === 'id') {
					continue
				} else if (name === 'onPan') {
					setPanAction(node, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored absolutelayout prop ' + name)
				}

				break
			case 'tabview':
				if (
					[
						'items',
						'selectedIndex',
						'onSelectedIndexChange',
						'onSelectedIndexChanged',
						'id',
					].includes(name)
				) {
					continue
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored tabview prop ' + name)
				}

				break
			case 'segmentedbar':
				if (['items', 'selectedIndex', 'onSelectedIndexChange', 'id'].includes(name)) {
					continue
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored segmentedbar prop ' + name)
				}

				break
			case 'listview':
				if (
					[
						'items',
						'renderItem',
						'itemTemplate',
						'itemTemplates',
						'separatorColor',
						'onItemTap',
						'onItemLoading',
						'onLoadMoreItems',
						'id',
					].includes(name)
				) {
					continue
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored listview prop ' + name)
				}

				break
			case 'listpicker':
				if (['items', 'selectedIndex', 'onSelectedIndexChange', 'id'].includes(name)) {
					continue
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored listpicker prop ' + name)
				}

				break
			case 'timepicker':
				if (
					[
						'time',
						'hour',
						'minute',
						'minHour',
						'minMinute',
						'maxHour',
						'maxMinute',
						'isEnabled',
						'onTimeChange',
						'id',
					].includes(name)
				) {
					continue
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored timepicker prop ' + name)
				}

				break
			case 'datepicker':
				if (
					[
						'date',
						'minDate',
						'maxDate',
						'year',
						'month',
						'day',
						'isEnabled',
						'onDateChange',
						'id',
					].includes(name)
				) {
					continue
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored datepicker prop ' + name)
				}

				break
			case 'progress':
				if (['value', 'maxValue', 'id'].includes(name)) {
					continue
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored progress prop ' + name)
				}

				break
			case 'activityindicator':
				if (name === 'busy' || name === 'id') {
					continue
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored activityindicator prop ' + name)
				}

				break
			case 'htmlview':
				if (name === 'html' || name === 'id') {
					continue // parse once after all font/color sources reconcile
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored htmlview prop ' + name)
				}

				break
			case 'label':
				if (name === 'text') {
					setLabelText(node, String(value ?? ''))
				} else if (name === 'fontSize') {
					node.propFontSize = Number(value ?? 16)
					syncNodeFont(node)
				} else if (name === 'style') {
					applyStyle(node, value)
					syncText(node)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'id') {
					continue
				} else if (['maxLines', 'whiteSpace', 'textOverflow'].includes(name)) {
					continue
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored label prop ' + name)
				}

				break
			case 'button':
				if (name === 'title') {
					node.view!.title = String(value ?? '')
				} else if (name === 'enabled') {
					node.view!.enabled = value !== false
				} else if (name === 'onPress') {
					actionHandlers.set(
						node.actionId!,
						typeof value === 'function'
							? () => {
									try {
										node.container.root!.eventScope('discrete', value)
									} catch (error) {
										console.error('[macos-event] button handler failed', error)
									}
								}
							: null,
					)
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className' || name === 'id') {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored button prop ' + name)
				}

				break
			case 'scrollview':
				if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'accessibilityLabel') {
					node.view!.setAccessibilityLabel?.(String(value ?? ''))
				} else if (name === 'scrollBarIndicatorVisible') {
					configureScrollAxes(node)
				} else if (
					name === 'id' ||
					name === 'horizontal' ||
					name === 'orientation' ||
					name === 'showsVerticalScrollIndicator'
				) {
					continue
				} else if (name === 'onScroll') {
					setScrollAction(node, value)
				} else if (name.startsWith('on')) {
					if (typeof value === 'function') {
						console.warn('[macos-host] ' + name + ' is unsupported on ScrollView')
					}
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored scrollview prop ' + name)
				}

				break
			case 'searchbar':
				if (name === 'text' || name === 'hint' || name === 'onTextChange') {
					continue // reconciled after binding the entire next prop bag
				} else if (name === 'onSubmit') {
					setTextSubmitAction(
						node,
						typeof value === 'function'
							? () => value({ eventName: 'submit', object: node.view })
							: null,
					)
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'id') {
					continue
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored searchbar prop ' + name)
				}

				break
			case 'textfield':
			case 'textview':
				if (name === 'value') {
					if (value === undefined) {
						continue
					}

					if (node.type === 'textview') {
						node.view!.string = String(value ?? '')
						syncTextViewPlaceholder(node)
					} else {
						node.view!.stringValue = String(value ?? '')
					}
				} else if (name === 'placeholder') {
					if (node.type === 'textfield') {
						continue
					} else if (node.placeholderView) {
						node.placeholderView.stringValue = String(value ?? '')
						syncTextViewPlaceholder(node)
					}
				} else if (name === 'placeholderTextColor' && node.type === 'textfield') {
					continue
				} else if (name === 'onTextChange') {
					setControlAction(node, value, () =>
						String(node.type === 'textview' ? node.view!.string : (node.view!.stringValue ?? '')),
					)
				} else if (name === 'onSubmit') {
					if (node.type === 'textfield') {
						setTextSubmitAction(node, value)
					}
				} else if (name === 'editable' || name === 'isEnabled' || name === 'enabled') {
					syncTextControlState(node)
				} else if (name === 'secure') {
					if (node.type !== 'textfield' && value) {
						console.warn(
							'[macos-host] secure is unsupported on <' + node.type + '>; rendering plain text',
						)
					}
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'id') {
					continue
				} else if (['onFocus', 'onBlur', 'onSubmit'].includes(name)) {
					continue
				} else if (name === 'rows' && node.type === 'textview') {
					continue
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (['keyboardType', 'returnKeyType', 'autoGrow', 'maxRows'].includes(name)) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored text control prop ' + name)
				}

				break
			case 'switch':
				if (name === 'checked') {
					node.view!.state = value ? 1 : 0
				} else if (name === 'onCheckedChange') {
					setControlAction(node, value, () => node.view!.state === 1)
				} else if (name === 'disabled') {
					node.view!.enabled = value !== true
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className' || name === 'id') {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored switch prop ' + name)
				}

				break
			case 'slider':
				if (name === 'value') {
					node.view!.doubleValue = Number(value ?? 0)
				} else if (name === 'minValue') {
					node.view!.minValue = Number(value ?? 0)
				} else if (name === 'maxValue') {
					node.view!.maxValue = Number(value ?? 1)
				} else if (name === 'onValueChange') {
					setControlAction(node, value, () => Number(node.view!.doubleValue))
				} else if (name === 'disabled') {
					node.view!.enabled = value !== true
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className' || name === 'id') {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored slider prop ' + name)
				}

				break
			case 'webview':
				if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'accessibilityLabel') {
					node.view!.accessibilityLabel = String(value ?? '')
				} else if (name === 'accessible') {
					node.view!.accessibilityElement = value !== false
				} else if (name === 'accessibilityHint') {
					node.view!.accessibilityHelp = String(value ?? '')
				}

				break
			case 'image':
				if (name === 'src') {
					updateImage(node.view as NSImageView, value)
				} else if (name === 'style') {
					applyStyle(node, value)
				} else if (name === 'className' || name === 'id' || name === 'alt') {
					continue
				} else if (name === 'accessibilityLabel') {
					node.view!.accessibilityLabel = String(value ?? '')
					node.view!.accessibilityElement = !!value
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored image prop ' + name)
				}

				break
		}
	}

	if (
		node.type === 'stacklayout' ||
		(['flexboxlayout', 'stack'].includes(node.type) && Object.keys(props).some(isStackLayoutInput))
	) {
		syncStackLayout(node)
	}

	if (node.type === 'webview') {
		updateWebView(node, props, (height) => {
			node.props.style = { ...node.props.style, height }
			setSizeConstraint(node, 'height', height)
		})
	}

	if (node.type === 'textfield') {
		syncSecureTextField(node)
		node.view!.enabled = node.props.isEnabled !== false && node.props.enabled !== false
		node.view!.editable = node.view!.enabled && node.props.editable !== false
		setTextFieldPlaceholder(node.view as NSTextField, node.props, nodeScheme(node))
	}

	if (node.type === 'label') {
		syncLabelOverflow(node)
		syncText(node)
		const style = node.props.style ?? {}
		if (
			style.height == null &&
			node.props.maxLines != null &&
			node.props.maxLines !== 1 &&
			node.props.whiteSpace !== 'nowrap'
		) {
			setSizeConstraint(node, 'height', undefined)
		} else if (style.lineHeight == null && style.height == null) {
			const size = Number(node.view!.font?.pointSize ?? 16)
			const height =
				style.fontSize == null && node.headingDefaultHeight != null
					? node.headingDefaultHeight
					: (node.classLineHeight ?? Math.ceil(size * DEFAULT_TEXT_LINE_HEIGHT_RATIO))

			setSizeConstraint(node, 'height', height)
		}
	}

	if (node.type === 'tabview') {
		syncTabView(node)
	}

	if (node.type === 'segmentedbar') {
		syncSegmentedBar(node)
	}

	if (node.type === 'listpicker') {
		syncListPicker(node)
	}

	if (node.type === 'listview') {
		updateListView(node.view!, node.props)
	}

	if (node.type === 'datepicker') {
		syncDatePicker(node, props)
	}

	if (node.type === 'timepicker') {
		syncTimePicker(node, props)
	}

	if (node.type === 'activityindicator') {
		syncActivityIndicator(node)
	}

	if (node.type === 'progress') {
		syncProgress(node)
	}

	if (node.type === 'htmlview') {
		syncHtmlView(node)
	}

	if (node.type === 'searchbar') {
		syncSearchBar(node, props)
	}

	if (node.type === 'textview') {
		node.view!.editable = node.props.isEnabled !== false && node.props.editable !== false
		fitTextView(node)
	}

	if (
		node.type === 'scrollview' &&
		(!node.scrollAxisConstraints || 'orientation' in props || 'horizontal' in props)
	) {
		configureScrollAxes(node)
		queueLayoutReconcile(node.container, node)
	}

	if (node.type === 'wraplayout') {
		setWrapSizingPriorities(node)
	}

	if (
		[
			'gridlayout',
			'absolutelayout',
			'contentview',
			'docklayout',
			'wraplayout',
			'rootlayout',
		].includes(node.type)
	) {
		queueLayoutReconcile(node.container, node)
	} else if (
		node.parent?.type === 'gridlayout' ||
		node.parent?.type === 'absolutelayout' ||
		node.parent?.type === 'rootlayout' ||
		node.parent?.type === 'wraplayout' ||
		node.parent?.type === 'stacklayout' ||
		node.parent?.type === 'contentview' ||
		node.parent?.type === 'docklayout'
	) {
		queueLayoutReconcile(node.container, node.parent)
	}

	if (node.parent?.type === 'proxyviewcontainer') {
		queueLayoutReconcile(node.container, node.parent)
	}

	// Container children also reconcile their own subtree. Their size updates
	// must still notify the outer DockLayout or WrapLayout.
	if (
		node.parent?.type === 'docklayout' ||
		node.parent?.type === 'wraplayout' ||
		node.parent?.type === 'rootlayout'
	) {
		queueLayoutReconcile(node.container, node.parent)
	}

	if (node.children?.some((child) => child.type === 'formattedstring' || child.type === 'span')) {
		syncText(node)
	}
}

// NativeScript ProxyViewContainer's attached layout-property inventory.
// These are forwarded to children; explicit child values retain precedence.
const PROXY_LAYOUT_PROPS = [
	'left',
	'top',
	'dock',
	'flexDirection',
	'flexWrap',
	'justifyContent',
	'alignItems',
	'alignContent',
	'order',
	'flexGrow',
	'flexShrink',
	'flexWrapBefore',
	'alignSelf',
	'flexFlow',
	'flex',
	'column',
	'columnSpan',
	'col',
	'colSpan',
	'row',
	'rowSpan',
] as const

function projectedViews(parent: ElementNode): ElementNode[] {
	const children =
		parent.type === 'contentview'
			? parent.contentChild
				? [parent.contentChild]
				: []
			: parent.children

	return children.flatMap((child: ElementNode) => {
		if (child.props.visibility === 'collapse') {
			return []
		}

		if (child.type === 'proxyviewcontainer') {
			return projectedViews(child)
		}

		return child.view ? [child] : []
	})
}

function releaseProjectedView(node: ElementNode) {
	if (node.crossAxisConstraint) {
		node.crossAxisConstraint.active = false
	}

	node.crossAxisConstraint = null
	deactivateSizeConstraints(node)
	releasePlacementPins(node)
	const parent = node.layoutParent
	const view = parent?.childHost ?? parent?.view
	if (arrangedView(node)?.superview === view) {
		view?.removeArrangedSubview?.(arrangedView(node))
	}

	arrangedView(node)?.removeFromSuperview()
	node.layoutParent = null
	if (node.authoredProps) {
		for (const name of PROXY_LAYOUT_PROPS) {
			if (node.props[name] !== node.authoredProps[name]) {
				node.props[name] = node.authoredProps[name]
			}
		}
	}
}

function syncProxyProjection(parent: ElementNode) {
	const children = projectedViews(parent)
	if (parent.type === 'contentview' && children.length > 1) {
		throw new Error(
			'AppKit <contentview> cannot project multiple ProxyViewContainer layout children',
		)
	}

	const previous = parent.projectedChildren ?? []
	for (const child of previous) {
		if (!children.includes(child) && child.layoutParent === parent) {
			releaseProjectedView(child)
		}
	}

	parent.projectedChildren = children
	const host = parent.childHost ?? parent.view
	const manual = [
		'gridlayout',
		'absolutelayout',
		'contentview',
		'docklayout',
		'wraplayout',
		'rootlayout',
		'#root',
		'portalroot',
	].includes(parent.type)

	for (const child of children) {
		// Preserve authored values separately from the parent's forwarded values.
		child.authoredProps ??= { ...child.props }
		const chain: ElementNode[] = []
		for (let owner = child.parent; owner?.type === 'proxyviewcontainer'; owner = owner.parent) {
			chain.push(owner)
		}

		const forwarded: PropBag = {}
		for (const owner of chain.reverse()) {
			for (const name of PROXY_LAYOUT_PROPS) {
				if (owner.props[name] != null) {
					forwarded[name] = owner.props[name]
				}
			}
		}

		const changes: PropBag = {}
		for (const name of PROXY_LAYOUT_PROPS) {
			const next = child.authoredProps[name] ?? forwarded[name]
			if (next !== child.props[name]) {
				changes[name] = next
				child.props[name] = next
			}
		}

		child.layoutParent = parent
		if (
			['flexboxlayout', 'stack', 'stacklayout'].includes(child.type) &&
			Object.keys(changes).length
		) {
			// Apply container-layout properties to the actual host as well as its
			// placement metadata. Do not overwrite the authored prop snapshot.
			syncStackLayout(child)
		}

		if (manual) {
			child.marginHost?.removeFromSuperview()
			child.marginHost = null
			child.marginConstraints = null
			if (layoutView(child).superview !== host) {
				host!.addSubview(layoutView(child))
			}

			layoutView(child).translatesAutoresizingMaskIntoConstraints = false
			deactivateSizeConstraints(child)
			if (parent.type === '#root') {
				pinLayoutChild(
					child,
					host,
					0,
					0,
					Number(host!.bounds.size.width),
					Number(host!.bounds.size.height),
				)
			}
		} else {
			if (marginInsetsOf(child) && !child.marginHost) {
				makeMarginHost(child)
			}
		}

		syncScheme(child)
	}

	if (manual && host?.addSubviewPositionedRelativeTo) {
		const views = children.map(layoutView)
		const native = host.subviews
		const count = native.count
		const actual = Array.from({ length: Number(count) }, (_, index) =>
			native.objectAtIndex(index),
		).filter((view) => views.includes(view))

		if (views.some((view, index) => view !== actual[index])) {
			let previous: NSView | null = null
			for (const view of views) {
				host.addSubviewPositionedRelativeTo(view, NSWindowOrderingMode.Above, previous)
				previous = view
			}
		}
	}

	if (!manual) {
		moveStackChildren(parent)
	}
}

/** Simulate logical ownership and ContentView's current slot before applying
 * a batch. A proxy may be empty when inserted and gain its children later in
 * that same batch; checking only the insert command misses that failure. */
function validateProxyTree(container: RootContainer, commands: readonly UniversalHostCommand[]) {
	if (
		![...container.nodes.values()].some((node) => node.type === 'proxyviewcontainer') &&
		!commands.some((command) => 'type' in command && command.type === 'proxyviewcontainer')
	) {
		return
	}

	const nodes = new Map<
		number,
		{
			type: string
			props: PropBag
			children: number[]
			parent: UniversalHostParent
			slot?: number | null
		}
	>()

	for (const node of container.nodes.values()) {
		nodes.set(node.id, {
			type: node.type,
			props: node.props,
			children: node.children.map((child) => child.id),
			parent: parentReference(node.parent),
			slot: node.contentChild?.id ?? null,
		})
	}

	const unlink = (id: number) => {
		const node = nodes.get(id)
		const parent =
			node?.parent == null || typeof node.parent !== 'number' ? null : nodes.get(node.parent)

		if (parent) {
			parent.children = parent.children.filter((child) => child !== id)
			if (parent.slot === id) {
				parent.slot = null
			}
		}

		if (node) {
			node.parent = null
		}
	}

	for (const command of commands) {
		if (command.op === 'create' || command.op === 'recreate') {
			const old = nodes.get(command.id)
			nodes.set(command.id, {
				type: command.type,
				props: command.props,
				children: [],
				parent: old?.parent ?? null,
			})
		} else if (command.op === 'update') {
			const node = nodes.get(command.id)
			if (node) {
				node.props = command.props
			}
		} else if (command.op === 'insert' || command.op === 'move') {
			unlink(command.id)
			const node = nodes.get(command.id)!,
				parent = typeof command.parent === 'number' ? nodes.get(command.parent) : null

			node.parent = command.parent
			if (parent) {
				const index = parent.children.indexOf(command.before!)
				parent.children.splice(index < 0 ? parent.children.length : index, 0, command.id)
				if (parent.type === 'contentview') {
					parent.slot = command.id
				}
			}
		} else if (command.op === 'remove') {
			if (Object.is(nodes.get(command.id)?.parent, command.parent)) {
				unlink(command.id)
			}
		} else if (command.op === 'destroy') {
			unlink(command.id)
			nodes.delete(command.id)
		}
	}

	const count = (id: number, seen = new Set<number>()): number => {
		if (seen.has(id)) {
			throw new Error('AppKit ProxyViewContainer ownership cycle')
		}

		const node = nodes.get(id)
		if (!node || node.props.visibility === 'collapse') {
			return 0
		}

		if (node.type !== 'proxyviewcontainer') {
			return typeHasView(node.type) ? 1 : 0
		}

		return node.children.reduce((sum, child) => sum + count(child, new Set([...seen, id])), 0)
	}

	for (const [id, node] of nodes) {
		if (node.type === 'contentview' && node.slot != null && count(node.slot) > 1) {
			throw new Error(
				'AppKit <contentview> cannot project multiple ProxyViewContainer layout children',
			)
		}

		if (node.type === 'proxyviewcontainer') {
			count(id)
			for (const child of node.children) {
				const type = nodes.get(child)?.type
				if (type === '#text' || type === 'span') {
					throw new Error('AppKit <proxyviewcontainer> cannot contain text-only children')
				}
			}
		}
	}
}

function detach(container: RootContainer, node: ElementNode, preserveTab = false) {
	const previousParent = node.parent
	if (node.type === 'tabviewitem' && !preserveTab) {
		detachTabItem(node)
	}

	const physicalParent = node.layoutParent ?? previousParent
	if (node.layoutParent) {
		releaseProjectedView(node)
	}

	if (node.type === 'proxyviewcontainer') {
		for (const child of projectedViews(node)) {
			releaseProjectedView(child)
		}
	}

	const siblings = previousParent?.children ?? container.children
	const index = siblings.indexOf(node)
	if (index >= 0) {
		siblings.splice(index, 1)
	}

	if (node.crossAxisConstraint) {
		node.crossAxisConstraint.active = false
	}

	node.crossAxisConstraint = null
	deactivateSizeConstraints(node)
	releasePlacementPins(node)
	if (node.view) {
		const parentView = physicalParent?.childHost ?? physicalParent?.view
		if (parentView?.removeArrangedSubview && arrangedView(node)?.superview === parentView) {
			parentView.removeArrangedSubview(arrangedView(node))
		}

		arrangedView(node).removeFromSuperview()
	}

	if (previousParent?.type === 'contentview' && previousParent.contentChild === node) {
		previousParent.contentChild = null
		previousParent.view!.invalidateIntrinsicContentSize()
	}

	queueLayoutReconcile(container, previousParent)
	syncText(previousParent)
	if (previousParent?.type === 'tabview') {
		syncTabView(previousParent)
	}

	if (previousParent?.type === 'segmentedbar') {
		syncSegmentedBar(previousParent)
	}

	node.parent = null
	node.layoutParent = null
}

/** Mark a parent for one sibling-wide reconcile after the batch's commands.
 *  Insert/remove/update each used to rescan siblings, rebuild distribution,
 *  and recreate every child's cross-axis constraint on the spot — n inserts
 *  into one stack made that quadratic. Structural commands queue their dirty
 *  parents here; `prepareBatch.apply` drains the set once at the end. Outside
 *  a batch (no `layoutDirty` set) the reconcile runs immediately. */
function queueLayoutReconcile(container: RootContainer, parent: ElementNode | null | undefined) {
	if (!parent) {
		return
	}

	while (parent?.type === 'proxyviewcontainer') {
		if (parent.parent) {
			parent = parent.parent
		} else {
			if (!container.children.includes(parent)) {
				return
			}

			parent = container.projectionRoot ??= {
				type: '#root',
				children: container.children,
				view: container.hostView,
				props: {},
				container,
			} as ElementNode

			break
		}
	}

	const pending = container?.layoutDirty
	if (pending) {
		pending.add(parent)
		return
	}

	reconcileLayoutParent(parent)
}

function reconcileLayoutParent(parent: ElementNode) {
	if (
		parent.projectedChildren ||
		parent.children.some((child) => child.type === 'proxyviewcontainer')
	) {
		syncProxyProjection(parent)
	}

	if (parent.type === 'portalroot') {
		const views = (parent.projectedChildren ?? parent.children)
			.filter((child) => child.view)
			.map(layoutView)

		const host = parent.view
		const native = host?.subviews
		if (!host?.addSubviewPositionedRelativeTo || !native) {
			return
		}

		const count = native.count
		const actual = Array.from({ length: Number(count ?? 0) }, (_, index) =>
			native.objectAtIndex(index),
		).filter((view) => views.includes(view))

		if (views.some((view, index) => view !== actual[index])) {
			let previous: NSView | null = null
			for (const view of views) {
				// NSWindowAbove = 1 (AppKit NSGraphics.h); preserve the portal's
				// logical sibling order without disturbing target-owned siblings.
				host.addSubviewPositionedRelativeTo(view, 1, previous)
				previous = view
			}
		}

		return
	}

	if (parent.type === 'rootlayout') {
		parent.view?.invalidateIntrinsicContentSize()
		layoutRootChildren(parent)
		if (
			['docklayout', 'contentview', 'wraplayout', 'rootlayout'].includes(parent.parent?.type ?? '')
		) {
			queueLayoutReconcile(parent.container, parent.parent)
		}

		return
	}

	if (parent.type === 'wraplayout') {
		parent.view?.invalidateIntrinsicContentSize()
		layoutWrapChildren(parent)
		if (
			['docklayout', 'contentview', 'wraplayout', 'rootlayout'].includes(parent.parent?.type ?? '')
		) {
			queueLayoutReconcile(parent.container, parent.parent)
		}

		return
	}

	if (parent.type === 'docklayout') {
		parent.view?.invalidateIntrinsicContentSize()
		layoutDockChildren(parent)
		if (
			['docklayout', 'contentview', 'wraplayout', 'rootlayout'].includes(parent.parent?.type ?? '')
		) {
			queueLayoutReconcile(parent.container, parent.parent)
		}

		return
	}

	if (parent.type === 'contentview') {
		parent.view?.invalidateIntrinsicContentSize()
		layoutContentChild(parent)
		if (
			parent.parent?.type === 'docklayout' ||
			parent.parent?.type === 'wraplayout' ||
			parent.parent?.type === 'rootlayout'
		) {
			queueLayoutReconcile(parent.container, parent.parent)
		}

		return
	}

	if (parent.type === 'gridlayout') {
		layoutGridChildren(parent)
		return
	}

	if (parent.type === 'absolutelayout') {
		layoutAbsoluteChildren(parent)
		return
	}

	const stack = (parent.childHost ?? parent.view) as NSStackView | undefined
	if (typeof stack?.addViewInGravity !== 'function') {
		return
	}

	for (const child of parent.projectedChildren ?? parent.children) {
		setStackChildPriorities(parent, child)
	}

	updateStackDistribution(parent)
	updateCrossAxisConstraints(parent)
}

function validateTextNesting(parentType: string | undefined, childType: string) {
	if (parentType === 'listview') {
		throw new Error('AppKit <listview> takes item templates, not JSX children')
	}

	if (parentType === 'tabview' && childType !== 'tabviewitem') {
		throw new TypeError('AppKit <tabview> accepts only tabviewitem children')
	}

	if (childType === 'tabviewitem' && parentType !== 'tabview' && parentType !== undefined) {
		throw new TypeError('AppKit <tabviewitem> requires a tabview parent or an unparented handle')
	}

	if (parentType === 'tabviewitem') {
		throw new TypeError('AppKit <tabviewitem> content requires the xplatMacOS compiler adapter')
	}

	if (parentType === 'segmentedbaritem') {
		throw new Error('AppKit <segmentedbaritem> takes title content, not JSX children')
	}

	if (childType === 'segmentedbaritem' && parentType !== 'segmentedbar') {
		throw new Error('AppKit <segmentedbaritem> requires a segmentedbar parent')
	}

	if (parentType === 'progress') {
		throw new Error('AppKit <progress> cannot contain JSX children')
	}

	if (parentType === 'segmentedbar' && childType !== 'segmentedbaritem') {
		throw new Error('AppKit <segmentedbar> accepts only segmentedbaritem children')
	}

	if (parentType === 'listpicker') {
		throw new Error('AppKit <listpicker> cannot contain JSX children')
	}

	if (parentType === 'timepicker') {
		throw new Error('AppKit <timepicker> cannot contain JSX children')
	}

	if (parentType === 'datepicker') {
		throw new Error('AppKit <datepicker> cannot contain JSX children')
	}

	if (parentType === 'activityindicator') {
		throw new Error('AppKit <activityindicator> cannot contain JSX children')
	}

	if (parentType === 'htmlview') {
		throw new Error('AppKit <htmlview> takes html content, not JSX children')
	}

	if (parentType === 'formattedstring' && childType !== 'span') {
		throw new Error('AppKit <formattedstring> accepts only span children')
	}

	if (parentType === 'span' && !['span', '#text'].includes(childType)) {
		throw new Error('AppKit <span> accepts only span or text children')
	}

	if (
		childType === 'formattedstring' &&
		!['label', 'button', 'textfield', 'textview', 'searchbar'].includes(parentType ?? '')
	) {
		throw new Error('AppKit <formattedstring> requires a text-bearing parent')
	}

	if (parentType === 'searchbar' && childType !== 'formattedstring') {
		throw new Error('AppKit <searchbar> cannot contain children other than formattedstring')
	}
}

function insert(
	container: RootContainer,
	parentId: UniversalHostParent,
	node: ElementNode,
	beforeId: number | null,
) {
	const parent = resolveParentNode(container, parentId)
	validateTextNesting(parent?.type, node.type)
	// Validate before detaching — a rejected insert must not leave the node
	// orphaned from its current parent.
	if (parentId !== null && !parent) {
		throw new Error(
			'Unknown AppKit ' +
				(typeof parentId === 'number' ? 'parent ' + parentId : 'portal parent ' + parentId.id),
		)
	}

	if (
		[
			'stacklayout',
			'contentview',
			'docklayout',
			'wraplayout',
			'rootlayout',
			'proxyviewcontainer',
		].includes(parent?.type ?? '') &&
		!node.view &&
		node.type !== 'proxyviewcontainer'
	) {
		throw new Error('AppKit <' + parent!.type + '> cannot contain text-only children')
	}

	if (parent && (node.view || node.type === 'proxyviewcontainer') && !canContainView(parent.type)) {
		throw new Error('AppKit <' + parent.type + '> cannot contain child views')
	}

	const projected =
		node.type === 'proxyviewcontainer' ||
		parent?.type === 'proxyviewcontainer' ||
		parent?.projectedChildren ||
		parent?.children.some((child) => child.type === 'proxyviewcontainer')

	const parentView = parent?.childHost ?? parent?.view ?? container.hostView
	if (node.view && !parentView) {
		throw new Error('AppKit host has no parent view for node ' + node.id)
	}

	detach(container, node, node.type === 'tabviewitem' && node.parent === parent)
	const siblings = parent ? parent.children : container.children
	const beforeIndex = beforeId === null ? -1 : siblings.findIndex((child) => child.id === beforeId)
	const index = beforeIndex < 0 ? siblings.length : beforeIndex
	siblings.splice(index, 0, node)
	node.parent = parent
	if (projected) {
		if (parent?.type === 'contentview') {
			const previous = parent.contentChild
			if (previous && previous !== node) {
				for (const child of previous.type === 'proxyviewcontainer'
					? projectedViews(previous)
					: [previous]) {
					releaseProjectedView(child)
				}
			}

			parent.contentChild = node
		}

		queueLayoutReconcile(container, parent ?? node)
		return
	}

	if (node.view) {
		if (parent) {
			if (
				[
					'portalroot',
					'gridlayout',
					'absolutelayout',
					'contentview',
					'docklayout',
					'wraplayout',
					'rootlayout',
				].includes(parent.type)
			) {
				// Re-homing under a manually laid-out parent — release the
				// margin wrapper so arrangedView() stops returning the
				// detached host and the grid cannot keep a ghost view.
				node.marginHost?.removeFromSuperview()
				node.marginHost = null
				node.marginConstraints = null
			}

			if (parent.type === 'portalroot') {
				parentView.addSubview(layoutView(node))
				layoutView(node).translatesAutoresizingMaskIntoConstraints = false
				layoutView(node).leadingAnchor.constraintEqualToAnchor(parentView.leadingAnchor).active =
					true

				layoutView(node).trailingAnchor.constraintEqualToAnchor(parentView.trailingAnchor).active =
					true

				layoutView(node).topAnchor.constraintEqualToAnchor(parentView.topAnchor).active = true
				layoutView(node).bottomAnchor.constraintEqualToAnchor(parentView.bottomAnchor).active = true
				applySizeConstraints(node)
				queueLayoutReconcile(container, parent)
			} else if (parent.type === 'contentview') {
				const previous = parent.contentChild
				if (previous && previous !== node) {
					releasePlacementPins(previous)
					layoutView(previous).removeFromSuperview()
				}

				parent.contentChild = node
				parentView.addSubview(layoutView(node))
				layoutView(node).translatesAutoresizingMaskIntoConstraints = false
				deactivateSizeConstraints(node)
				queueLayoutReconcile(container, parent)
			} else if (
				parent.type === 'gridlayout' ||
				parent.type === 'docklayout' ||
				parent.type === 'wraplayout' ||
				parent.type === 'rootlayout'
			) {
				parentView.addSubview(layoutView(node))
				layoutView(node).translatesAutoresizingMaskIntoConstraints = false
				deactivateSizeConstraints(node)
				queueLayoutReconcile(container, parent)
			} else if (parent.type === 'absolutelayout') {
				parentView.addSubview(layoutView(node))
				layoutView(node).translatesAutoresizingMaskIntoConstraints = false
				deactivateSizeConstraints(node)
				queueLayoutReconcile(container, parent)
			} else {
				if (marginInsetsOf(node) && !node.marginHost) {
					makeMarginHost(node)
					setLayoutAction(node, node.props?.onLayoutChanged)
				}

				// AppKit insertion indices are local to a gravity area. Honor the
				// renderer's before edge instead of appending moved keyed rows.
				const gravity = stackGravity(parent, node)
				const arrangedIndex = gravityInsertIndex(parent, node, gravity)

				const stack = parentView as NSStackView
				stack.insertViewAtIndexInGravity(arrangedView(node), arrangedIndex, gravity)
				applySizeConstraints(node)
				queueLayoutReconcile(container, parent)
			}
		} else {
			parentView.addSubview(layoutView(node))
			layoutView(node).leadingAnchor.constraintEqualToAnchor(parentView.leadingAnchor).active = true
			layoutView(node).trailingAnchor.constraintEqualToAnchor(parentView.trailingAnchor).active =
				true

			layoutView(node).topAnchor.constraintEqualToAnchor(parentView.topAnchor).active = true
			layoutView(node).bottomAnchor.constraintEqualToAnchor(parentView.bottomAnchor).active = true
			applySizeConstraints(node)
		}

		syncScheme(node)
	} else {
		if (parent?.type === 'tabview') {
			syncTabView(parent)
		} else if (parent?.type === 'segmentedbar') {
			syncSegmentedBar(parent)
		} else {
			syncText(parent)
		}
	}
}

function remove(container: RootContainer, parentId: UniversalHostParent, node: ElementNode) {
	const expectedParent = resolveParentNode(container, parentId)
	if (node.parent !== expectedParent) {
		return
	}

	if (
		node.type === 'proxyviewcontainer' ||
		expectedParent?.type === 'proxyviewcontainer' ||
		node.layoutParent
	) {
		detach(container, node)
		return
	}

	if (node.type === 'tabviewitem') {
		detachTabItem(node)
	}

	const siblings = expectedParent ? expectedParent.children : container.children
	const index = siblings.indexOf(node)
	if (index >= 0) {
		siblings.splice(index, 1)
	}

	if (node.crossAxisConstraint) {
		node.crossAxisConstraint.active = false
	}

	node.crossAxisConstraint = null
	deactivateSizeConstraints(node)
	releasePlacementPins(node)
	if (node.view) {
		const parentView = expectedParent?.childHost ?? expectedParent?.view
		if (parentView?.removeArrangedSubview && arrangedView(node)?.superview === parentView) {
			parentView.removeArrangedSubview(arrangedView(node))
		}

		layoutView(node).removeFromSuperview()
		node.marginHost?.removeFromSuperview()
		node.marginHost = null
		node.marginConstraints = null
		setLayoutAction(node, node.props?.onLayoutChanged)
	}

	if (expectedParent?.type === 'contentview' && expectedParent.contentChild === node) {
		expectedParent.contentChild = null
		expectedParent.view!.invalidateIntrinsicContentSize()
	}

	queueLayoutReconcile(container, expectedParent)
	node.parent = null
	syncText(expectedParent)
	if (expectedParent?.type === 'tabview') {
		syncTabView(expectedParent)
	}

	if (expectedParent?.type === 'segmentedbar') {
		syncSegmentedBar(expectedParent)
	}
}

function destroy(node: ElementNode) {
	if (node.type === 'listview' && node.view) {
		disposeListView(node.view)
	}

	if (node.type === 'tabview') {
		releaseTabView(node)
	}

	if (node.type === 'tabviewitem') {
		detach(node.container, node)
		releaseTabItem(node)
	}

	if (node.type === 'segmentedbaritem') {
		detach(node.container, node)
		node.props.title = undefined
	}

	if (node.type === 'segmentedbar') {
		for (const child of node.children.slice()) {
			detach(node.container, child)
		}
	}

	if (node.type === 'formattedstring' || node.type === 'span') {
		detach(node.container, node)
		for (const child of node.children.slice()) {
			detach(node.container, child)
		}
	}

	if (node.type === 'proxyviewcontainer') {
		detach(node.container, node)
		for (const child of node.children.slice()) {
			detach(node.container, child)
		}
	}

	if (node.type === 'rootlayout') {
		if (node.rootGeometryObserver) {
			NSNotificationCenter.defaultCenter.removeObserver(node.rootGeometryObserver)
			node.rootGeometryObserver = null
		}

		if (node.view) {
			rootLayoutNodesByView.delete(node.view)
		}

		for (const child of node.children.slice()) {
			detach(node.container, child)
		}
	}

	if (node.type === 'wraplayout') {
		if (node.wrapGeometryObserver) {
			NSNotificationCenter.defaultCenter.removeObserver(node.wrapGeometryObserver)
			node.wrapGeometryObserver = null
		}

		if (node.view) {
			wrapLayoutNodesByView.delete(node.view)
		}

		for (const child of node.children.slice()) {
			detach(node.container, child)
		}
	}

	if (node.type === 'docklayout') {
		if (node.dockGeometryObserver) {
			NSNotificationCenter.defaultCenter.removeObserver(node.dockGeometryObserver)
			node.dockGeometryObserver = null
		}

		if (node.view) {
			dockLayoutNodesByView.delete(node.view)
		}

		for (const child of node.children.slice()) {
			detach(node.container, child)
		}
	}

	// Removing an ancestor does not detach its native descendants. Every
	// destroyed view releases its own edge, including retained ContentView refs.
	if (node.type === 'contentview') {
		if (node.contentGeometryObserver) {
			NSNotificationCenter.defaultCenter.removeObserver(node.contentGeometryObserver)
			node.contentGeometryObserver = null
		}

		// Detaching mutates children; iterate a snapshot.
		for (const child of node.children.slice()) {
			detach(node.container, child)
		}

		if (node.view) {
			contentViewNodesByView.delete(node.view)
		}
	}

	if (node.view) {
		detach(node.container, node)
	}

	disposePressGestures(node)
	if (node.view) {
		panHandlersByView.delete(node.view)
	}

	if (node.panGestureRecognizer) {
		node.panGestureRecognizer.enabled = false
	}

	if (node.textLayoutObserver) {
		NSNotificationCenter.defaultCenter.removeObserver(node.textLayoutObserver)
	}

	if (['textfield', 'textview', 'searchbar'].includes(node.type) && node.view) {
		textNodesByView.delete(node.view)
		actionIdsByView.delete(node.view)
		node.view.delegate = null
		if (node.type === 'searchbar') {
			node.view.target = null
			node.view.action = null
			node.submitHandler = null
		}
	}

	// Nodes destroyed by a failed makeNode may have a null view — every
	// branch below must tolerate partial construction.
	if (node.type === 'webview' && node.view) {
		disposeWebView(node.view as WKWebView)
	}

	if (node.type === 'segmentedbar' && node.view) {
		node.view.target = null
		node.view.action = null
		node.view.segmentCount = 0
		node.segmentedBarTitles = null
		node.props.items = undefined
		node.props.onSelectedIndexChange = undefined
	}

	if (node.type === 'listpicker' && node.view) {
		node.view.target = null
		node.view.action = null
		node.view.removeAllItems()
		node.listPickerTitles = null
		node.props.onSelectedIndexChange = undefined
	}

	if (node.type === 'timepicker' && node.view) {
		node.view.target = null
		node.view.action = null
		node.props.onTimeChange = undefined
		node.timePickerInputs = undefined
	}

	if (node.type === 'datepicker' && node.view) {
		node.view.target = null
		node.view.action = null
		node.props.onDateChange = undefined
	}

	if (node.type === 'activityindicator' && node.view) {
		node.view.stopAnimation(null)
		node.view.alphaValue = 0
		node.view.hidden = true
	}

	if (node.type === 'image' && node.view) {
		disposeImage(node.view as NSImageView)
	}

	if (node.type === 'scrollview' && node.scrollObserverInstalled && node.view) {
		const clipView = node.view.contentView
		scrollHandlers.delete(clipView)
		NSNotificationCenter.defaultCenter.removeObserver(node.scrollObserver)
		node.scrollObserver = null
		node.scrollObserverInstalled = false
	}

	node.scrollGeometryDetach?.()
	node.scrollGeometryDetach = null
	for (const constraint of node.scrollAxisConstraints ?? []) {
		constraint.active = false
	}

	if (node.layoutObserver) {
		NSNotificationCenter.defaultCenter.removeObserver(node.layoutObserver)
		node.layoutObserver = null
	}

	layoutHandlers.delete(node.layoutObservedView)
	node.layoutObservedView = null

	if (node.actionId !== undefined) {
		actionHandlers.delete(node.actionId)
		accessibilityLabels.delete(node.actionId)
		accessibilityRoles.delete(node.actionId)
	}

	if (
		node.view &&
		typeof nodeContainersByView !== 'undefined' &&
		nodeContainersByView.get(node.view) === node.container
	) {
		nodeContainersByView.delete(node.view)
	}
}

/** Pre-flight a whole batch without mutating, so a deterministic failure —
 *  bad props, unknown nodes, illegal parents, unsupported ops — rejects the
 *  batch before any command applies. Residual mid-apply failures are then
 *  limited to unexpected native errors, and each command unwinds itself. */
function validateBatch(container: RootContainer, commands: readonly UniversalHostCommand[]) {
	// Ids created by this batch are not in container.nodes yet — track them so
	// later commands validate against the intended tree.
	const pending = new Map<number, { type: string; props: PropBag }>()
	const destroyed = new Set<number>()
	const parents = new Map<number, UniversalHostParent>()
	const parentOf = (id: number): UniversalHostParent | undefined => {
		if (parents.has(id)) {
			return parents.get(id)
		}

		const node = container.nodes.get(id)
		return node ? parentReference(node.parent) : undefined
	}

	const known = (id: number): { type: string; props: PropBag } | undefined =>
		pending.get(id) ?? (destroyed.has(id) ? undefined : container.nodes.get(id))

	const parentNode = (parent: UniversalHostParent) => {
		if (parent === null) {
			return null
		}

		return typeof parent === 'number'
			? (known(parent) ?? null)
			: resolveParentNode(container, parent)
	}

	for (const command of commands) {
		switch (command.op) {
			case 'create':
				assertSupportedType(command.type)
				validateNodeProps(command.type, command.props)
				pending.set(command.id, { type: command.type, props: command.props })
				parents.set(command.id, null)
				destroyed.delete(command.id)
				continue
			case 'recreate': {
				const entry = known(command.id)
				if (!entry) {
					throw new Error('Unknown AppKit node ' + command.id)
				}

				assertSupportedType(command.type)
				validateNodeProps(command.type, command.props)
				const existing = container.nodes.get(command.id)
				const parentId = parentOf(command.id) ?? null
				const parent = parentNode(parentId)
				validateTextNesting(parent?.type, command.type)
				if (
					[
						'stacklayout',
						'contentview',
						'docklayout',
						'wraplayout',
						'rootlayout',
						'proxyviewcontainer',
					].includes(parent?.type ?? '') &&
					!typeHasView(command.type) &&
					command.type !== 'proxyviewcontainer'
				) {
					throw new Error('AppKit <' + parent!.type + '> cannot contain text-only children')
				}

				if (
					existing?.parent &&
					(typeHasView(command.type) || command.type === 'proxyviewcontainer') &&
					!canContainView(existing.parent.type)
				) {
					throw new Error('AppKit <' + existing.parent.type + '> cannot contain child views')
				}

				pending.set(command.id, { type: command.type, props: command.props })
				continue
			}
			case 'update': {
				const entry = known(command.id)
				if (!entry) {
					throw new Error('Unknown AppKit node ' + command.id)
				}

				validateNodeProps(entry.type, command.props, entry.props)
				continue
			}
			case 'insert':
			case 'move': {
				const entry = known(command.id)
				if (!entry) {
					throw new Error('Unknown AppKit node ' + command.id)
				}

				const parentId = command.parent
				const parent = parentNode(parentId)
				validateTextNesting(parent?.type, entry.type)
				if (parentId !== null) {
					if (!parent) {
						throw new Error(
							'Unknown AppKit ' +
								(typeof parentId === 'number'
									? 'parent ' + parentId
									: 'portal parent ' + parentId.id),
						)
					}

					if (
						[
							'stacklayout',
							'contentview',
							'docklayout',
							'wraplayout',
							'rootlayout',
							'proxyviewcontainer',
						].includes(parent.type) &&
						!typeHasView(entry.type) &&
						entry.type !== 'proxyviewcontainer'
					) {
						throw new Error('AppKit <' + parent!.type + '> cannot contain text-only children')
					}

					if (
						(typeHasView(entry.type) || entry.type === 'proxyviewcontainer') &&
						!canContainView(parent.type)
					) {
						throw new Error('AppKit <' + parent.type + '> cannot contain child views')
					}
				}

				const seen = new Set([command.id])
				for (
					let ancestor: UniversalHostParent = parentId;
					typeof ancestor === 'number';
					ancestor = parentOf(ancestor) ?? null
				) {
					if (seen.has(ancestor)) {
						throw new Error('AppKit logical ownership cycle')
					}

					seen.add(ancestor)
				}

				parents.set(command.id, parentId)
				continue
			}
			case 'destroy':
				pending.delete(command.id)
				destroyed.add(command.id)
				continue
			case 'remove':
				if (Object.is(parentOf(command.id), command.parent)) {
					parents.set(command.id, null)
				}

				continue
			case 'visibility':
			case 'ensure-public-instance':
				continue
			default:
				throw new Error('AppKit spike does not support host command ' + command.op)
		}
	}

	if (
		[...container.nodes.values()].some((node) => node.type === 'proxyviewcontainer') ||
		commands.some((command) => 'type' in command && command.type === 'proxyviewcontainer')
	) {
		validateProxyTree(container, commands)
	}
}

function applyCommand(container: RootContainer, command: UniversalHostCommand) {
	switch (command.op) {
		case 'create': {
			// A retried batch can re-create an id the earlier attempt already
			// registered — release the previous node instead of orphaning it.
			const existing = container.nodes.get(command.id)
			if (
				['stacklayout', 'contentview', 'docklayout', 'wraplayout', 'rootlayout'].includes(
					existing?.parent?.type ?? '',
				) &&
				!typeHasView(command.type) &&
				command.type !== 'proxyviewcontainer'
			) {
				throw new Error('AppKit <' + existing!.parent!.type + '> cannot contain text-only children')
			}

			if (existing) {
				detach(container, existing)
				destroy(existing)
			}

			container.nodes.set(command.id, makeNode(container, command.id, command.type, command.props))
			return
		}
		case 'update': {
			const node = container.nodes.get(command.id)
			if (!node) {
				throw new Error('Unknown AppKit node ' + command.id)
			}

			// node.props records what applied — restore it when a prop throws
			// mid-update so the bookkeeping doesn't claim unapplied props.
			const previousProps = node.props
			try {
				// Host updates carry the complete current prop bag; a key that
				// vanished must read as removed and reset what it installed.
				applyProps(node, {
					...droppedPropClears(node, command.props),
					...command.props,
				})
			} catch (error) {
				node.props = previousProps
				throw error
			}

			return
		}
		case 'insert':
		case 'move': {
			const node = container.nodes.get(command.id)
			if (!node) {
				throw new Error('Unknown AppKit node ' + command.id)
			}

			insert(container, command.parent, node, command.before)
			return
		}
		case 'remove': {
			const node = container.nodes.get(command.id)
			if (node) {
				remove(container, command.parent, node)
			}

			return
		}
		case 'destroy': {
			const node = container.nodes.get(command.id)
			if (node) {
				destroy(node)
			}

			container.nodes.delete(command.id)
			return
		}
		case 'visibility': {
			const node = container.nodes.get(command.id)
			if (node?.view) {
				node.view.hidden = command.state === 'hidden'
			}

			return
		}
		case 'ensure-public-instance':
			return
		case 'recreate': {
			const node = container.nodes.get(command.id)
			if (!node) {
				throw new Error('Unknown AppKit node ' + command.id)
			}

			const parent = node.parent
			if (
				[
					'stacklayout',
					'contentview',
					'docklayout',
					'wraplayout',
					'rootlayout',
					'proxyviewcontainer',
				].includes(parent?.type ?? '') &&
				!typeHasView(command.type) &&
				command.type !== 'proxyviewcontainer'
			) {
				throw new Error('AppKit <' + parent!.type + '> cannot contain text-only children')
			}

			if (
				parent &&
				(typeHasView(command.type) || command.type === 'proxyviewcontainer') &&
				!canContainView(parent.type)
			) {
				// insert would reject the replacement after the original was
				// already removed and destroyed — fail while it is intact.
				throw new Error('AppKit <' + parent.type + '> cannot contain child views')
			}

			const replacement = makeNode(container, command.id, command.type, command.props)
			const siblings = parent ? parent.children : container.children
			const index = siblings.indexOf(node)
			const beforeId = index < 0 ? null : (siblings[index + 1]?.id ?? null)
			const parentId = parentReference(parent)
			remove(container, parentId, node)
			destroy(node)
			container.nodes.set(command.id, replacement)
			insert(container, parentId, replacement, beforeId)
			return
		}
		default:
			throw new Error('AppKit spike does not support host command ' + command.op)
	}
}

const macOSDriver: UniversalHostDriver<RootContainer, any> = {
	id: 'macos',
	capabilities: { text: 'host' },
	portals: {
		prepareTarget({ container, target, createPortalTargetHandle }) {
			if (!isPortalTargetView(target)) {
				throw new TypeError('AppKit portal targets must be NSView instances.')
			}

			const owner = nodeContainersByView.get(target)
			if (owner && owner !== container) {
				throw new Error('AppKit portal target belongs to another Octane root.')
			}

			let id = container.portalTargetIds.get(target)
			if (id === undefined) {
				id = container.nextPortalTargetId++
				container.portalTargetIds.set(target, id)
			}

			const handle = createPortalTargetHandle(id)
			let registration = container.portalTargets.get(handle)
			if (registration && registration.root.view !== target) {
				throw new Error('AppKit portal target handle resolved to a different NSView.')
			}

			if (!registration) {
				const root: ElementNode = {
					id: -id,
					type: 'portalroot',
					view: target as AppKitView,
					props: {},
					parent: null,
					children: [],
					container,
					appliedFontFamily: container.fontFamily,
					scrollObserverInstalled: false,
					text: '',
				}

				portalHandlesByNode.set(root, handle)
				registration = { root, registrations: 0 }
				container.portalTargets.set(handle, registration)
			}

			registration.registrations++
			let released = false
			return {
				handle,
				release() {
					if (released) {
						return
					}

					released = true
					registration!.registrations--
					if (registration!.registrations !== 0) {
						return
					}

					let cleanupError: unknown
					for (const child of registration!.root.children.slice()) {
						try {
							detach(container, child)
						} catch (error) {
							cleanupError ??= error
						}
					}

					portalHandlesByNode.delete(registration!.root)

					if (container.portalTargets.get(handle) === registration) {
						container.portalTargets.delete(handle)
					}

					if (cleanupError !== undefined) {
						throw cleanupError
					}
				},
			}
		},
	},
	prepareBatch(container, batch) {
		// Reject deterministic failures before any command mutates — a
		// partially applied batch cannot be rolled back once commit() marks
		// it accepted. Prepare acquires nothing, so abort() has no cleanup.
		validateBatch(container, batch.commands)
		return {
			apply() {
				container.layoutDirty = new Set()
				try {
					for (const command of batch.commands) {
						try {
							applyCommand(container, command)
						} catch (error) {
							// The universal root can swallow a mid-batch failure when it
							// retries or aborts the attempt — log it here so an
							// unsupported element cannot silently stall the mount.
							console.error(
								'[macos-host] command ' +
									command.op +
									' failed for <' +
									((command as { type?: string }).type ?? '?') +
									'> id=' +
									('id' in command ? command.id : '?'),
								error,
							)

							throw error
						}
					}
				} finally {
					const dirty = container.layoutDirty
					container.layoutDirty = null
					flushTabViews(container)
					if (dirty) {
						for (const parent of dirty) {
							reconcileLayoutParent(parent)
						}
					}
				}
			},
			abort() {},
		}
	},
	getPublicInstance(container, id) {
		const node = container.nodes.get(id)
		return node &&
			['proxyviewcontainer', 'formattedstring', 'span', 'segmentedbaritem', 'tabviewitem'].includes(
				node.type,
			)
			? node
			: (node?.view ?? null)
	},
}

const round = (value: number) => Math.round(value * 100) / 100

function nodeClasses(node: ElementNode) {
	return normalizeClass(node.props?.className).split(/\s+/).filter(Boolean)
}

function descendants(node: ElementNode, out: ElementNode[] = []) {
	for (const child of node.children) {
		out.push(child)
		descendants(child, out)
	}

	return out
}

function withDrawingAppearance<T>(appearance: any, read: () => T): T {
	let value!: T
	const readValue = () => {
		value = read()
	}

	if (typeof appearance?.performAsCurrentDrawingAppearance === 'function') {
		appearance.performAsCurrentDrawingAppearance(readValue)
	} else {
		readValue()
	}

	return value
}

function colorValue(color: any, appearance?: any) {
	if (!color) {
		return undefined
	}

	try {
		return withDrawingAppearance(appearance, () => {
			const rgb = color.colorUsingColorSpace?.(NSColorSpace.sRGBColorSpace) ?? color
			return (
				'#' +
				[rgb.redComponent, rgb.greenComponent, rgb.blueComponent]
					.map((component) =>
						Math.round(Number(component) * 255)
							.toString(16)
							.padStart(2, '0'),
					)
					.join('')
			)
		})
	} catch {
		return undefined
	}
}

function stackDirection(view: any) {
	return view.orientation === NSUserInterfaceLayoutOrientation.Horizontal ? 'row' : 'column'
}

function parityStyle(node: ElementNode, facets: readonly string[]) {
	const view = node.view
	const font = view?.font
	const supplied: PropBag = node.props?.style ?? {}
	const out: Record<string, any> = {}
	for (const facet of facets) {
		let value = supplied[facet]
		if (facet === 'paddingTop' && view?.edgeInsets?.top != null) {
			value = view.edgeInsets.top
		}

		if (facet === 'paddingRight' && view?.edgeInsets?.right != null) {
			value = view.edgeInsets.right
		}

		if (facet === 'paddingBottom' && view?.edgeInsets?.bottom != null) {
			value = view.edgeInsets.bottom
		}

		if (facet === 'paddingLeft' && view?.edgeInsets?.left != null) {
			value = view.edgeInsets.left
		}

		if (facet === 'fontSize' && font?.pointSize != null) {
			value = font.pointSize
		}

		if (facet === 'fontFamily' && font?.familyName) {
			value = font.familyName
		}

		if (facet === 'fontWeight' && font?.fontDescriptor?.symbolicTraits != null) {
			value =
				supplied.fontWeight ??
				node.appliedFontWeight ??
				(Number(font.fontDescriptor.symbolicTraits) & 2 ? '700' : '400')
		}

		if (facet === 'lineHeight' && font) {
			value =
				supplied.lineHeight ??
				(node.type === 'label'
					? round(Number(view.frame.size.height))
					: round(Number(font.ascender) - Number(font.descender) + Number(font.leading)))
		}

		if (facet === 'color' && view?.textColor) {
			value = colorValue(view.textColor) ?? value
		}

		if (facet === 'backgroundColor') {
			value =
				colorValue(
					view?.layer?.backgroundColor
						? NSColor.colorWithCGColor(view.layer.backgroundColor)
						: null,
				) ?? value

			if (value == null && view?.drawsBackground === false) {
				value = 'rgba(0,0,0,0)'
			}
		}

		if (facet === 'borderTopWidth' && view?.layer) {
			value = view.layer.borderWidth
		}

		if (facet === 'borderTopColor' && view?.layer?.borderColor) {
			value = colorValue(NSColor.colorWithCGColor(view.layer.borderColor)) ?? value
		}

		if (facet === 'borderTopLeftRadius' && view?.layer) {
			value = view.layer.cornerRadius
		}

		if (facet === 'opacity' && view?.alphaValue != null) {
			value = view.alphaValue
		}

		if (facet === 'flexDirection' && view?.orientation != null) {
			value = stackDirection(view)
		}

		if (facet === 'alignItems' && view?.orientation != null) {
			value = stackAlignItems(node)
		}

		if (facet === 'justifyContent' && view?.distribution != null) {
			value = stackJustifyContent(node)
		}

		if (value !== undefined && value !== null && value !== '') {
			out[facet] = String(value)
		}
	}

	if (font?.fontName) {
		out.fontPostScriptName = String(font.fontName)
	}

	return out
}

function measureTextLineAdvances(value: string, font: any) {
	if (!value || !font) {
		return undefined
	}

	return String(value)
		.split(/\r\n|\r|\n/)
		.map((line) => {
			const attributed = NSAttributedString.alloc().initWithStringAttributes(line, {
				[NSFontAttributeName]: font,
			})

			return round(Number(attributed.size().width))
		})
}

function measureTextLineCount(node: ElementNode) {
	if (node.type !== 'label') {
		return undefined
	}

	const view = node.view
	const cell = view?.cell
	if (typeof cell?.cellSizeForBounds !== 'function') {
		return undefined
	}

	const bounds = view!.bounds
	const fit = cell.cellSizeForBounds({
		origin: { x: 0, y: 0 },
		size: { width: Number(bounds.size.width), height: 100000 },
	})

	const height = Number(fit?.height)
	const styleLineHeight = Number(parityStyle(node, []).lineHeight)
	const font = view!.font
	const fontLineHeight = Number(font?.ascender) - Number(font?.descender) + Number(font?.leading)
	const lineHeight = styleLineHeight > 0 ? styleLineHeight : fontLineHeight
	if (!Number.isFinite(height) || height <= 0 || !Number.isFinite(lineHeight) || lineHeight <= 0) {
		return undefined
	}

	return Math.max(1, Math.round(height / lineHeight))
}

function parityBoxInHost(view: any, rect: any, boxView: any) {
	const converted = view.superview
		? view.superview.convertRectToView(rect, boxView)
		: view.convertRectToView(view.bounds, boxView)

	const boxHeight = Number(boxView.bounds.size.height)
	return {
		x: round(Number(converted.origin.x)),
		y: round(boxHeight - Number(converted.origin.y) - Number(converted.size.height)),
		w: round(Number(converted.size.width)),
		h: round(Number(converted.size.height)),
	}
}

function parityLocalBoxInHost(view: any, rect: any, boxView: any) {
	const frameOrigin = view.frame.origin
	return parityBoxInHost(
		view,
		{
			origin: {
				x: Number(frameOrigin.x) + Number(rect.origin.x),
				y: Number(frameOrigin.y) + Number(rect.origin.y),
			},
			size: rect.size,
		},
		boxView,
	)
}

function textContentBox(node: ElementNode, boxNode: ElementNode) {
	const view = node.view
	if (!view || !boxNode.view) {
		return null
	}

	if (node.type === 'textfield' && typeof view.cell?.titleRectForBounds === 'function') {
		return parityLocalBoxInHost(view, view.cell.titleRectForBounds(view.bounds), boxNode.view)
	}

	if (node.type === 'textview') {
		const inset = view.textContainerInset ?? { width: 0, height: 0 }
		const padding = Number(view.textContainer?.lineFragmentPadding ?? 0)
		const width = Number(view.bounds.size.width) - 2 * Number(inset.width) - 2 * padding
		const height = Number(view.bounds.size.height) - 2 * Number(inset.height)
		return parityLocalBoxInHost(
			view,
			{
				origin: { x: Number(inset.width) + padding, y: Number(inset.height) },
				size: { width: Math.max(0, width), height: Math.max(0, height) },
			},
			boxNode.view,
		)
	}

	return null
}

function parityNode(node: ElementNode, boxNode: ElementNode, facets: readonly string[]) {
	const view = node.view
	let box = null
	let frameBox = null
	if (view && boxNode.view) {
		try {
			frameBox = parityBoxInHost(view, view.frame, boxNode.view)
			const alignedRect = view.alignmentRectForFrame?.(view.frame)
			box = alignedRect ? parityBoxInHost(view, alignedRect, boxNode.view) : frameBox
		} catch {}
	}

	let placeholderBox = null
	let placeholderFrameBox = null
	if (node.placeholderView && boxNode.view) {
		try {
			const placeholderView = node.placeholderView
			placeholderFrameBox = parityBoxInHost(placeholderView, placeholderView.frame, boxNode.view)
			const alignedRect = placeholderView.alignmentRectForFrame?.(placeholderView.frame)
			placeholderBox = alignedRect
				? parityBoxInHost(placeholderView, alignedRect, boxNode.view)
				: placeholderFrameBox
		} catch {}
	}

	let text
	let textLineAdvances
	if (node.type === 'label') {
		const value = String(view?.stringValue ?? '')
		text = value.trim()
		textLineAdvances = measureTextLineAdvances(value, view?.font)
	} else if (node.type === 'button') {
		const value = String(view?.title ?? '')
		text = value.trim()
		textLineAdvances = measureTextLineAdvances(value, view?.font)
	} else if (node.type === 'textfield') {
		const value = String(view?.stringValue ?? '')
		text = value.trim()
		textLineAdvances = measureTextLineAdvances(value, view?.font)
	} else if (node.type === 'textview') {
		const value = String(view?.string ?? '')
		text = value.trim()
		textLineAdvances = measureTextLineAdvances(value, view?.font)
	}

	const placeholderAttributedString =
		node.type === 'textfield' ? view?.placeholderAttributedString : null

	const placeholder =
		node.type === 'textfield'
			? String(placeholderAttributedString?.string ?? view?.placeholderString ?? '').trim()
			: node.type === 'textview'
				? String(node.placeholderView?.stringValue ?? '').trim()
				: ''

	const placeholderColor =
		node.type === 'textfield'
			? (placeholderAttributedString?.attributeAtIndexEffectiveRange?.(
					NSForegroundColorAttributeName,
					0,
					null,
				) ?? NSColor.placeholderTextColor)
			: node.type === 'textview'
				? node.placeholderView?.textColor
				: null

	const appearance = view?.effectiveAppearance ?? view?.window?.effectiveAppearance
	const placeholderStyle = placeholderColor
		? {
				color: colorValue(placeholderColor, appearance),
				opacity: round(
					Number(withDrawingAppearance(appearance, () => placeholderColor.alphaComponent)),
				),
			}
		: undefined

	const contentBox = textContentBox(node, boxNode)
	const textLineCount = measureTextLineCount(node)

	return {
		tag: String(node.type ?? 'view').toLowerCase(),
		id: node.props?.id || undefined,
		classes: nodeClasses(node),
		box,
		frameBox,
		placeholderBox,
		placeholderFrameBox,
		style: parityStyle(node, facets),
		text: text || undefined,
		textLineAdvances,
		placeholder: placeholder || undefined,
		placeholderStyle,
		contentBox,
		textLineCount,
	}
}

function measureParity(container: RootContainer, facets: readonly string[]) {
	const stage = [...container.nodes.values()].find((node) => node.props?.id === 'parity-stage')
	if (!stage?.view) {
		return null
	}

	container.hostView.window?.contentView?.layoutSubtreeIfNeeded?.()
	stage.view.layoutSubtreeIfNeeded?.()

	const cells: Record<string, any> = {}
	for (const cell of stage.children.filter((node) => nodeClasses(node).includes('parity-cell'))) {
		const name = String(cell.props?.id ?? '').replace(/^cell-/, '')
		const box = descendants(cell).find((node) => nodeClasses(node).includes('parity-box'))
		if (!box?.view) {
			continue
		}

		box.view.layoutSubtreeIfNeeded?.()
		for (const scroll of descendants(box).filter(
			(node) => node.type === 'scrollview' && node.view,
		)) {
			const clip = scroll.view!.contentView
			const contentDocument = scroll.view!.documentView
			const y = Math.max(
				0,
				Number(contentDocument.bounds.size.height) - Number(clip.bounds.size.height),
			)

			clip.scrollToPoint({ x: 0, y })
			scroll.view!.reflectScrolledClipView(clip)
		}

		cells[name] = [box, ...descendants(box)]
			.filter((node) => node.view)
			.map((node) => parityNode(node, box, facets))
	}

	return { target: 'macos', cells }
}

// Pointer-intent plumbing: NSTrackingArea-backed hover observation and an
// NSPopover surface for anchored hint layers (Tooltip/Hoverable). Reached by
// packages/ui macOS leaves through the __xplatAppKit host global — ui never
// links macos-node-api directly.

const hoverRecordsByArea = new Map<object, { enter?: () => void; exit?: () => void }>()
const hoverRecordByView = new WeakMap<object, any>()
const openPopups = new Set<any>()

const TRACKING_OPTS = (
	typeof NSTrackingAreaOptions === 'undefined' ? {} : NSTrackingAreaOptions
) as { [key: string]: number }

const trackingOpt = (value: number | undefined, fallback: number) =>
	typeof value === 'number' && Number.isFinite(value) ? value : fallback

const HOVER_TRACKING_OPTIONS =
	trackingOpt(TRACKING_OPTS.MouseEnteredAndExited, 0x01) |
	trackingOpt(TRACKING_OPTS.ActiveAlways, 0x80) |
	trackingOpt(TRACKING_OPTS.InVisibleRect, 0x200)

function dispatchHover(area: any, phase: 'enter' | 'exit') {
	const record = hoverRecordsByArea.get(area)
	const handler = phase === 'enter' ? record?.enter : record?.exit
	if (typeof handler !== 'function') {
		return
	}

	try {
		handler()
	} catch (error) {
		console.error('[macos-hover] hover handler failed', error)
	}
}

function observeHover(view: NSView, handlers: { enter?: () => void; exit?: () => void }) {
	if (
		!view ||
		typeof view.addTrackingArea !== 'function' ||
		typeof NSTrackingArea === 'undefined' ||
		!hoverTrackingTarget
	) {
		return () => {}
	}

	unobserveHover(view)
	const area = NSTrackingArea.alloc().initWithRectOptionsOwnerUserInfo(
		{ origin: { x: 0, y: 0 }, size: { width: 0, height: 0 } },
		HOVER_TRACKING_OPTIONS,
		hoverTrackingTarget,
		null,
	)

	if (!area) {
		return () => {}
	}

	view.addTrackingArea(area)
	const record = { view, area, enter: handlers?.enter, exit: handlers?.exit }
	hoverRecordsByArea.set(area, record)
	hoverRecordByView.set(view, record)
	return () => unobserveHover(view)
}

function unobserveHover(view: NSView) {
	const record = hoverRecordByView.get(view)
	if (!record) {
		return
	}

	hoverRecordByView.delete(view)
	hoverRecordsByArea.delete(record.area)
	try {
		view.removeTrackingArea(record.area)
	} catch (error) {
		console.error('[macos-hover] failed to remove tracking area', error)
	}
}

let hoverTrackingTarget: any = null
try {
	class HoverTrackingTarget extends NSObject {
		static ObjCExposedMethods = {
			mouseEntered: { params: [NSEvent], returns: interop.types.void },
			mouseExited: { params: [NSEvent], returns: interop.types.void },
		}

		static {
			NativeClass(this)
		}

		mouseEntered(event: NSEvent) {
			dispatchHover(event?.trackingArea, 'enter')
		}

		mouseExited(event: NSEvent) {
			dispatchHover(event?.trackingArea, 'exit')
		}
	}

	hoverTrackingTarget = HoverTrackingTarget.new()
} catch (error) {
	console.error(
		'[macos-hover] tracking target registration failed — hover affordances disabled',
		error,
	)
}

// preferredEdge is the anchor edge the popover attaches to: 'top' places the
// panel above the anchor (its MaxY edge). Numeric NSRectEdge values are the
// fallback when the bridged enum object is absent.
function popoverEdge(placement: string | undefined) {
	const edges = (typeof NSRectEdge === 'object' && NSRectEdge ? NSRectEdge : {}) as {
		[key: string]: number
	}

	switch (placement) {
		case 'bottom': {
			return edges.MinYEdge ?? 1
		}
		case 'left': {
			return edges.MinXEdge ?? 0
		}
		case 'right': {
			return edges.MaxXEdge ?? 2
		}
		case 'top':
		default: {
			return edges.MaxYEdge ?? 3
		}
	}
}

function popupFittingSize(contentView: NSView) {
	try {
		const direct = contentView.fittingSize
		if (direct && direct.width > 0 && direct.height > 0) {
			return { width: direct.width, height: direct.height }
		}

		const child = contentView.subviews?.objectAtIndex?.(0)?.fittingSize
		if (child && child.width > 0 && child.height > 0) {
			return { width: child.width, height: child.height }
		}
	} catch (error) {
		console.error('[macos-popup] fitting-size measurement failed', error)
	}

	return null
}

function showAnchoredPopup(options: PopupOptions) {
	let anchor = options?.anchor
	if (
		!anchor ||
		!anchor.window ||
		typeof NSPopover === 'undefined' ||
		typeof NSViewController === 'undefined'
	) {
		return null
	}

	// `at` anchors the popup to a window point in top-left coordinates instead
	// of the view's bounds — the fixed-position path for useLayer.
	const at = options?.at
	let relativeRect = anchor.bounds
	if (at && Number.isFinite(at.x) && Number.isFinite(at.y)) {
		const container = anchor.window?.contentView ?? anchor
		anchor = container
		// NSView coordinates are y-up; flip the top-left point.
		const height = Number(container.frame?.size?.height ?? 0)
		relativeRect = {
			origin: { x: Number(at.x), y: height - Number(at.y) },
			size: { width: 0, height: 0 },
		}
	}

	const contentView = NSView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 1, height: 1 },
	})

	const root = createMacOSRoot(contentView, { fontFamily: fontFamilyForView(anchor) })
	const popup = {
		popover: null as any,
		contentView,
		closed: false,
		closeObserver: null as any,
		update(props: PropBag) {
			if (popup.closed) {
				return
			}

			root.render(options.component, props)
			const size = popupFittingSize(contentView)
			if (size) {
				popup.popover!.contentSize = size
			}
		},
		close(dismissed = false) {
			if (popup.closed) {
				return
			}

			popup.closed = true
			openPopups.delete(popup)
			if (popup.closeObserver) {
				try {
					NSNotificationCenter.defaultCenter.removeObserver(popup.closeObserver)
				} catch {}

				popup.closeObserver = null
			}

			try {
				popup.popover?.close()
			} catch (error) {
				console.error('[macos-popup] popover close failed', error)
			}

			try {
				root.unmount()
			} catch (error) {
				console.error('[macos-popup] popup root unmount failed', error)
			}

			if (dismissed) {
				try {
					options.onClose?.()
				} catch (error) {
					console.error('[macos-popup] onClose callback failed', error)
				}
			}
		},
	}

	try {
		root.render(options.component, options.props ?? {})
	} catch (error) {
		console.error('[macos-popup] popup render failed', error)
		try {
			root.unmount()
		} catch {}

		return null
	}

	const controller = NSViewController.alloc().init()
	controller.view = contentView
	const fit = popupFittingSize(contentView)
	if (fit) {
		controller.preferredContentSize = fit
	}

	const popover = NSPopover.alloc().init()
	popover.contentViewController = controller
	const behaviors = (typeof NSPopoverBehavior === 'undefined' ? {} : NSPopoverBehavior) as {
		[key: string]: number
	}

	// Transient closes on outside interaction — the AppKit-native feel for a
	// hint layer. An explicit lightDismiss:false keeps the layer open until
	// the leaf closes it. The leaf still owns close() for hover-intent
	// dismissal.
	popover.behavior =
		options?.lightDismiss === false
			? (behaviors.ApplicationDefined ?? 2)
			: (behaviors.Transient ?? 1)

	popover.animates = options.animates ?? true
	popup.popover = popover
	openPopups.add(popup)
	popup.closeObserver = NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
		typeof NSPopoverDidCloseNotification === 'undefined'
			? 'NSPopoverDidCloseNotification'
			: NSPopoverDidCloseNotification,
		popover,
		null,
		() => popup.close(true),
	)

	try {
		popover.showRelativeToRectOfViewPreferredEdge(
			relativeRect,
			anchor,
			popoverEdge(options.placement),
		)
	} catch (error) {
		console.error('[macos-popup] popover presentation failed', error)
		popup.close()
		return null
	}

	return popup
}

// Leaf-native controls for the @octane-xplat leaf packages (context-menu,
// date-picker, sheet). Same convention as the pointer-intent plumbing —
// leaves reach AppKit through __xplatAppKit, never macos-node-api directly.

let menuActionTarget: any = null
try {
	class MenuActionTarget extends NSObject {
		static ObjCExposedMethods = {
			menuItemSelected: { params: [NSMenuItem], returns: interop.types.void },
		}

		static {
			NativeClass(this)
		}

		menuItemSelected(sender: NSMenuItem) {
			invokeAction(sender.tag)
		}
	}

	menuActionTarget = MenuActionTarget.new()
} catch (error) {
	console.error('[macos-leaf] menu target registration failed — context menus disabled', error)
}

/** Builds an NSMenu from serialized items and attaches it as `view.menu` —
 *  AppKit presents it on right-click and drives enablement. Returns a
 *  detach. */
function attachContextMenu(
	view: NSView,
	options: ContextMenuOptions,
	onSelect: (id: string | undefined) => void,
) {
	if (
		!view ||
		!menuActionTarget ||
		typeof NSMenu !== 'function' ||
		typeof NSMenuItem !== 'function'
	) {
		return () => {}
	}

	const menu = NSMenu.alloc().init()
	menu.autoenablesItems = false
	const created: number[] = []
	for (const item of options?.items ?? []) {
		// The shared item contract renders the divider AND the item's own row —
		// a divider marks the row before it, not a separator-only item.
		if (item?.divider) {
			menu.addItem(NSMenuItem.separatorItem())
		}

		const menuItem = NSMenuItem.alloc().initWithTitleActionKeyEquivalent(
			String(item?.title ?? ''),
			'menuItemSelected:',
			'',
		)

		menuItem.target = menuActionTarget
		if (item?.disabled) {
			menuItem.enabled = false
		}

		const actionId = nextActionId++
		menuItem.tag = actionId
		const id = item?.id
		actionHandlers.set(actionId, () => {
			try {
				onSelect?.(id)
			} catch (error) {
				console.error('[macos-leaf] context-menu selection failed', error)
			}
		})

		created.push(actionId)
		menu.addItem(menuItem)
	}

	// NSView.menu only answers right-clicks that hit *that* view — assign
	// the menu across the subtree so trigger children don't swallow them.
	// Children mounted after attach aren't covered (re-attach on items
	// change re-walks).
	const tagged: any[] = []
	const assign = (hostView: any) => {
		if (!hostView || typeof hostView !== 'object') {
			return
		}

		try {
			hostView.menu = menu
			tagged.push(hostView)
		} catch {}

		const subviews = hostView.subviews
		const count = typeof subviews?.count === 'function' ? subviews.count() : (subviews?.count ?? 0)

		for (let i = 0; i < count; i++) {
			assign(subviews.objectAtIndex(i))
		}
	}

	assign(view)

	return () => {
		for (const hostView of tagged) {
			try {
				if (hostView.menu === menu) {
					hostView.menu = null
				}
			} catch {}
		}

		for (const actionId of created) {
			actionHandlers.delete(actionId)
		}
	}
}

const DATE_PICKER_STYLES = (
	typeof NSDatePickerStyle === 'object' && NSDatePickerStyle ? NSDatePickerStyle : {}
) as { [key: string]: number }

const DATE_PICKER_ELEMENTS = (
	typeof NSDatePickerElementFlags === 'object' && NSDatePickerElementFlags
		? NSDatePickerElementFlags
		: {}
) as { [key: string]: number }

function dateFromMillis(millis: number) {
	if (typeof NSDate !== 'function' || !Number.isFinite(millis)) {
		return null
	}

	return NSDate.dateWithTimeIntervalSince1970(millis / 1000)
}

/** Embeds a real NSDatePicker inside the leaf's backing view, pinned to its
 *  edges — the leaf gives the host element an explicit size. mode 'date'
 *  uses YearMonthDay (text field by default, `style: 'graphical'` for the
 *  inline calendar); 'time' uses HourMinute with the clock-and-calendar
 *  field. Returns a handle with update/detach. */
function attachDatePicker(view: NSView, options: PropBag, onChange: (event: any) => void) {
	if (
		!view ||
		typeof view.addSubview !== 'function' ||
		typeof NSDatePicker !== 'function' ||
		!buttonActionTarget
	) {
		return null
	}

	const isTime = options?.mode === 'time'
	const isBoth = options?.mode === 'dateAndTime'
	const picker = NSDatePicker.alloc().init()
	picker.datePickerElements = isTime
		? (DATE_PICKER_ELEMENTS.HourMinute ?? 0x000c)
		: isBoth
			? (DATE_PICKER_ELEMENTS.YearMonthDay ?? 0x00e0) | (DATE_PICKER_ELEMENTS.HourMinute ?? 0x000c)
			: (DATE_PICKER_ELEMENTS.YearMonthDay ?? 0x00e0)

	picker.datePickerStyle =
		!isTime && !isBoth && options?.style === 'graphical'
			? (DATE_PICKER_STYLES.ClockAndCalendar ?? 1)
			: isTime
				? (DATE_PICKER_STYLES.ClockAndCalendar ?? 1)
				: (DATE_PICKER_STYLES.TextField ?? 0)

	const applyRange = (opts: PropBag | undefined) => {
		const min = dateFromMillis(opts?.minimumMillis)
		const max = dateFromMillis(opts?.maximumMillis)
		picker.minDate = min as NSDate
		picker.maxDate = max as NSDate
	}

	applyRange(options)
	picker.enabled = options?.enabled !== false

	const initial = dateFromMillis(options?.selectionMillis)
	if (initial) {
		picker.dateValue = initial
	}

	picker.translatesAutoresizingMaskIntoConstraints = false
	view.addSubview(picker)
	picker.leadingAnchor.constraintEqualToAnchor(view.leadingAnchor).active = true
	picker.trailingAnchor.constraintEqualToAnchor(view.trailingAnchor).active = true
	picker.topAnchor.constraintEqualToAnchor(view.topAnchor).active = true
	picker.bottomAnchor.constraintEqualToAnchor(view.bottomAnchor).active = true

	const actionId = nextActionId++
	picker.tag = actionId
	picker.target = buttonActionTarget
	picker.action = 'controlChanged:'
	actionHandlers.set(actionId, () => {
		const date = picker.dateValue
		const millis =
			typeof date?.timeIntervalSince1970 === 'number' ? date.timeIntervalSince1970 * 1000 : null

		if (millis === null) {
			return
		}

		try {
			onChange?.(millis)
		} catch (error) {
			console.error('[macos-leaf] date-picker change failed', error)
		}
	})

	return {
		update(next: PropBag) {
			const date = dateFromMillis(next?.selectionMillis)
			if (date && picker.dateValue?.timeIntervalSince1970 !== date.timeIntervalSince1970) {
				picker.dateValue = date
			}

			applyRange(next)
			picker.enabled = next?.enabled !== false
		},
		detach() {
			picker.target = null
			picker.action = null as unknown as string
			actionHandlers.delete(actionId)
			picker.removeFromSuperview()
		},
	}
}

const openSheets = new Set<any>()

let sheetDelegateTarget: any = null
try {
	class SheetDelegateTarget extends NSObject {
		static ObjCProtocols = [NSWindowDelegate]

		static ObjCExposedMethods = {
			windowWillClose: { params: [NSNotification], returns: interop.types.void },
			windowDidEndSheet: { params: [NSNotification], returns: interop.types.void },
		}

		static {
			NativeClass(this)
		}

		windowWillClose(notification: NSNotification) {
			finishSheetDismissal(notification?.object)
		}

		windowDidEndSheet(notification: NSNotification) {
			finishSheetDismissal(notification?.object)
		}
	}

	sheetDelegateTarget = SheetDelegateTarget.new()
} catch (error) {
	console.error(
		'[macos-leaf] sheet delegate registration failed — window close reporting disabled',
		error,
	)
}

function finishSheetDismissal(sheetWindow: any) {
	for (const entry of openSheets) {
		if (entry.sheetWindow !== sheetWindow) {
			continue
		}

		openSheets.delete(entry)
		const wasClosed = entry.closed
		entry.closed = true

		if (!wasClosed) {
			try {
				entry.onDismissed?.()
			} catch (error) {
				console.error('[macos-leaf] sheet dismissal failed', error)
			}
		}
	}
}

/** Creates a native window sheet target (beginSheet on the leaf's window),
 *  with a floating window when no parent is attached. The caller portals its
 *  own Octane subtree into `target` before calling `present()`. */
function presentSheet(view: NSView, options: PropBag) {
	if (
		typeof (globalThis as any).NSWindow?.alloc !== 'function' ||
		typeof (globalThis as any).NSViewController?.alloc !== 'function'
	) {
		return null
	}

	const parentWindow = view?.window ?? null
	const contentView = NSView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 480, height: 1 },
	})

	const entry = {
		target: contentView,
		parentWindow,
		sheetWindow: null as any,
		closed: false,
		presented: false,
		onDismissed: options?.onDismissed,
	}

	const close = () => {
		if (entry.closed) {
			return
		}

		entry.closed = true
		openSheets.delete(entry)
		try {
			if (parentWindow && entry.sheetWindow) {
				parentWindow.endSheet(entry.sheetWindow)
			} else if (entry.sheetWindow) {
				entry.sheetWindow.orderOut(null)
			}
		} catch (error) {
			console.error('[macos-leaf] sheet close failed', error)
		}
	}

	return {
		target: contentView,
		present() {
			if (entry.closed) {
				return false
			}

			if (entry.presented) {
				return true
			}

			const controller = NSViewController.alloc().init()
			controller.view = contentView
			const fit = popupFittingSize(contentView)
			const width = Math.max(fit?.width ?? 0, options?.minWidth ?? 360)
			const height = Math.max(fit?.height ?? 0, options?.minHeight ?? 160)

			const SM = (
				typeof NSWindowStyleMask === 'object' && NSWindowStyleMask ? NSWindowStyleMask : {}
			) as { [key: string]: number }

			const BT = (
				typeof NSBackingStoreType === 'object' && NSBackingStoreType ? NSBackingStoreType : {}
			) as { [key: string]: number }

			const sheet = NSWindow.alloc().initWithContentRectStyleMaskBackingDefer(
				{ origin: { x: 0, y: 0 }, size: { width, height } },
				(SM.Titled ?? 1) | (SM.Closable ?? 2),
				BT.Buffered ?? 2,
				false,
			)

			sheet.contentViewController = controller
			sheet.releasedWhenClosed = false
			if (sheetDelegateTarget) {
				sheet.delegate = sheetDelegateTarget
			}

			entry.sheetWindow = sheet
			openSheets.add(entry)

			try {
				if (parentWindow && typeof parentWindow.beginSheetCompletionHandler === 'function') {
					parentWindow.beginSheetCompletionHandler(sheet, () => finishSheetDismissal(sheet))
				} else {
					sheet.center?.()
					sheet.makeKeyAndOrderFront(null)
				}

				entry.presented = true
				return true
			} catch (error) {
				console.error('[macos-leaf] sheet presentation failed', error)
				close()
				return false
			}
		},
		close,
	}
}

const appKitBridge = (globalThis.__xplatAppKit ??= {})
installAppearanceBridge(appKitBridge)
appKitBridge.observeHover = observeHover
appKitBridge.showAnchoredPopup = showAnchoredPopup
appKitBridge.showLayer = (options: PropBag) =>
	showWindowLayer(options as WindowLayerOptions, {
		createRoot: (view: NSView, anchor: NSView) =>
			createMacOSRoot(view, { fontFamily: fontFamilyForView(anchor) }),
		fittingSize: popupFittingSize,
	})

appKitBridge.attachContextMenu = attachContextMenu
appKitBridge.attachDatePicker = attachDatePicker
appKitBridge.presentSheet = presentSheet
installPresentationBridge(appKitBridge, createMacOSRoot, fontFamilyForView)

const ownedRoots = new WeakMap<NSView, UniversalRoot>()

const rootFontFamilies = new WeakMap<object, string | undefined>()

function fontFamilyForView(view: NSView | undefined): string | undefined {
	for (let current: NSView | null | undefined = view; current; current = current.superview) {
		if (rootFontFamilies.has(current)) {
			return rootFontFamilies.get(current)
		}
	}

	return undefined
}

export interface MacOSRootOptions {
	/** Default font family for this root and its renderer-hosted overlays. */
	fontFamily?: string
}

export function createMacOSRoot(hostView: NSView, { fontFamily }: MacOSRootOptions = {}) {
	rootFontFamilies.set(hostView, fontFamily)
	const container: RootContainer = {
		hostView,
		fontFamily,
		nodes: new Map(),
		children: [],
		root: null,
		portalTargetIds: new WeakMap(),
		portalTargets: new Map(),
		nextPortalTargetId: 1,
		layoutDirty: null,
	}

	const root = createUniversalRoot(container, macOSDriver, {
		scheduleMicrotask: (callback) => queueMicrotask(callback),
		onUncaughtError: (error: any) =>
			console.error(
				'[macos-runtime] uncaught render error name=' +
					(error && error.name) +
					' message=' +
					(error && error.message) +
					' value=' +
					(typeof error === 'object' ? JSON.stringify(error) : String(error)) +
					' stack=' +
					(error && error.stack),
			),
	})

	container.root = root
	ownedRoots.set(hostView, root)
	const unmount = root.unmount.bind(root)
	root.unmount = () => {
		if (ownedRoots.get(hostView) === root) {
			ownedRoots.delete(hostView)
		}

		unmount()
	}

	if ((process.env as { [key: string]: string | undefined }).OCTANE_MACOS_AUTOMATION === '1') {
		const debug = {
			findId(id: string) {
				const node = [...container.nodes.values()].find((node) => node.props.id === id)
				return node &&
					[
						'proxyviewcontainer',
						'formattedstring',
						'span',
						'segmentedbaritem',
						'tabviewitem',
					].includes(node.type)
					? node
					: (node?.view ?? null)
			},
			measureParity(facets: readonly string[]) {
				return measureParity(container, facets)
			},
			metrics() {
				const nodeTypes: Record<string, number> = {}
				let nativeViewCount = 0
				let mountedRowCount = 0
				let mappedRowCount = 0
				let parentedRowCount = 0
				let nativeAttachedRowCount = 0
				let firstMountedRow = Number.POSITIVE_INFINITY
				let lastMountedRow = -1
				let firstMappedRow = Number.POSITIVE_INFINITY
				let lastMappedRow = -1
				const mountedRows: { index: number; height: number }[] = []
				const scrollViews: PropBag[] = []
				for (const node of container.nodes.values()) {
					nodeTypes[node.type] = (nodeTypes[node.type] ?? 0) + 1
					if (node.view) {
						nativeViewCount += 1
					}

					if (node.type === 'scrollview' && node.view) {
						const bounds = node.view.contentView.bounds
						scrollViews.push({
							id: node.props.id ?? null,
							verticalOffset: Number(bounds.origin.y ?? 0),
							viewportHeight: Number(bounds.size.height ?? 0),
							contentHeight: Number(node.view.documentView?.frame?.size?.height ?? 0),
						})
					}

					const match = /^(?:row-r|bench-row-)(\d+)$/.exec(String(node.props.id ?? ''))
					if (!match) {
						continue
					}

					mappedRowCount += 1
					const index = Number(match[1])
					firstMappedRow = Math.min(firstMappedRow, index)
					lastMappedRow = Math.max(lastMappedRow, index)
					if (node.parent !== null) {
						parentedRowCount += 1
					}

					if (node.view?.superview != null) {
						nativeAttachedRowCount += 1
					}

					if (node.parent !== null && node.view?.superview != null) {
						mountedRowCount += 1
						firstMountedRow = Math.min(firstMountedRow, index)
						lastMountedRow = Math.max(lastMountedRow, index)
						mountedRows.push({
							index,
							height: Number(node.view.frame?.size?.height ?? 0),
						})
					}
				}

				return {
					nodeCount: container.nodes.size,
					nativeViewCount,
					mountedRowCount,
					mappedRowCount,
					parentedRowCount,
					nativeAttachedRowCount,
					firstMountedRow: Number.isFinite(firstMountedRow) ? firstMountedRow : null,
					lastMountedRow: lastMountedRow >= 0 ? lastMountedRow : null,
					firstMappedRow: Number.isFinite(firstMappedRow) ? firstMappedRow : null,
					lastMappedRow: lastMappedRow >= 0 ? lastMappedRow : null,
					mountedRows,
					scrollViews,
					nodeTypes,
				}
			},
			scrollToId(id: string, offset: number) {
				const node = [...container.nodes.values()].find(
					(candidate) => candidate.type === 'scrollview' && candidate.props.id === id,
				)

				if (!node) {
					throw new Error('No AppKit ScrollView with id ' + id)
				}

				const clipView = (node.view! as NSScrollView).contentView
				clipView.scrollToPoint({ x: 0, y: Math.max(0, Number(offset) || 0) })
				node.view!.reflectScrolledClipView(clipView)
				return Number(clipView.bounds.origin.y ?? 0)
			},
			/** Web-style scroll offset: `top` is the distance from the
			 *  document's visual top (scrollTop semantics). Non-flipped
			 *  AppKit documents count clip origin y up from the bottom, so
			 *  the conversion inverts through the doc/clip heights. */
			scrollToTop(id: string, top: number) {
				const node = [...container.nodes.values()].find(
					(candidate) => candidate.type === 'scrollview' && candidate.props.id === id,
				)

				if (!node) {
					throw new Error('No AppKit ScrollView with id ' + id)
				}

				const clipView = (node.view! as NSScrollView).contentView
				const doc = node.view!.documentView
				const docH = Number(doc.frame.size.height)
				const clipH = Number(clipView.bounds.size.height)
				const flip = typeof doc.isFlipped === 'function' ? doc.isFlipped() : doc.isFlipped
				const flipped = flip === true || Number(flip) === 1
				const t = Math.min(Math.max(Number(top) || 0, 0), Math.max(0, docH - clipH))
				const y = flipped ? t : docH - clipH - t
				clipView.scrollToPoint({ x: 0, y })
				node.view!.reflectScrolledClipView(clipView)
				return flipped
					? Number(clipView.bounds.origin.y)
					: docH - clipH - Number(clipView.bounds.origin.y)
			},
			/** VirtualListBenchSnapshot for the scrollview with `id`: scrollTop-
			 *  style offset plus each mounted vlist-bench-row-* row's top-down
			 *  box relative to the viewport. Consumed by the app-side
			 *  platform/virtual-list-benchmark.macos adapter. */
			listSnapshot(id: string) {
				const node = [...container.nodes.values()].find(
					(candidate) => candidate.type === 'scrollview' && candidate.props.id === id,
				)

				if (!node) {
					throw new Error('No AppKit ScrollView with id ' + id)
				}

				const clipView = (node.view! as NSScrollView).contentView
				const doc = node.view!.documentView
				const clipH = Number(clipView.bounds.size.height)
				const docH = Number(doc?.frame?.size?.height ?? 0)
				const flip = typeof doc?.isFlipped === 'function' ? doc.isFlipped() : doc?.isFlipped
				const flipped = flip === true || Number(flip) === 1
				const originY = Number(clipView.bounds.origin.y ?? 0)
				// The VirtualList leaf publishes a content-space offset (anchored
				// to its top spacer, not the document frame) — prefer it since
				// docH-derived offsets drift every time estimates rebuild.
				const published = globalThis.__xplatVlistOffsets?.[id]
				const offset =
					typeof published === 'number' ? published : flipped ? originY : docH - clipH - originY

				const rows = descendants(node).flatMap((child) => {
					const match = /^vlist-bench-row-(\d+)$/.exec(String(child.props?.id ?? ''))
					if (!match || !child.view) {
						return []
					}

					try {
						// Row box relative to the clip's top edge, computed in doc
						// coordinates so it stays docH-independent like `offset`.
						const inDoc = child.view.superview!.convertRectToView(child.view.frame, doc)
						const h = Number(inDoc.size.height)
						const y = Number(inDoc.origin.y)
						const top = flipped ? y - originY : originY + clipH - y - h
						return [{ index: Number(match[1]), top, bottom: top + h }]
					} catch {
						return []
					}
				})

				return {
					offset,
					viewportHeight: clipH,
					rows,
					mountedIndices: rows.map((row) => row.index),
				}
			},
			/** Node frame in window base coordinates (points, y-up from the
			 *  window's bottom edge) — screenshot cropping consumes it. */
			frameInWindow(id: string) {
				if (id === ':host') {
					const winFrame = container.hostView.window?.frame
					return {
						x: 0,
						y: 0,
						w: Number(container.hostView.frame.size.width),
						h: Number(container.hostView.frame.size.height),
						isContentView: container.hostView.window?.contentView === container.hostView,
						autoresizingMask: Number(container.hostView.autoresizingMask ?? -1),
						translatesMask: Boolean(container.hostView.translatesAutoresizingMaskIntoConstraints),
						subviews: Number(container.hostView.subviews?.count ?? 0),
						window: winFrame
							? {
									w: Number(winFrame.size.width),
									h: Number(winFrame.size.height),
								}
							: null,
					}
				}

				const node = [...container.nodes.values()].find(
					(candidate) => candidate.props.id === id && candidate.view,
				)

				if (!node) {
					throw new Error('No AppKit view with id ' + id)
				}

				const rect = node.view!.convertRectToView(node.view!.bounds, null)
				return {
					x: Number(rect.origin.x),
					y: Number(rect.origin.y),
					w: Number(rect.size.width),
					h: Number(rect.size.height),
				}
			},
			/** Apply a single style prop on a mounted node — margin/layout probes. */
			setStyle(id: string, name: string, value: any) {
				const node = [...container.nodes.values()].find((candidate) => candidate.props.id === id)

				if (!node) {
					throw new Error('No AppKit node with id ' + id)
				}

				// Single-key writes merge into the node's style bag — applyStyle
				// diffs against the last applied bag, so a partial object here
				// would reset every other style.
				const style = { ...node.props?.style }
				if (value == null) {
					delete style[name]
				} else {
					style[name] = value
				}

				node.props = { ...node.props, style }
				applyStyle(node, style)
				container.hostView.layoutSubtreeIfNeeded?.()
				return this.frameInWindow(id)
			},
			/** Ancestor chain for a node id with frames — layout forensics. */
			ancestors(id: string) {
				const node = [...container.nodes.values()].find((candidate) => candidate.props.id === id)

				if (!node) {
					throw new Error('No AppKit node with id ' + id)
				}

				const chain: PropBag[] = []
				for (let cur: ElementNode | null = node; cur; cur = cur.parent) {
					chain.push({
						id: cur.props.id ?? null,
						type: cur.type,
						classes: nodeClasses(cur),
						frame: cur.view
							? {
									x: Number(cur.view.frame.origin.x),
									y: Number(cur.view.frame.origin.y),
									w: Number(cur.view.frame.size.width),
									h: Number(cur.view.frame.size.height),
								}
							: null,
					})
				}

				return chain
			},
			/** Per-cell geometry for the parity stage inside its ScrollView:
			 *  top-down document offsets plus the window-space rect at the
			 *  current scroll position, so a screenshot pass can choose
			 *  offsets and crop without re-querying the host. */
			parityCellFrames(scrollId: string) {
				const scroll = [...container.nodes.values()].find(
					(candidate) => candidate.type === 'scrollview' && candidate.props.id === scrollId,
				)

				if (!scroll) {
					throw new Error('No AppKit ScrollView with id ' + scrollId)
				}

				const stage = [...container.nodes.values()].find(
					(candidate) => candidate.props.id === 'parity-stage',
				)

				if (!stage) {
					throw new Error('No parity stage mounted')
				}

				container.hostView.window?.contentView?.layoutSubtreeIfNeeded?.()
				scroll.view!.layoutSubtreeIfNeeded?.()
				const doc = scroll.view!.documentView
				const clip = scroll.view!.contentView
				const docH = Number(doc.frame.size.height)
				const clipH = Number(clip.bounds.size.height)
				const flip = typeof doc.isFlipped === 'function' ? doc.isFlipped() : doc.isFlipped
				const flipped = flip === true || Number(flip) === 1
				const cells = []
				for (const cell of stage.children) {
					if (!cell.view || !nodeClasses(cell).includes('parity-cell')) {
						continue
					}

					const inDoc = cell.view.convertRectToView(cell.view.bounds, doc)
					const inWindow = cell.view.convertRectToView(cell.view.bounds, null)
					cells.push({
						name: String(cell.props.id ?? '').replace(/^cell-/, ''),
						top: flipped
							? Number(inDoc.origin.y)
							: docH - Number(inDoc.origin.y) - Number(inDoc.size.height),
						height: Number(inDoc.size.height),
						width: Number(inDoc.size.width),
						x: Number(inDoc.origin.x),
						window: {
							x: Number(inWindow.origin.x),
							y: Number(inWindow.origin.y),
							w: Number(inWindow.size.width),
							h: Number(inWindow.size.height),
						},
					})
				}

				const scrollInWindow = scroll.view!.convertRectToView(scroll.view!.bounds, null)
				return {
					docHeight: docH,
					viewportHeight: clipH,
					docFlipped: flipped,
					scrollTop: flipped
						? Number(clip.bounds.origin.y)
						: docH - clipH - Number(clip.bounds.origin.y),
					scrollWindow: {
						x: Number(scrollInWindow.origin.x),
						y: Number(scrollInWindow.origin.y),
						w: Number(scrollInWindow.size.width),
						h: Number(scrollInWindow.size.height),
					},
					cells,
				}
			},
			scrollStats(id: string) {
				const node = [...container.nodes.values()].find(
					(candidate) => candidate.type === 'scrollview' && candidate.props.id === id,
				)

				if (!node) {
					throw new Error('No AppKit ScrollView with id ' + id)
				}

				return { ...(node.scrollMetrics ?? { events: [] }) }
			},
			inspect(id: string) {
				const node = id.startsWith('type:')
					? [...container.nodes.values()].find(
							(candidate) => candidate.type === id.slice(5) && candidate.view,
						)
					: [...container.nodes.values()].find((candidate) => candidate.props?.id === id)

				if (!node?.view) {
					throw new Error('No AppKit view with id ' + id)
				}

				const view = node.view
				const appearance = view.effectiveAppearance ?? view.window?.effectiveAppearance
				const nativeWindow = view.window
				return {
					type: node.type,
					classes: nodeClasses(node),
					scheme: node.scheme ?? 'light',
					color: view.textColor ? (colorValue(view.textColor, appearance) ?? null) : null,
					backgroundColor: view.layer?.backgroundColor
						? (colorValue(NSColor.colorWithCGColor(view.layer.backgroundColor), appearance) ?? null)
						: null,
					frame: view.frame
						? {
								x: round(Number(view.frame.origin.x)),
								y: round(Number(view.frame.origin.y)),
								w: round(Number(view.frame.size.width)),
								h: round(Number(view.frame.size.height)),
							}
						: null,
					window: nativeWindow
						? {
								frame: {
									x: round(Number(nativeWindow.frame.origin.x)),
									y: round(Number(nativeWindow.frame.origin.y)),
									w: round(Number(nativeWindow.frame.size.width)),
									h: round(Number(nativeWindow.frame.size.height)),
								},
								contentSize: nativeWindow.contentView?.frame?.size
									? {
											w: round(Number(nativeWindow.contentView.frame.size.width)),
											h: round(Number(nativeWindow.contentView.frame.size.height)),
										}
									: null,
								fittingSize: nativeWindow.contentView?.fittingSize
									? {
											w: round(Number(nativeWindow.contentView.fittingSize.width)),
											h: round(Number(nativeWindow.contentView.fittingSize.height)),
										}
									: null,
								styleMask: Number(nativeWindow.styleMask ?? 0),
								colorScheme: globalThis.__xplatAppKit?.getColorScheme?.() ?? null,
							}
						: null,
				}
			},
			snapshot() {
				return {
					labels: [...container.nodes.values()]
						.filter((node) => node.type === 'label' && node.view)
						.map((node) => node.view!.stringValue),
					buttons: [...container.nodes.values()]
						.filter((node) => node.type === 'button' && node.view)
						.map((node) => node.view!.title),
					pressables: [...container.nodes.values()]
						.filter(
							(node) =>
								node.type === 'flexboxlayout' &&
								node.actionId !== undefined &&
								accessibilityRoles.get(node.actionId!) === 'button',
						)
						.map((node) => accessibilityLabels.get(node.actionId!)),
				}
			},
			/** Dispatch through the same event scope as the AppKit pan recognizer. */
			panView(view: any, event: PanEvent) {
				const handler = panHandlersByView.get(view)
				if (!handler) {
					throw new Error('No AppKit pan handler attached')
				}

				handler({ ...event, view })
			},
			pressId(id: string) {
				const node = [...container.nodes.values()].find((candidate) => candidate.props.id === id)
				if (!node || node.actionId === undefined) {
					throw new Error('No AppKit pressable with id ' + id)
				}

				invokeAction(node.actionId)
			},
			setText(idOrPlaceholder: string, value: any) {
				const node = [...container.nodes.values()].find(
					(candidate) =>
						(candidate.type === 'textfield' || candidate.type === 'textview') &&
						(candidate.props.id === idOrPlaceholder ||
							candidate.props.placeholder === idOrPlaceholder),
				)

				if (!node || node.actionId === undefined) {
					throw new Error('No AppKit text input with id or placeholder ' + idOrPlaceholder)
				}

				if (node.type === 'textview') {
					node.view!.string = String(value)
					buttonActionTarget.textDidChange({ object: node.view } as NSNotification)
				} else {
					node.view!.stringValue = String(value)
					buttonActionTarget.controlTextDidChange({ object: node.view } as NSNotification)
				}
			},
			pressAccessibilityLabel(label: string) {
				const node = [...container.nodes.values()].find(
					(candidate) =>
						candidate.type === 'flexboxlayout' &&
						candidate.actionId !== undefined &&
						accessibilityLabels.get(candidate.actionId) === label,
				)

				if (!node) {
					throw new Error('No AppKit pressable labeled ' + label)
				}

				if (!node.view!.accessibilityPerformPress()) {
					throw new Error('AppKit pressable has no action for ' + label)
				}
			},
			pressButton(title: string) {
				const node = [...container.nodes.values()].find(
					(candidate) => candidate.type === 'button' && candidate.view!.title === title,
				)

				if (!node) {
					throw new Error('No AppKit button titled ' + title)
				}

				node.view!.performClick(null)
			},
			hover(id: string, phase: 'enter' | 'exit') {
				const node = [...container.nodes.values()].find(
					(candidate) => candidate.props?.id === id && candidate.view,
				)

				if (!node) {
					throw new Error('No AppKit view with id ' + id)
				}

				const record = hoverRecordByView.get(node.view!)
				if (!record) {
					throw new Error('No hover observer on ' + id)
				}

				const handler = phase === 'exit' ? record.exit : record.enter
				if (typeof handler !== 'function') {
					throw new Error('No ' + phase + ' handler on ' + id)
				}

				handler()
			},
			openPopupCount() {
				return openPopups.size
			},
		}

		Object.defineProperty(root, '__macosDebug', { value: debug })
		Object.defineProperty(globalThis, '__xplatMacOSDebug', { value: debug, configurable: true })
	}

	return root
}

export * from 'octane/universal/native'

export { __PortalTabItem, __PortalList } from './portal-components.macos'
