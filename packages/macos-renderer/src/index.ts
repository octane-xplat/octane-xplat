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
import { installMasonElement, makeMasonHostView } from './mason'
import { installCompat } from './ns-compat'
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
import { computeCascade, INHERITED_CSS_PROPERTIES, type CssHostNode } from './css/cascade'
import {
	registerStylesheet,
	onStylesheetsChanged,
	setStyleEnvironment,
	stylesheetScope,
	stylesheetsHaveMediaRules,
} from './css/stylesheets'
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
	NSVisualEffectBlendingMode,
	NSVisualEffectMaterial,
	NSVisualEffectView,
	NSWindow,
	NSWindowDelegate,
	NSWindowOrderingMode,
	NSWindowStyleMask,
	NSWorkspace,
	NativeClass,
	WKWebView,
	interop,
} from '@octane-xplat/platform/macos'

import type { NSClass, NSControl } from '@octane-xplat/platform/macos'

export { registerFontFamily } from './fonts'
export { registerStylesheet } from './css/stylesheets'
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
	// CSS adapter: cssType/cssClasses/cssPseudoClasses/computedStyle/
	// computedCustomProps/getChildIndex/getChildAt/getChildrenCount.
	// Per-kind extras: placeholderView, placeholderContent, placeholderCreated,
	// sizeConstraints, placementPins, styleBg, bgSlot,
	// layoutObserver, scrollObserver, scheme, textRuns, appliedStyle,
	// styleFont*/classFont*/propFontSize, stylePaddingBox/Edges, classInsets,
	// styleRadius, classRadius, classSpacing, classOrientation, ...
	[key: string]: any
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
	/** Nodes needing a cascade recompute; flushed before layout reconcile. */
	cssDirty?: Set<ElementNode>
	cssFlushQueued?: boolean
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
	return (
		VIEW_PARENT_TYPES.has(type) || type === 'portalroot' || behaviorOf(type)?.container === true
	)
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
/** Optional per-type behavior — the extension seam for element types that
 *  live outside this file's dispatch switches (masonview today; plugin
 *  elements once the @nativescript/core compat slice lands). */
interface ElementBehavior {
	/** View factory — sets node.view (plus actionId/childHost as needed). */
	make?: (node: ElementNode, props: PropBag) => void
	/** Prop dispatch — return true when the prop was consumed. */
	applyProp?: (node: ElementNode, name: string, value: any) => boolean
	/** Manual child layout invoked from reconcileLayoutParent and frame
	 *  changes — implies children get no margin wrapper or size pins. */
	layout?: (parent: ElementNode) => void
	/** Teardown — runs at the top of destroy() before generic teardown. */
	destroy?: (node: ElementNode) => void
	/** Element hosts view children (VIEW_PARENT_TYPES semantics). */
	container?: boolean
	/** Consumes container plumbing styles: padding->dockInsets and the
	 *  gap-* classSpacing map. */
	containerStyles?: boolean
	/** Style keys this element (or its children) consume — suppresses the
	 *  unsupported-style warning for them. */
	styleKeys?: ReadonlySet<string>
}

const elementBehaviors = new Map<string, ElementBehavior>()

function registerElementType(type: string, behavior: ElementBehavior) {
	elementBehaviors.set(type, behavior)
}

function behaviorOf(type: string | undefined): ElementBehavior | undefined {
	return type ? elementBehaviors.get(type) : undefined
}

/** Parents that position children themselves — child margins and size
 *  constraints are consumed by the host's own layout pass. */
function isManualLayoutParent(type: string | undefined) {
	return (
		['contentview', 'actionbar', 'rootlayout'].includes(type ?? '') ||
		behaviorOf(type)?.layout != null
	)
}

const compatInstallation = installCompat({
	registerElementType,
	applyStyle: setNodeInlineStyle,
	applyClassName,
	applyAccessibility,
	queueLayoutReconcile,
})

const rootLayoutNodesByView = new WeakMap<object, ElementNode>()
const contentViewNodesByView = new WeakMap<object, ElementNode>()
const placeholderNodesByView = new WeakMap<object, ElementNode>()
const placeholderContentOwners = new WeakMap<object, ElementNode>()
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

// The macOS Slider uses the grid host as an overlay when no tracks are set.

/** Plain NSView host for interactive containers — tap/keyboard/AX actions
 *  dispatch through the shared actionId registry. Mason-backed containers
 *  subclass this so a tappable stack/grid exposes the same accessibility
 *  surface the old NSStackView host did. */
class AccessibleHostView extends NSView {
	// Self-drawn AppKit hosts need a responder so modal decisions can use the
	// keyboard as well as accessibility actions.
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
		return actionIdsByView.get(this) === undefined
	}
}

// Runs below AccessibleHostView so mason container hosts subclass it — class
// declarations are not hoisted.
const masonElementRegistration = installMasonElement({
	registerElementType,
	layoutView,
	pinLayoutChild,
	queueLayoutReconcile,
	detach,
	applyStyle: setNodeInlineStyle,
	applyClassName,
	applyAccessibility,
	wireAction: wireViewAction,
	setAction,
	setPanAction,
	makeScrollView,
	baseView: AccessibleHostView,
})

// NativeScript 9.1.2/9.1.3 (MIT): LiquidGlassCommon extends GridLayout, so
// children follow grid placement and sizing rules. iOS roots them in a
// UIVisualEffectView content host; Android ships the plain grid. The AppKit
// host is a plain NSView laid out like a grid, with the glass material
// as a backdrop subview pinned behind the children. Keeping children outside
// the NSVisualEffectView subtree preserves authored text colors — effect-view
// descendants render vibrantly, which would silently override shared props.
class LiquidGlassView extends NSView {
	static {
		NativeClass(this)
	}

	layout() {
		super.layout()
		const node = gridLayoutNodesByView.get(this)
		if (node) {
			behaviorOf('liquidglass')?.layout?.(node)
		}
	}
}

// NativeScript ActionBar's title slot: a title label until a view is assigned.
// The host identity remains stable across both forms of content.
class ActionBarHost extends NSView {
	static {
		NativeClass(this)
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	get intrinsicContentSize() {
		const node = contentViewNodesByView.get(this)
		const child = node?.projectedChildren
			? node.projectedChildren[0]
			: (node?.contentChild ?? node?.actionBarDisplay)

		const size = child?.view?.intrinsicContentSize
		const dimension = (axis: 'width' | 'height') =>
			Math.max(
				0,
				Number(
					effectiveStyle(child)?.[axis] ??
						(Number(size?.[axis]) >= 0 ? size?.[axis] : child?.view?.fittingSize?.[axis]),
				) || 0,
			)

		return { width: dimension('width'), height: Math.max(44, dimension('height')) }
	}

	layout() {
		super.layout()
		syncActionBar(contentViewNodesByView.get(this))
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
					effectiveStyle(child)[axis] ??
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

// A single consumer-supplied native slot (NativeScript Placeholder). The
// element keeps its own host NSView — `creatingView` assigns `event.view`,
// which is pinned to the host's edges so it occupies the whole slot.
class PlaceholderHostView extends NSView {
	static {
		NativeClass(this)
	}

	// @ts-ignore ObjC accessor methods satisfy the generated @property member.
	get intrinsicContentSize() {
		const node = placeholderNodesByView.get(this)
		const view = node?.placeholderContent
		if (!view) {
			return { width: 0, height: 0 }
		}

		const intrinsic = view.intrinsicContentSize
		const fitting = view.fittingSize
		const size = (axis: 'width' | 'height') =>
			Math.max(
				0,
				Number((Number(intrinsic?.[axis]) >= 0 ? intrinsic?.[axis] : fitting?.[axis]) ?? 0) || 0,
			)

		return { width: size('width'), height: size('height') }
	}
}

// Mirrors NativeScript 9.1.2 (MIT): ui/layouts/dock-layout/index.ios.ts
// and ViewHelper's measurement/alignment rules. Ordered strips need NSView,
// not NSStackView's single layout axis.

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

// Wrapping must be allowed to shrink on its flow axis. A 750-point
// intrinsic compression priority outranks WindowSizeStayPut (500) and forces
// the window back to the old row/column length before any reflow can occur.

function makeContentView() {
	const view = ContentViewHost.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 0, height: 0 },
	})

	view.translatesAutoresizingMaskIntoConstraints = false
	return view
}

function makeActionBar(node: ElementNode) {
	const view = ActionBarHost.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 0, height: 44 },
	})

	view.translatesAutoresizingMaskIntoConstraints = false
	node.actionBarTitle = makeLabel()
	node.actionBarTitleViewProp = node.props.titleView
	node.actionBarExternal = node.props.titleView ?? null
	return view
}

function validateActionBarTitleView(node: ElementNode, view: NSView | null | undefined) {
	if (!view) {
		return
	}

	if (view === node.view || node.view?.isDescendantOf?.(view)) {
		throw new TypeError('AppKit actionbar titleView would cycle the hierarchy')
	}

	if (ownedRoots.has(view) || (nodeContainersByView.has(view) && view.superview !== node.view)) {
		throw new TypeError('AppKit actionbar titleView is owned by another Octane host')
	}

	if (view.superview && view.superview !== node.view) {
		throw new TypeError('AppKit actionbar titleView already belongs to another host')
	}
}

function setActionBarTitleView(node: ElementNode, view: NSView | null | undefined) {
	validateActionBarTitleView(node, view)
	node.actionBarTitleViewProp = view
	const child = node.projectedChildren ? node.projectedChildren[0] : node.contentChild
	// Assigning the already active JSX title is a no-op in NativeScript.
	if (child && child.view === view) {
		node.actionBarExternal = null
		return
	}

	node.actionBarExternal = view ?? null
	if (node.contentChild) {
		for (const current of node.projectedChildren ?? [node.contentChild]) {
			releasePlacementPins(current)
			current.view?.removeFromSuperview()
		}

		node.contentChild = null
	}
}

function syncActionBar(node: ElementNode | undefined) {
	if (!node?.view) {
		return
	}

	const child = node.projectedChildren ? node.projectedChildren[0] : node.contentChild
	const external = node.actionBarExternal
	const view = child?.view ?? external ?? node.actionBarTitle
	if (!child) {
		validateActionBarTitleView(node, view)
	}

	const previous = node.actionBarDisplay
	if (previous?.view !== view) {
		if (previous) {
			releasePlacementPins(previous)
			previous.view.removeFromSuperview()
		}

		node.actionBarDisplay = null
	}

	if (view === node.actionBarTitle) {
		view.stringValue = String(node.props.title ?? '')
	}

	if (!child) {
		if (view.superview !== node.view) {
			node.view.addSubview(view)
		}

		view.translatesAutoresizingMaskIntoConstraints = false
		if (!node.actionBarDisplay) {
			const intrinsic = view.intrinsicContentSize
			const style: PropBag = {}
			for (const axis of ['width', 'height']) {
				if (Number(intrinsic?.[axis]) < 0) {
					style[axis] = Number(view.frame.size[axis]) || Number(view.fittingSize?.[axis]) || 0
				}
			}

			node.actionBarDisplay = { view, props: { style }, container: node.container }
		}

		layoutContentChild({
			...node,
			contentChild: node.actionBarDisplay,
			projectedChildren: undefined,
		})
	} else {
		layoutContentChild(node)
	}

	node.view.wantsLayer = true
	node.view.layer.shadowOpacity = node.props.flat ? 0 : 0.2
	node.view.layer.shadowRadius = node.props.flat ? 0 : 1
}

function makePlaceholder(node: ElementNode) {
	const view = PlaceholderHostView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 0, height: 0 },
	})

	view.translatesAutoresizingMaskIntoConstraints = false
	placeholderNodesByView.set(view, node)
	return view
}

/** NativeScript Placeholder (MIT): createNativeView raises `creatingView`
 *  once when the element attaches and the handler assigns `event.view`.
 *  Upstream the assigned view becomes the element's native view; here the
 *  host keeps its own NSView and pins the assigned view to its edges, so
 *  `event.object`, refs and `getPublicInstance` stay the element's host. */
function fireCreatingView(node: ElementNode) {
	if (node.type !== 'placeholder' || node.placeholderCreated || !node.view) {
		return
	}

	node.placeholderCreated = true
	const handler = node.props.onCreatingView
	if (typeof handler !== 'function') {
		return
	}

	const event: { eventName: string; object: any; view?: any } = {
		eventName: 'creatingView',
		object: node.view,
	}

	node.container.root!.eventScope('discrete', () => handler(event))
	const view = event.view
	if (view == null) {
		return
	}

	if (!(view instanceof NSView)) {
		throw new TypeError(
			'[macos-host] placeholder creatingView must assign an AppKit NSView to event.view',
		)
	}

	if (view === node.view || node.view.isDescendantOf(view)) {
		throw new TypeError(
			'[macos-host] placeholder creatingView assigned a view that would cycle the hierarchy',
		)
	}

	if (placeholderContentOwners.get(view)) {
		throw new TypeError(
			'[macos-host] placeholder creatingView assigned a host already owned by another placeholder',
		)
	}

	for (const other of node.container.nodes.values()) {
		if (other !== node && (other.view === view || other.placeholderContent === view)) {
			throw new TypeError(
				'[macos-host] placeholder creatingView assigned a host already used by another element',
			)
		}
	}

	const owner = nodeContainersByView.get(view)
	if (owner && owner !== node.container) {
		throw new TypeError(
			'[macos-host] placeholder creatingView assigned a host owned by another Octane root',
		)
	}

	if (node.placeholderContent && node.placeholderContent !== view) {
		node.placeholderContent.removeFromSuperview()
		placeholderContentOwners.delete(node.placeholderContent)
	}

	node.placeholderContent = view
	placeholderContentOwners.set(view, node)
	nodeContainersByView.set(view, node.container)
	view.removeFromSuperview()
	view.translatesAutoresizingMaskIntoConstraints = false
	node.view.addSubview(view)
	const host = node.view as AppKitView
	for (const anchor of ['leading', 'trailing', 'top', 'bottom']) {
		;(view as AppKitView)[anchor + 'Anchor'].constraintEqualToAnchor(
			host[anchor + 'Anchor'],
		).active = true
	}

	node.view.invalidateIntrinsicContentSize()
	queueLayoutReconcile(node.container, node.layoutParent ?? node.parent)
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

const MARGIN_SIDES: Record<string, string> = {
	marginTop: 'top',
	marginRight: 'right',
	marginBottom: 'bottom',
	marginLeft: 'left',
}

function layoutView(node: ElementNode) {
	return node.textViewport ?? node.view
}

/** Wrap/unwrap/re-apply margins on a node that is already arranged inside a
 *  stack. Margins set before insert are materialized there instead. */

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

	const parent = node.layoutParent ?? node.parent
	if (isManualLayoutParent(parent?.type)) {
		queueLayoutReconcile(node.container, parent)
	}
}

/** Reconcile one gravity area with the children's desired views. Only
 *  re-parented children land in `moved` — detaching a view that is (or
 *  contains) the first responder ends the active editing session. */

/** Wires tap/click handling + the accessibility actionId onto any view —
 *  shared by stack factories and mason-backed container views. */
function wireViewAction(view: NSView, props: PropBag): number | undefined {
	const interactive = typeof props.onTap === 'function' || props.accessibilityRole === 'button'

	// Accessibility props need the AX id too — a 'checkbox'/'link' role or a
	// bare accessibilityLabel must not drop every accessibility prop.
	const actionId =
		interactive || props.accessibilityRole !== undefined || props.accessibilityLabel !== undefined
			? nextActionId++
			: undefined

	if (actionId !== undefined) {
		if (interactive) {
			view.addGestureRecognizer(
				configureGesture(
					NSClickGestureRecognizer.alloc().initWithTargetAction(buttonActionTarget, 'viewPressed:'),
				),
			)
		}

		actionIdsByView.set(view, actionId)
		actionHandlers.set(actionId, null)
	}

	return actionId
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

function makeScrollView(node: ElementNode) {
	const scroll = NSScrollView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 480, height: 320 },
	})

	// The document view is a mason host — the engine sizes it to content and
	// pins scroll children inside it.
	const content = makeMasonHostView(node)
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
	if (!observed || observed === layoutView(node)) {
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
	const target = layoutView(node)
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

function makeLiquidGlass(node: ElementNode) {
	const view = LiquidGlassView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 140, height: 28 },
	})

	view.translatesAutoresizingMaskIntoConstraints = false
	// Grid placement is resolved in layout() from current bounds, so a frame
	// change must queue the same reconcile the other manual hosts perform.
	view.postsFrameChangedNotifications = true
	node.glassGeometryObserver =
		NSNotificationCenter.defaultCenter.addObserverForNameObjectQueueUsingBlock(
			NSViewFrameDidChangeNotification,
			view,
			null,
			() => {
				if (gridLayoutNodesByView.get(view) === node) {
					queueLayoutReconcile(node.container, node)
				}
			},
		)

	const backdrop = NSVisualEffectView.alloc().initWithFrame({
		origin: { x: 0, y: 0 },
		size: { width: 140, height: 28 },
	})

	// UnderWindowBackground is the platform glass material — the reliable,
	// appearance-following analog of iOS's clear glass. Within-window blending
	// needs content behind the view inside the same window and would render no
	// effect in the common empty-window case.
	backdrop.material = NSVisualEffectMaterial.UnderWindowBackground
	backdrop.blendingMode = NSVisualEffectBlendingMode.Behind
	backdrop.translatesAutoresizingMaskIntoConstraints = false
	view.addSubview(backdrop)
	backdrop.leadingAnchor.constraintEqualToAnchor(view.leadingAnchor).active = true
	backdrop.trailingAnchor.constraintEqualToAnchor(view.trailingAnchor).active = true
	backdrop.topAnchor.constraintEqualToAnchor(view.topAnchor).active = true
	backdrop.bottomAnchor.constraintEqualToAnchor(view.bottomAnchor).active = true
	node.glassBackdrop = backdrop
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
	const desired = effectiveStyle(child)[axis]
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

	// Each child receives the whole padded cell.
	for (const child of parent.projectedChildren ?? parent.children) {
		if (!child.view) {
			continue
		}

		layoutContentChild({ ...parent, projectedChildren: [child] })
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
	const style = effectiveStyle(child)
	const intrinsic = layoutView(child).intrinsicContentSize ?? { width: 0, height: 0 }
	const alignment = (value: any, start: string, end: string, fallback: string) => {
		if (value == null || value === 'auto' || value === 'normal') {
			return fallback
		}

		if (['start', 'self-start', 'flex-start'].includes(value)) {
			return start
		}

		if (['end', 'self-end', 'flex-end'].includes(value)) {
			return end
		}

		return value
	}
	const horizontal = alignment(
		style.justifySelf,
		'left',
		'right',
		child.props.horizontalAlignment ?? (parent.type === 'actionbar' ? 'center' : 'stretch'),
	)

	const vertical = alignment(
		style.alignSelf,
		'top',
		'bottom',
		child.props.verticalAlignment ?? (parent.type === 'actionbar' ? 'middle' : 'stretch'),
	)

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

	const pad = parent.dockInsets ?? {}
	const [x, childWidth] = axis(
		width,
		style.width,
		intrinsic.width,
		horizontal,
		(margins.left ?? 0) + (pad.left ?? 0),
		(margins.right ?? 0) + (pad.right ?? 0),
	)

	const [top, childHeight] = axis(
		height,
		style.height,
		intrinsic.height,
		vertical,
		(margins.top ?? 0) + (pad.top ?? 0),
		(margins.bottom ?? 0) + (pad.bottom ?? 0),
	)

	pinLayoutChild(child, parent.view, x, top, childWidth, childHeight)
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
	updateImage(image, props.src, props.placeholder)

	return image
}

/** Types whose views arrange child views; mirrors the check in insert(). */
const VIEW_PARENT_TYPES = new Set([
	'rootlayout',
	'contentview',
	'actionbar',
	'proxyviewcontainer',
	'masonview',
	'scrollview',
	'liquidglass',
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
	'placeholder',
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
	if (!SUPPORTED_TYPES.has(type) && !elementBehaviors.has(type)) {
		throw new Error('AppKit spike does not support <' + type + '>')
	}
}

/** Deterministic prop failures that would otherwise throw after views and
 *  registrations exist. `baseProps` supplies already-applied props for
 *  update commands so merged-prop rules (e.g. placeholder color) stay exact. */
function validateNodeProps(type: string, props: PropBag | undefined, baseProps?: PropBag) {
	if (type === 'actionbar' && props?.titleView != null && !(props.titleView instanceof NSView)) {
		throw new TypeError('AppKit actionbar titleView must be an AppKit NSView')
	}

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
						!(VIEW_PARENT_TYPES.has(parent) || behaviorOf(parent)?.container === true)
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

	if (
		type === 'placeholder' &&
		props?.onCreatingView != null &&
		typeof props.onCreatingView !== 'function'
	) {
		throw new Error('AppKit placeholder onCreatingView must be a function')
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
		type === 'scrollview' &&
		props?.orientation != null &&
		!['horizontal', 'vertical', 'both'].includes(props.orientation)
	) {
		throw new Error(
			'[macos-host] ' + type + ' orientation must be horizontal, vertical or both',
		)
	}

	if (props?.dock != null && !['left', 'top', 'right', 'bottom'].includes(props.dock)) {
		throw new Error('[macos-host] dock must be left, top, right or bottom')
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
		cssType: type,
		cssClasses: new Set(),
		cssPseudoClasses: new Set(),
		computedStyle: undefined,
		computedCustomProps: new Map(),
	}
	node.getChildIndex = (child: ElementNode) => cssChildren(node).indexOf(child)
	node.getChildAt = (i: number) => cssChildren(node)[i]
	node.getChildrenCount = () => cssChildren(node).length

	try {
		const makeBehavior = behaviorOf(type)?.make
		if (makeBehavior) {
			// Registered element behaviors own their factory (mason-backed
			// containers, plugin elements).
			makeBehavior(node, props)
		} else {
			switch (type) {
				case 'rootlayout':
					node.view = makeRootLayout(node)
					break
				case 'actionbar':
				case 'contentview':
					node.view = type === 'actionbar' ? makeActionBar(node) : makeContentView()
					contentViewNodesByView.set(node.view!, node)
					observeContentGeometry(node)
					break
				case 'liquidglass':
					node.view = makeLiquidGlass(node)
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
					const scroll = makeScrollView(node)
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
				case 'placeholder':
					node.view = makePlaceholder(node)
					break
				case 'proxyviewcontainer':
				case 'formattedstring':
				case 'segmentedbaritem':
				case 'span':
					break
				default: {
					const behavior = behaviorOf(type)
					if (!behavior?.make) {
						throw new Error('AppKit spike does not support <' + type + '>')
					}

					behavior.make(node, props)
					break
				}
			}
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

		if (type === 'liquidglass') {
			gridLayoutNodesByView.set(node.view!, node)
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

// CSS named colors (hex ints). NS Color supports the full CSS keyword set —
// this table covers the common names; extend as needed.
const CSS_NAMED_COLORS: Record<string, number> = {
	transparent: 0x000000,
	aliceblue: 0xf0f8ff, antiquewhite: 0xfaebd7, aqua: 0x00ffff, aquamarine: 0x7fffd4,
	azure: 0xf0ffff, beige: 0xf5f5dc, bisque: 0xffe4c4, black: 0x000000,
	blanchedalmond: 0xffebcd, blue: 0x0000ff, blueviolet: 0x8a2be2, brown: 0xa52a2a,
	burlywood: 0xdeb887, cadetblue: 0x5f9ea0, chartreuse: 0x7fff00, chocolate: 0xd2691e,
	coral: 0xff7f50, cornflowerblue: 0x6495ed, cornsilk: 0xfff8dc, crimson: 0xdc143c,
	cyan: 0x00ffff, darkblue: 0x00008b, darkcyan: 0x008b8b, darkgoldenrod: 0xb8860b,
	darkgray: 0xa9a9a9, darkgrey: 0xa9a9a9, darkgreen: 0x006400, darkkhaki: 0xbdb76b,
	darkmagenta: 0x8b008b, darkolivegreen: 0x556b2f, darkorange: 0xff8c00, darkorchid: 0x9932cc,
	darkred: 0x8b0000, darksalmon: 0xe9967a, darkseagreen: 0x8fbc8f, darkslateblue: 0x483d8b,
	darkslategray: 0x2f4f4f, darkslategrey: 0x2f4f4f, darkturquoise: 0x00ced1, darkviolet: 0x9400d3,
	deeppink: 0xff1493, deepskyblue: 0x00bfff, dimgray: 0x696969, dimgrey: 0x696969,
	dodgerblue: 0x1e90ff, firebrick: 0xb22222, floralwhite: 0xfffaf0, forestgreen: 0x228b22,
	fuchsia: 0xff00ff, gainsboro: 0xdcdcdc, ghostwhite: 0xf8f8ff, gold: 0xffd700,
	goldenrod: 0xdaa520, gray: 0x808080, grey: 0x808080, green: 0x008000, greenyellow: 0xadff2f,
	honeydew: 0xf0fff0, hotpink: 0xff69b4, indianred: 0xcd5c5c, indigo: 0x4b0082,
	ivory: 0xfffff0, khaki: 0xf0e68c, lavender: 0xe6e6fa, lavenderblush: 0xfff0f5,
	lawngreen: 0x7cfc00, lemonchiffon: 0xfffacd, lightblue: 0xadd8e6, lightcoral: 0xf08080,
	lightcyan: 0xe0ffff, lightgoldenrodyellow: 0xfafad2, lightgray: 0xd3d3d3, lightgrey: 0xd3d3d3,
	lightgreen: 0x90ee90, lightpink: 0xffb6c1, lightsalmon: 0xffa07a, lightseagreen: 0x20b2aa,
	lightskyblue: 0x87cefa, lightslategray: 0x778899, lightslategrey: 0x778899, lightsteelblue: 0xb0c4de,
	lightyellow: 0xffffe0, lime: 0x00ff00, limegreen: 0x32cd32, linen: 0xfaf0e6,
	magenta: 0xff00ff, maroon: 0x800000, mediumaquamarine: 0x66cdaa, mediumblue: 0x0000cd,
	mediumorchid: 0xba55d3, mediumpurple: 0x9370db, mediumseagreen: 0x3cb371, mediumslateblue: 0x7b68ee,
	mediumspringgreen: 0x00fa9a, mediumturquoise: 0x48d1cc, mediumvioletred: 0xc71585, midnightblue: 0x191970,
	mintcream: 0xf5fffa, mistyrose: 0xffe4e1, moccasin: 0xffe4b5, navajowhite: 0xffdead,
	navy: 0x000080, oldlace: 0xfdf5e6, olive: 0x808000, olivedrab: 0x6b8e23,
	orange: 0xffa500, orangered: 0xff4500, orchid: 0xda70d6, palegoldenrod: 0xeee8aa,
	palegreen: 0x98fb98, paleturquoise: 0xafeeee, palevioletred: 0xdb7093, papayawhip: 0xffefd5,
	peachpuff: 0xffdab9, peru: 0xcd853f, pink: 0xffc0cb, plum: 0xdda0dd,
	powderblue: 0xb0e0e6, purple: 0x800080, rebeccapurple: 0x663399, red: 0xff0000,
	rosybrown: 0xbc8f8f, royalblue: 0x4169e1, saddlebrown: 0x8b4513, salmon: 0xfa8072,
	sandybrown: 0xf4a460, seagreen: 0x2e8b57, seashell: 0xfff5ee, sienna: 0xa0522d,
	silver: 0xc0c0c0, skyblue: 0x87ceeb, slateblue: 0x6a5acd, slategray: 0x708090,
	slategrey: 0x708090, snow: 0xfffafa, springgreen: 0x00ff7f, steelblue: 0x4682b4,
	tan: 0xd2b48c, teal: 0x008080, thistle: 0xd8bfd8, tomato: 0xff6347,
	turquoise: 0x40e0d0, violet: 0xee82ee, wheat: 0xf5deb3, white: 0xffffff,
	whitesmoke: 0xf5f5f5, yellow: 0xffff00, yellowgreen: 0x9acd32,
}

function nativeColor(value: any): NSColor {
	const string = String(value).trim().toLowerCase()
	let match = /^#([\da-f]{3})$/i.exec(string)
	if (match) {
		const hex = match[1]
		return NSColor.colorWithRedGreenBlueAlpha(
			parseInt(hex[0] + hex[0], 16) / 255,
			parseInt(hex[1] + hex[1], 16) / 255,
			parseInt(hex[2] + hex[2], 16) / 255,
			1,
		)
	}

	match = /^#([\da-f]{4})$/i.exec(string)
	if (match) {
		const hex = match[1]
		return NSColor.colorWithRedGreenBlueAlpha(
			parseInt(hex[0] + hex[0], 16) / 255,
			parseInt(hex[1] + hex[1], 16) / 255,
			parseInt(hex[2] + hex[2], 16) / 255,
			parseInt(hex[3] + hex[3], 16) / 255,
		)
	}

	match = /^#([\da-f]{6})$/i.exec(string)
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

	const named = CSS_NAMED_COLORS[string]
	if (named !== undefined) {
		return NSColor.colorWithRedGreenBlueAlpha(
			((named >> 16) & 0xff) / 255,
			((named >> 8) & 0xff) / 255,
			(named & 0xff) / 255,
			string === 'transparent' ? 0 : 1,
		)
	}

	match = /^hsla?\(\s*(-?[\d.]+)(?:deg|turn|rad)?[,\s]+([\d.]+)%?[,\s]+([\d.]+)%?[,\s/]*([\d.]*)\s*\)$/i.exec(
		string,
	)
	if (match) {
		let h = parseFloat(match[1])
		if (/turn/i.test(string)) {
			h *= 360
		} else if (/rad/i.test(string)) {
			h = (h * 180) / Math.PI
		}
		h = ((h % 360) + 360) % 360
		const sat = Math.min(100, Math.max(0, parseFloat(match[2]))) / 100
		const light = Math.min(100, Math.max(0, parseFloat(match[3]))) / 100
		const alpha = match[4] === '' ? 1 : Math.min(1, Math.max(0, Number(match[4])))
		const c = (1 - Math.abs(2 * light - 1)) * sat
		const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
		const m = light - c / 2
		const seg = Math.floor(h / 60) % 6
		const rgb = [[c,x,0],[x,c,0],[0,c,x],[0,x,c],[x,0,c],[c,0,x]][seg]
		return NSColor.colorWithRedGreenBlueAlpha(
			Math.min(1, Math.max(0, rgb[0] + m)),
			Math.min(1, Math.max(0, rgb[1] + m)),
			Math.min(1, Math.max(0, rgb[2] + m)),
			alpha,
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
		'AppKit spike expects hex, rgb()/rgba(), or hsl()/hsla() colors, received ' + string,
	)
}

// ---- CSS cascade ------------------------------------------------------------

// The vendored NS selector engine matches against `node` directly: cssType is
// the element type lowercased (NS `cssType` semantics — `stack-layout` ->
// `stacklayout` happens on the selector side via TypeSelector name mangling),
// cssClasses come from the className prop, cssPseudoClasses from wired state.

/** CSS-visible element children — #text/span/format wrappers fold into text. */
function cssChildren(node: ElementNode): ElementNode[] {
	return node.children.filter((child) => child.view != null || child.type === 'proxyviewcontainer')
}

function cssParentOf(node: ElementNode): ElementNode | null {
	let parent = node.parent
	while (parent && parent.view == null && parent.type !== 'proxyviewcontainer') {
		parent = parent.parent
	}
	return parent
}

/** Root container top-level nodes (incl. portal/list-cell/sheet roots) carry
 *  the NS ambient classes: ns-root, ns-macos, ns-light|ns-dark. */
function isCssRootNode(node: ElementNode): boolean {
	return node.parent === null
}

function cssSchemeName(_node: ElementNode): string {
	return (appKitBridge as any).getColorScheme?.() === 'dark' ? 'dark' : 'light'
}

// Per-container dirty sets — flushed top-down before the layout reconcile pass
// inside a batch, or coalesced onto one microtask outside a batch.
function markStyleDirty(node: ElementNode, subtree = false) {
	const container = node.container
	if (!container) {
		return
	}
	;(container.cssDirty ??= new Set()).add(node)
	if (subtree) {
		for (const child of cssChildren(node)) {
			markStyleDirty(child, true)
		}
	}
	if (container.layoutDirty == null && !container.cssFlushQueued) {
		// Outside a command batch (appearance change, registerStylesheet) —
		// one microtask flush per container; a batch starting first wins.
		container.cssFlushQueued = true
		queueMicrotask(() => {
			container.cssFlushQueued = false
			if (container.layoutDirty == null) {
				flushStyleDirty(container)
			}
		})
	}
}

function flushStyleDirty(container: RootContainer) {
	const dirty = container.cssDirty
	container.cssDirty = undefined
	if (!dirty?.size) {
		return
	}

	// Style applies queue layout work. Inside a command batch the batch drains
	// it; outside one, open a layout batch so each apply doesn't reconcile
	// its parent synchronously.
	const ownsLayoutBatch = container.layoutDirty == null
	if (ownsLayoutBatch) {
		container.layoutDirty = new Set()
	}

	// Top-down: parents must compute before children that inherit from them.
	const nodes = [...dirty].sort((a, b) => cssDepth(a) - cssDepth(b))
	for (const node of nodes) {
		// Dead nodes (destroyed/detached before the flush) skip the restyle.
		if (node.container.nodes && !node.container.nodes.has(node.id) && node.type !== 'portalroot') {
			continue
		}
		restyleNode(node)
	}

	if (ownsLayoutBatch) {
		const layoutDirty = container.layoutDirty!
		container.layoutDirty = null
		drainLayoutDirty(layoutDirty)
	}
}

function cssDepth(node: ElementNode): number {
	let depth = 0
	for (let p = node.parent; p; p = p.parent) {
		depth++
	}
	return depth
}


function shallowEqualStyle(a: PropBag, b: PropBag) {
	const keys = Object.keys(a)
	return keys.length === Object.keys(b).length && keys.every((key) => a[key] === b[key])
}

/** Recompute one node's effective style and apply it. Caller guarantees the
 *  parent is already styled (top-down flush order). */
function restyleNode(node: ElementNode) {
	refreshCssClasses(node)
	const { style, customProps, cssKeys, inheritedKeys } = computeCascade(
		node as unknown as CssHostNode,
		stylesheetScope(),
	)
	node.cssOriginKeys = cssKeys
	node.inheritedOnlyKeys = inheritedKeys
	const prevStyle = node.computedStyle ?? {}
	const prevCustom = node.computedCustomProps ?? new Map()
	node.computedStyle = style
	node.computedCustomProps = customProps

	const customChanged =
		prevCustom.size !== customProps.size ||
		[...customProps].some(([k, v]) => prevCustom.get(k) !== v)
	let inheritedChanged = false
	for (const prop of INHERITED_CSS_PROPERTIES) {
		const camel = prop.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase())
		if (prevStyle[camel] !== style[camel]) {
			inheritedChanged = true
			break
		}
	}

	// Unchanged effective styles skip the native apply: most restyles (class or
	// sibling marks, ancestor cascades) resolve to the same bag.
	if (!shallowEqualStyle(prevStyle, style) || !node.appliedStyle) {
		applyStyle(node, style)
		syncInputChrome(node)
		// Text attributes (font, line height) bake into the attributed string,
		// which applyProps built before this restyle resolved the font.
		if (node.type === 'htmlview') {
			syncHtmlView(node)
		} else {
			syncText(node)
		}
	}

	// Only cascade to children when values they could inherit moved.
	if (customChanged || inheritedChanged) {
		for (const child of cssChildren(node)) {
			restyleNode(child)
		}
	}
}

let cssWarnedProps = new Set<string>()
function warnUnsupportedCssProp(node: ElementNode, name: string) {
	if (cssWarnedProps.has(name)) {
		return
	}
	cssWarnedProps.add(name)
	console.warn('[macos-css] ignored unsupported property ' + name + ' (on <' + node.type + '>)')
}

function setNodeInlineStyle(node: ElementNode, value: any) {
	const prev = node.cascadeInline
	node.props.style = value
	node.cascadeInline = value
	// Subtree restyle only when an inherited or custom-property input changed.
	const inheritedOrCustom = (bag: any): boolean =>
		!!bag &&
		Object.keys(bag).some(
			(k) => k.startsWith('--') || INHERITED_CSS_PROPERTIES.has(k.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())),
		)
	const subtree = Boolean(inheritedOrCustom(prev)) || Boolean(inheritedOrCustom(value))
	markStyleDirty(node, subtree)
}

function applyClassName(node: ElementNode, value: any) {
	node.cssBaseClasses = new Set(normalizeClass(value).split(/\s+/).filter(Boolean))
	refreshCssClasses(node)
	markStyleDirty(node, true)
}

/** cssClasses = className tokens ∪ ambient root classes (ns-root, ns-macos,
 *  ns-light|ns-dark) on every parent-less node — including owned roots from
 *  createMacOSRoot (list cells, sheets, windows) and portal content, whose
 *  chain reaches the portalroot node. Recomputed on insert/remove/appearance
 *  via markStyleDirty → restyleNode → refreshCssClasses. */
function refreshCssClasses(node: ElementNode) {
	const set = new Set(node.cssBaseClasses ?? [])
	if (isCssRootNode(node)) {
		set.add('ns-root')
		set.add('ns-macos')
		set.add(cssSchemeName(node) === 'dark' ? 'ns-dark' : 'ns-light')
	}
	node.cssClasses = set
}

function setNodeId(node: ElementNode, value: any) {
	node.cssId = value == null ? undefined : String(value)
	markStyleDirty(node, true)
}

function setPseudoClass(node: ElementNode, name: string, on: boolean) {
	const had = node.cssPseudoClasses.has(name)
	if (on === had) {
		return
	}
	if (on) {
		node.cssPseudoClasses.add(name)
	} else {
		node.cssPseudoClasses.delete(name)
	}
	markStyleDirty(node, true)
}

// textfield/textview drop native chrome when the effective style overrides
// background/border (the old vx-input class behavior, now CSS-driven).
function syncInputChrome(node: ElementNode) {
	if (node.type !== 'textfield' && node.type !== 'textview') {
		return
	}
	const view = node.view
	if (!view) {
		return
	}
	const style = node.computedStyle ?? {}
	const customChrome =
		style.backgroundColor != null ||
		style.borderWidth != null ||
		style.borderColor != null ||
		style.borderRadius != null ||
		style.borderTopLeftRadius != null
	if (customChrome) {
		if (!node.cssChromeOff) {
			node.cssChromeOff = true
			view.drawsBackground = false
			if (node.type === 'textfield') {
				view.bezeled = false
			}
			if (node.type === 'textview') {
				view.textContainerInset = { width: 0, height: 0 }
			}
		}
	} else if (node.cssChromeOff) {
		node.cssChromeOff = false
		view.drawsBackground = true
		if (node.type === 'textfield') {
			view.bezeled = true
		}
	}
}

// Scheme palettes are the defaults beneath CSS and inline styles — a matched
// CSS rule or inline style wins over these. The active palette resolves from
// the nearest `dark`/`ns-dark` className ancestor (nodeScheme).
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

	if (isManualLayoutParent((node.layoutParent ?? node.parent)?.type)) {
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
	if (!spec || !node.view || isManualLayoutParent((node.layoutParent ?? node.parent)?.type)) {
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

	if (node.type === 'rootlayout' || behaviorOf(node.type)?.containerStyles) {
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

// Zero the margin sides a removed style owned and re-queue the mason pass.
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

	const marginParent = node.layoutParent ?? node.parent
	if (isManualLayoutParent(marginParent?.type)) {
		queueLayoutReconcile(node.container, marginParent)
	}
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
		(node.type === 'rootlayout' || behaviorOf(node.type)?.containerStyles)
	) {
		node.stylePaddingBox = undefined
		node.stylePaddingEdges = undefined
		syncEdgeInsets(node)
	} else if (
		EDGE_INSET_PROPS.has(name) &&
		(node.type === 'rootlayout' || behaviorOf(node.type)?.containerStyles)
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
		const resetParent = node.layoutParent ?? node.parent
		if (isManualLayoutParent(resetParent?.type)) {
			queueLayoutReconcile(node.container, resetParent)
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
	// cssOriginKeys: declared on this node via CSS -> warn once per prop.
	// inheritedOnlyKeys: inherited only -> never warn.
	if (style != null && typeof style !== 'object') {
		throw new Error('AppKit spike expects style to be an object')
	}

	// The style prop replaces wholesale, so keys dropped or nulled since the
	// last apply must reset the native state they installed before the current
	// values go on — otherwise removed styles linger on the view.
	const next: PropBag = style ?? {}

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

		if (name === 'pointerEvents') {
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
			(node.type === 'rootlayout' || behaviorOf(node.type)?.containerStyles)
		) {
			const box = parseEdgeInsets(value)
			node.stylePaddingBox = box
			node.stylePaddingEdges = { top: box.top, right: box.right, bottom: box.bottom, left: box.left }
			syncEdgeInsets(node)
		} else if (
			EDGE_INSET_PROPS.has(name) &&
			(node.type === 'rootlayout' || behaviorOf(node.type)?.containerStyles)
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
		} else if (
			name === 'left' &&
			node.view &&
			isManualLayoutParent((node.layoutParent ?? node.parent)?.type)
		) {
			queueLayoutReconcile(node.container, node.parent)
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
		} else if (
			!(
				behaviorOf(node.type)?.styleKeys?.has(name) ||
				behaviorOf((node.layoutParent ?? node.parent)?.type)?.styleKeys?.has(name)
			)
		) {
			// Inherited values, and inheritable properties a stylesheet declares on
			// a container for its descendants, are not unsupported here.
			if (
				node.inheritedOnlyKeys?.has(name) ||
				(node.cssOriginKeys?.has(name) &&
					INHERITED_CSS_PROPERTIES.has(name.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase())))
			) {
				continue
			}
			if (node.cssOriginKeys?.has(name)) {
				warnUnsupportedCssProp(node, name)
			} else {
				console.warn('[macos-style] ignored unsupported style.' + name + ' on <' + node.type + '>')
			}
		}
	}

	// Registered layouts consume style through their own sync; a style apply on
	// the container or a direct child re-queues its pass.
	const layoutHost =
		behaviorOf(node.type)?.layout != null
			? node
			: behaviorOf((node.layoutParent ?? node.parent)?.type)?.layout != null
				? (node.layoutParent ?? node.parent)
				: null
	if (layoutHost) {
		queueLayoutReconcile(node.container, layoutHost)
	}

	node.appliedStyle = next
	if (behaviorOf(node.type)?.layout) {
		queueLayoutReconcile(node.container, node)
	}
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

// className now only feeds the selector engine (cssClasses) and marks the
// subtree for restyle — the hardcoded token tables are gone.
/** Effective style for readers that used to consult props.style. */
function effectiveStyle(node: ElementNode): PropBag {
	return node.computedStyle ?? node.props?.style ?? {}
}

function applyClassNameProp(node: ElementNode, value: any) {
	applyClassName(node, value)
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
		style: effectiveStyle(node),
	})

	view.invalidateIntrinsicContentSize()
	queueLayoutReconcile(node.container, node.parent)
}

function setLabelText(node: ElementNode, text: any) {
	const lineHeight = Number(effectiveStyle(node).lineHeight)
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
		if (effectiveStyle(node).height == null && node.sizeConstraintSpecs?.height?.points !== height) {
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
	// Every mason-backed container hosts AccessibleHostView, so AX props apply
	// to any interactive container — not just the old stack/flex hosts.
	if (node.actionId !== undefined && node.view instanceof AccessibleHostView) {
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

	if (
		node.type === 'actionbar' &&
		'titleView' in props &&
		node.actionBarTitleViewProp !== props.titleView
	) {
		setActionBarTitleView(node, props.titleView)
	}

	node.props = { ...node.props, ...props }
	if ('id' in props) {
		setNodeId(node, props.id)
	}
	if ('disabled' in props || 'isEnabled' in props || 'enabled' in props) {
		setPseudoClass(
			node,
			'disabled',
			node.props.disabled === true || node.props.isEnabled === false || node.props.enabled === false,
		)
	}
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
		rootlayout: ['row', 'col', 'rowSpan', 'colSpan', 'horizontalAlignment', 'verticalAlignment'],
		contentview: ['horizontalAlignment', 'verticalAlignment'],
		actionbar: ['horizontalAlignment', 'verticalAlignment'],
		masonview: [
			'row',
			'col',
			'rowSpan',
			'colSpan',
			'dock',
			'left',
			'top',
			'right',
			'bottom',
			'horizontalAlignment',
			'verticalAlignment',
		],
		liquidglass: ['row', 'col', 'rowSpan', 'colSpan', 'horizontalAlignment', 'verticalAlignment'],
		scrollview: ['horizontalAlignment', 'verticalAlignment'],
	}

	for (const [name, value] of Object.entries(props)) {
		if (
			(node.layoutParent ?? node.parent) &&
			layoutChildProps[(node.layoutParent ?? node.parent)!.type]?.includes(name)
		) {
			continue
		}

		// Attached alignment metadata is retained before the batch inserts
		// the child; its parent consumes it during layout reconciliation.
		if (
			!node.parent &&
			[
				'dock',
				'horizontalAlignment',
				'verticalAlignment',
				'row',
				'col',
				'rowSpan',
				'colSpan',
				'left',
				'top',
				'right',
				'bottom',
			].includes(name)
		) {
			continue
		}

		if (name === 'onLayoutChanged') {
			setLayoutAction(node, value)
			continue
		}

		if (
			['masonview', 'liquidglass'].includes(node.type) ||
			behaviorOf(node.type)?.containerStyles
		) {
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

		// Registered behaviors first — mason-backed containers consume style/
		// className/layout props; unhandled names fall through to the builtin
		// per-type cases (scrollview's own props, stack taps, etc.).
		if (behaviorOf(node.type)?.applyProp?.(node, name, value)) {
			continue
		}

		switch (node.type) {
			// Common styling uses the same reconciliation as ContentView.
			case 'rootlayout':
			case 'actionbar':
			case 'contentview':
				if (node.type === 'actionbar' && ['title', 'titleView', 'flat'].includes(name)) {
					continue
				}

				if (name === 'style') {
					setNodeInlineStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name !== 'id' && value !== undefined) {
					console.warn('[macos-host] ignored ' + node.type + ' prop ' + name)
				}

				break
			case 'liquidglass':
				if (name === 'style') {
					setNodeInlineStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'id') {
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
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored ' + node.type + ' prop ' + name)
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
					setNodeInlineStyle(node, value)
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
					setNodeInlineStyle(node, value)
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
					setNodeInlineStyle(node, value)
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
					setNodeInlineStyle(node, value)
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
					setNodeInlineStyle(node, value)
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
					setNodeInlineStyle(node, value)
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
					setNodeInlineStyle(node, value)
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
					setNodeInlineStyle(node, value)
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
					setNodeInlineStyle(node, value)
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
					setNodeInlineStyle(node, value)
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
					setNodeInlineStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'id') {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored button prop ' + name)
				}

				break
			case 'scrollview':
				if (name === 'style') {
					setNodeInlineStyle(node, value)
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
					setNodeInlineStyle(node, value)
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
					setNodeInlineStyle(node, value)
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
					setNodeInlineStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'id') {
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
					setNodeInlineStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'id') {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored slider prop ' + name)
				}

				break
			case 'webview':
				if (name === 'style') {
					setNodeInlineStyle(node, value)
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
					updateImage(node.view as NSImageView, value, node.props.placeholder)
				} else if (name === 'placeholder') {
					updateImage(node.view as NSImageView, node.props.src, value)
				} else if (name === 'style') {
					setNodeInlineStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'id' || name === 'alt') {
					continue
				} else if (name === 'accessibilityLabel') {
					node.view!.accessibilityLabel = String(value ?? '')
					node.view!.accessibilityElement = !!value
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored image prop ' + name)
				}

				break
			case 'placeholder':
				// creatingView fires once on attach (insert); the prop only
				// registers the handler — re-applying it never refires.
				if (name === 'onCreatingView' || name === 'id') {
					continue
				} else if (name === 'style') {
					setNodeInlineStyle(node, value)
				} else if (name === 'className') {
					applyClassName(node, value)
				} else if (name === 'accessible' || name.startsWith('accessibility')) {
					applyAccessibility(node, name, value)
				} else if (name.startsWith('on') && value == null) {
					continue
				} else if (value !== undefined) {
					console.warn('[macos-host] ignored placeholder prop ' + name)
				}

				break
			default: {
				const behavior = behaviorOf(node.type)
				if (behavior && !behavior.applyProp?.(node, name, value)) {
					console.warn('[macos-host] ignored ' + node.type + ' prop ' + name)
				}

				break
			}
		}
	}

	if (node.type === 'webview') {
		updateWebView(node, props, (height) => {
			setNodeInlineStyle(node, { ...node.props.style, height })
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
		const style = effectiveStyle(node)
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

	// A container queues its own subtree; a child of a layout parent also
	// queues the parent — the two are not exclusive (a masonview nested in a
	// masonview needs both passes).
	if (
		['liquidglass', 'contentview', 'actionbar', 'rootlayout'].includes(node.type) ||
		behaviorOf(node.type)?.layout != null
	) {
		queueLayoutReconcile(node.container, node)
	}
	if (
		node.parent?.type === 'liquidglass' ||
		node.parent?.type === 'rootlayout' ||
		['contentview', 'actionbar'].includes(node.parent?.type ?? '') ||
		behaviorOf(node.parent?.type)?.layout != null
	) {
		queueLayoutReconcile(node.container, node.parent)
	}

	if (node.parent?.type === 'proxyviewcontainer') {
		queueLayoutReconcile(node.container, node.parent)
	}

	// Container children also reconcile their own subtree. Their size updates
	// must still notify the outer layout parent.
	if (node.parent?.type === 'rootlayout') {
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

const PROXY_LAYOUT_STYLES = [
	'position',
	'left',
	'right',
	'top',
	'bottom',
	'gridRow',
	'gridColumn',
	'gridRowStart',
	'gridRowEnd',
	'gridColumnStart',
	'gridColumnEnd',
	'gridArea',
	'order',
	'alignSelf',
	'justifySelf',
	'flexGrow',
	'flexShrink',
	'flexBasis',
] as const

function projectedViews(parent: ElementNode): ElementNode[] {
	const children = ['contentview', 'actionbar'].includes(parent.type ?? '')
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
	deactivateSizeConstraints(node)
	releasePlacementPins(node)
	const parent = node.layoutParent
	const view = parent?.childHost ?? parent?.view
	if (layoutView(node)?.superview === view) {
		view?.removeArrangedSubview?.(layoutView(node))
	}

	layoutView(node)?.removeFromSuperview()
	node.layoutParent = null
	if (node.authoredProps) {
		for (const name of PROXY_LAYOUT_PROPS) {
			if (node.props[name] !== node.authoredProps[name]) {
				node.props[name] = node.authoredProps[name]
			}
		}
		node.props.style = node.authoredProps.style
					markStyleDirty(node)
		
	}
}

function syncProxyProjection(parent: ElementNode) {
	const children = projectedViews(parent)
	if (['contentview', 'actionbar'].includes(parent.type ?? '') && children.length > 1) {
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
	const manual =
		['liquidglass', 'contentview', 'actionbar', 'rootlayout', '#root', 'portalroot'].includes(
			parent.type,
		) || isManualLayoutParent(parent.type)

	for (const child of children) {
		// Preserve authored values separately from the parent's forwarded values.
		child.authoredProps ??= { ...child.props }
		const chain: ElementNode[] = []
		for (let owner = child.parent; owner?.type === 'proxyviewcontainer'; owner = owner.parent) {
			chain.push(owner)
		}

		const forwarded: PropBag = {}
		const forwardedStyle: PropBag = {}
		for (const owner of chain.reverse()) {
			for (const name of PROXY_LAYOUT_PROPS) {
				if (owner.props[name] != null) {
					forwarded[name] = owner.props[name]
				}
			}
			for (const name of PROXY_LAYOUT_STYLES) {
				const ownerStyle =
					effectiveStyle(owner)
				if (ownerStyle[name] != null) {
					forwardedStyle[name] = ownerStyle[name]
				}
			}
		}
		setNodeInlineStyle(child, { ...forwardedStyle, ...child.authoredProps.style })

		const changes: PropBag = {}
		for (const name of PROXY_LAYOUT_PROPS) {
			const next = child.authoredProps[name] ?? forwarded[name]
			if (next !== child.props[name]) {
				changes[name] = next
				child.props[name] = next
			}
		}

		child.layoutParent = parent
		if (manual) {
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
				if (['contentview', 'actionbar'].includes(parent.type ?? '')) {
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
		if (
			['contentview', 'actionbar'].includes(node.type ?? '') &&
			node.slot != null &&
			count(node.slot) > 1
		) {
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

	deactivateSizeConstraints(node)
	releasePlacementPins(node)
	if (node.view) {
		const parentView = physicalParent?.childHost ?? physicalParent?.view
		if (parentView?.removeArrangedSubview && layoutView(node)?.superview === parentView) {
			parentView.removeArrangedSubview(layoutView(node))
		}

		layoutView(node).removeFromSuperview()
	}

	if (
		previousParent &&
		['contentview', 'actionbar'].includes(previousParent.type) &&
		previousParent.contentChild === node
	) {
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

/** Drain a batch's layout parents. Ancestor Mason passes traverse their whole
 *  subtree, so every pending projection attaches before any pass can pin its
 *  views. */
function drainLayoutDirty(dirty: Set<ElementNode>) {
	for (const parent of dirty) {
		if (
			parent.projectedChildren ||
			parent.children.some((child) => child.type === 'proxyviewcontainer')
		) {
			syncProxyProjection(parent)
		}
	}
	for (const parent of dirty) {
		reconcileLayoutParent(parent)
	}
}

function reconcileLayoutParent(parent: ElementNode) {
	if (
		parent.projectedChildren ||
		parent.children.some((child) => child.type === 'proxyviewcontainer')
	) {
		syncProxyProjection(parent)
	}

	// Registered behaviors own their layout pass — mason-backed containers
	// (masonview, scrollview, liquidglass) never reach the builtin branches.
	const layoutBehavior = behaviorOf(parent.type)?.layout
	if (layoutBehavior) {
		parent.view?.invalidateIntrinsicContentSize()
		layoutBehavior(parent)
		return
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
		if (['contentview', 'actionbar', 'rootlayout'].includes(parent.parent?.type ?? '')) {
			queueLayoutReconcile(parent.container, parent.parent)
		}

		return
	}

	if (parent.type === 'actionbar') {
		parent.view?.invalidateIntrinsicContentSize()
		syncActionBar(parent)
		queueLayoutReconcile(parent.container, parent.parent)
		return
	}

	if (parent.type === 'contentview') {
		parent.view?.invalidateIntrinsicContentSize()
		layoutContentChild(parent)
		if (parent.parent?.type === 'rootlayout') {
			queueLayoutReconcile(parent.container, parent.parent)
		}

		return
	}
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

	if (parentType === 'placeholder') {
		throw new Error('AppKit <placeholder> content comes from creatingView, not JSX children')
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

// Name the offending child (text preview or element type) and the parent's
// id — "cannot contain text-only children" alone can't say which fixture
// or leaf produced the illegal nesting.
function textOnlyChildError(
	parent: { type: string; props?: PropBag } | null | undefined,
	childType: string,
	child?: { props?: PropBag; text?: string },
) {
	const text = child?.text ?? child?.props?.value
	const detail =
		childType === '#text' ? ` ("${String(text ?? '').slice(0, 60)}")` : ` (<${childType}>)`
	return new Error(
		'AppKit <' +
			(parent?.type ?? '?') +
			'> cannot contain text-only children' +
			detail +
			(parent?.props?.id ? ` — parent id=${parent.props.id}` : ''),
	)
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
		['masonview', 'contentview', 'actionbar', 'rootlayout', 'proxyviewcontainer'].includes(
			parent?.type ?? '',
		) &&
		!node.view &&
		node.type !== 'proxyviewcontainer'
	) {
		throw textOnlyChildError(parent, node.type, node)
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
		if (parent && ['contentview', 'actionbar'].includes(parent.type)) {
			const previous = parent.contentChild
			if (previous && previous !== node) {
				for (const child of previous.type === 'proxyviewcontainer'
					? projectedViews(previous)
					: [previous]) {
					releaseProjectedView(child)
				}
			}

			if (parent.type === 'actionbar') {
				parent.actionBarExternal = null
			}

			parent.contentChild = node
		}

		queueLayoutReconcile(container, parent ?? node)
		if (node.type === 'placeholder') {
			fireCreatingView(node)
		}

		return
	}

	if (node.view) {
		if (parent) {
			if (
				['portalroot', 'liquidglass', 'contentview', 'actionbar', 'rootlayout'].includes(
					parent.type,
				) ||
				isManualLayoutParent(parent.type)
			) {
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
			} else if (['contentview', 'actionbar'].includes(parent.type ?? '')) {
				const previous = parent.contentChild
				if (previous && previous !== node) {
					releasePlacementPins(previous)
					layoutView(previous).removeFromSuperview()
				}

				if (parent.type === 'actionbar') {
					parent.actionBarExternal = null
				}

				parent.contentChild = node
				parentView.addSubview(layoutView(node))
				layoutView(node).translatesAutoresizingMaskIntoConstraints = false
				deactivateSizeConstraints(node)
				queueLayoutReconcile(container, parent)
			} else if (isManualLayoutParent(parent.type)) {
				parentView.addSubview(layoutView(node))
				layoutView(node).translatesAutoresizingMaskIntoConstraints = false
				deactivateSizeConstraints(node)
				queueLayoutReconcile(container, parent)
			} else {
				parentView.addSubview(layoutView(node))
				layoutView(node).translatesAutoresizingMaskIntoConstraints = false
				applySizeConstraints(node)
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
		if (node.type === 'placeholder') {
			fireCreatingView(node)
		}
		markStyleDirty(node, true)
		if (
			parent &&
			(stylesheetScope().hasAdjacentCombinatorSelectors || stylesheetScope().hasSiblingCombinatorSelectors)
		) {
			for (const sib of parent.children) {
				if (sib !== node) {
					markStyleDirty(sib, true)
				}
			}
		}
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
		expectedParent &&
		(stylesheetScope().hasAdjacentCombinatorSelectors || stylesheetScope().hasSiblingCombinatorSelectors)
	) {
		for (const sib of expectedParent.children) {
			if (sib !== node) {
				markStyleDirty(sib, true)
			}
		}
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

	deactivateSizeConstraints(node)
	releasePlacementPins(node)
	if (node.view) {
		const parentView = expectedParent?.childHost ?? expectedParent?.view
		if (parentView?.removeArrangedSubview && layoutView(node)?.superview === parentView) {
			parentView.removeArrangedSubview(layoutView(node))
		}

		layoutView(node).removeFromSuperview()
		setLayoutAction(node, node.props?.onLayoutChanged)
	}

	if (
		expectedParent &&
		['contentview', 'actionbar'].includes(expectedParent.type) &&
		expectedParent.contentChild === node
	) {
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
	node.container?.cssDirty?.delete(node)
	for (const hook of node.destroyHooks ?? []) {
		hook()
	}
	behaviorOf(node.type)?.destroy?.(node)

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

	if (node.type === 'liquidglass') {
		if (node.glassGeometryObserver) {
			NSNotificationCenter.defaultCenter.removeObserver(node.glassGeometryObserver)
			node.glassGeometryObserver = null
		}

		// The material backdrop is not a node view, so nothing else detaches it.
		node.glassBackdrop?.removeFromSuperview()
		node.glassBackdrop = null
	}

	// Removing an ancestor does not detach its native descendants. Every
	// destroyed view releases its own edge, including retained ContentView refs.
	if (['contentview', 'actionbar'].includes(node.type ?? '')) {
		if (node.contentGeometryObserver) {
			NSNotificationCenter.defaultCenter.removeObserver(node.contentGeometryObserver)
			node.contentGeometryObserver = null
		}

		if (node.type === 'actionbar') {
			if (node.actionBarDisplay) {
				releasePlacementPins(node.actionBarDisplay)
				node.actionBarDisplay.view.removeFromSuperview()
			}

			node.actionBarExternal = null
			node.actionBarDisplay = null
			node.actionBarTitle = null
		}

		// Detaching mutates children; iterate a snapshot.
		for (const child of node.children.slice()) {
			detach(node.container, child)
		}

		if (node.view) {
			contentViewNodesByView.delete(node.view)
		}
	}

	if (node.type === 'placeholder') {
		if (node.placeholderContent) {
			placeholderContentOwners.delete(node.placeholderContent)
			if (nodeContainersByView.get(node.placeholderContent) === node.container) {
				nodeContainersByView.delete(node.placeholderContent)
			}

			node.placeholderContent.removeFromSuperview()
			node.placeholderContent = null
		}

		if (node.view) {
			placeholderNodesByView.delete(node.view)
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
					['masonview', 'contentview', 'actionbar', 'rootlayout', 'proxyviewcontainer'].includes(
						parent?.type ?? '',
					) &&
					!typeHasView(command.type) &&
					command.type !== 'proxyviewcontainer'
				) {
					throw textOnlyChildError(parent, command.type, { props: command.props })
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
						['masonview', 'contentview', 'actionbar', 'rootlayout', 'proxyviewcontainer'].includes(
							parent.type,
						) &&
						!typeHasView(entry.type) &&
						entry.type !== 'proxyviewcontainer'
					) {
						throw textOnlyChildError(parent, entry.type, { props: entry.props })
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
				['masonview', 'contentview', 'actionbar', 'rootlayout'].includes(
					existing?.parent?.type ?? '',
				) &&
				!typeHasView(command.type) &&
				command.type !== 'proxyviewcontainer'
			) {
				throw textOnlyChildError(existing!.parent, command.type, { props: command.props })
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
				['masonview', 'contentview', 'actionbar', 'rootlayout', 'proxyviewcontainer'].includes(
					parent?.type ?? '',
				) &&
				!typeHasView(command.type) &&
				command.type !== 'proxyviewcontainer'
			) {
				throw textOnlyChildError(parent, command.type, { props: command.props })
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
					cssType: 'portalroot',
					cssClasses: new Set(),
					cssPseudoClasses: new Set(),
					computedStyle: undefined,
					computedCustomProps: new Map(),
				}
				root.getChildIndex = (child: ElementNode) => cssChildren(root).indexOf(child)
				root.getChildAt = (i: number) => cssChildren(root)[i]
				root.getChildrenCount = () => cssChildren(root).length

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
					// Restyle while the layout batch is open so style-driven layout
					// work joins the batch's single drain.
					flushStyleDirty(container!)
					const dirty = container.layoutDirty
					container.layoutDirty = null
					flushTabViews(container)
					if (dirty) {
						drainLayoutDirty(dirty)
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

function parityStyle(node: ElementNode, facets: readonly string[]) {
	const view = node.view
	const font = view?.font
	const supplied: PropBag = effectiveStyle(node)
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

		if (facet === 'flexDirection') {
			value =
				node.props.flexDirection ??
				(node.props.orientation === 'horizontal'
					? 'row'
					: node.props.orientation === 'vertical'
						? 'column'
						: undefined)
		}

		if (facet === 'alignItems') {
			value = node.props.alignItems ?? effectiveStyle(node).alignItems
		}

		if (facet === 'justifyContent') {
			value = node.props.justifyContent ?? effectiveStyle(node).justifyContent
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
	const stage = [...appKitContainers]
		.flatMap((entry) => [...entry.nodes.values()])
		.find((node) => node.props?.id === 'parity-stage')
	if (!stage?.view) {
		return null
	}

	// The stage can live in a sibling container (tab pane, popup, route host).
	const stageContainer: RootContainer = stage.container ?? container
	stageContainer.hostView.window?.contentView?.layoutSubtreeIfNeeded?.()
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

// Stylesheet and appearance changes restyle every live container.
function restyleAllContainers() {
	for (const container of appKitContainers) {
		for (const child of container.children) {
			markStyleDirty(child, true)
		}
		for (const entry of container.portalTargets.values()) {
			markStyleDirty(entry.root, true)
		}
		flushStyleDirty(container)
	}
}

onStylesheetsChanged(restyleAllContainers)

// Media environment: window content size + appearance + reduceMotion.
setStyleEnvironment(() => {
	let width = 0
	let height = 0
	for (const container of appKitContainers) {
		const rect: any = container.hostView?.window?.contentLayoutRect ?? container.hostView?.frame
		const w = rect?.size?.width ?? rect?.width ?? 0
		const h = rect?.size?.height ?? rect?.height ?? 0
		if (w > width || h > height) {
			width = w
			height = h
		}
	}
	// Same scheme source as the root ns-light/ns-dark classes.
	const colorScheme = (appKitBridge as any).getColorScheme?.() === 'dark' ? 'dark' : 'light'
	const reducedMotion = NSWorkspace.sharedWorkspace?.accessibilityDisplayShouldReduceMotion === true
	return { width, height, colorScheme, reducedMotion }
})

// Appearance flips change ns-light/ns-dark on roots and may flip media-gated rules.
appKitBridge.onAppearanceChange?.(() => restyleAllContainers())
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

// AppKit renders into several roots — the main window plus tab panes, popup
// surfaces, and route content hosts each own a container, and every
// createMacOSRoot call rebinds the __xplatMacOSDebug seam. Debug lookups must
// search every live container or automation silently misses nodes mounted
// outside whichever root was created last.
const appKitContainers = new Set<RootContainer>()

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
	appKitContainers.add(container)
	const unmount = root.unmount.bind(root)
	root.unmount = () => {
		appKitContainers.delete(container)
		if (ownedRoots.get(hostView) === root) {
			ownedRoots.delete(hostView)
		}

		unmount()
	}

	if ((process.env as { [key: string]: string | undefined }).OCTANE_MACOS_AUTOMATION === '1') {
		// Ids resolve across every live container — see appKitContainers.
		const allNodes = () =>
			[...appKitContainers].flatMap((entry) => [...entry.nodes.values()])
		const debug = {
			findId(id: string) {
				const node = allNodes().find((node) => node.props.id === id)
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
				const node = allNodes().find(
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
				const node = allNodes().find(
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
				const node = allNodes().find(
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

				const node = allNodes().find(
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
				const node = allNodes().find((candidate) => candidate.props.id === id)

				if (!node) {
					throw new Error('No AppKit node with id ' + id)
				}

				// Single-key writes merge into the node's inline style bag; the
				// cascade re-derives the effective style from it.
				const style = { ...node.props?.style }
				if (value == null) {
					delete style[name]
				} else {
					style[name] = value
				}

				setNodeInlineStyle(node, style)
				flushStyleDirty(node.container)
				container.hostView.layoutSubtreeIfNeeded?.()
				return this.frameInWindow(id)
			},
			/** Ancestor chain for a node id with frames — layout forensics. */
			ancestors(id: string) {
				const node = allNodes().find((candidate) => candidate.props.id === id)

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
				const scroll = allNodes().find(
					(candidate) => candidate.type === 'scrollview' && candidate.props.id === scrollId,
				)

				if (!scroll) {
					throw new Error('No AppKit ScrollView with id ' + scrollId)
				}

				const stage = allNodes().find(
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
				const node = allNodes().find(
					(candidate) => candidate.type === 'scrollview' && candidate.props.id === id,
				)

				if (!node) {
					throw new Error('No AppKit ScrollView with id ' + id)
				}

				return { ...(node.scrollMetrics ?? { events: [] }) }
			},
			inspect(id: string) {
				const node = id.startsWith('type:')
					? allNodes().find(
							(candidate) => candidate.type === id.slice(5) && candidate.view,
						)
					: allNodes().find((candidate) => candidate.props?.id === id)

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
					labels: allNodes()
						.filter((node) => node.type === 'label' && node.view)
						.map((node) => node.view!.stringValue),
					buttons: allNodes()
						.filter((node) => node.type === 'button' && node.view)
						.map((node) => node.view!.title),
					pressables: allNodes()
						.filter(
							(node) =>
								node.type === 'masonview' &&
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
				const node = allNodes().find((candidate) => candidate.props.id === id)
				if (!node || node.actionId === undefined) {
					throw new Error('No AppKit pressable with id ' + id)
				}

				invokeAction(node.actionId)
			},
			setText(idOrPlaceholder: string, value: any) {
				const node = allNodes().find(
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
				const node = allNodes().find(
					(candidate) =>
						candidate.type === 'masonview' &&
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
				const node = allNodes().find(
					(candidate) => candidate.type === 'button' && candidate.view!.title === title,
				)

				if (!node) {
					throw new Error('No AppKit button titled ' + title)
				}

				node.view!.performClick(null)
			},
			hover(id: string, phase: 'enter' | 'exit') {
				const node = allNodes().find(
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
