// Ambient host globals injected by @nativescript/macos-node-api and the
// embedding Node process. The prerelease ships no generated AppKit metadata
// types, so the declarations below cover the native surface the renderer
// calls for event and control wiring (target/action, gesture recognizers,
// tracking areas, notification observers, menus, pickers, sheets). Members
// outside that surface still resolve to `any` through the index signatures.

type NSClass<T> = {
	new (...args: any[]): T
	alloc(): T
	[key: string]: any
}

// Core Graphics geometry, bridged as plain objects.
interface NSPoint {
	x: number
	y: number
}

interface NSSize {
	width: number
	height: number
}

interface NSRect {
	origin: NSPoint
	size: NSSize
}

// Objective-C classes. Instances expose bridged members beyond the declared
// surface as `any`; the type name is real so parameters and node structs can
// reference them.
declare class NSObject {
	[key: string]: any
	static alloc(): any
	static new(): any
	static extend(methods: object, options?: object): any
	init(): this
	isEqual?(other: any): boolean
}

interface NSAttributedString extends NSObject {}
declare const NSAttributedString: NSClass<NSAttributedString>

interface NSBundle extends NSObject {}
declare const NSBundle: NSClass<NSBundle>

interface NSError extends NSObject {}
declare const NSError: NSClass<NSError>

interface NSURLRequest extends NSObject {}
declare const NSURLRequest: NSClass<NSURLRequest>

// WebKit is dlopen'd at runtime by the webview leaf.
interface WKWebView extends NSView {
	navigationDelegate: any
	evaluateJavaScriptCompletionHandler(script: string, handler: any): void
}

declare const WKWebView: NSClass<WKWebView>

interface WKWebViewConfiguration extends NSObject {}
declare const WKWebViewConfiguration: NSClass<WKWebViewConfiguration>

// NSControl carries the target/action channel shared by buttons, sliders,
// text fields, and date pickers.
interface NSControl extends NSView {
	target: any
	action: string | null
	enabled: boolean
	doubleValue: number
	font: any
	textColor: any
	cell: any
}

interface NSButton extends NSControl {
	bezelStyle: number
	state: number
	setButtonType(type: number): void
}

interface NSButtonClass extends NSClass<NSButton> {
	buttonWithTitleTargetAction(title: string, target: any, action: string): NSButton
}

declare const NSButton: NSButtonClass

interface NSGestureRecognizer extends NSObject {
	initWithTargetAction(target: any, action: string): this
	readonly view: NSView
	state: number
	enabled: boolean
}

interface NSClickGestureRecognizer extends NSGestureRecognizer {
	numberOfClicksRequired: number
	buttonMask: number
}

declare const NSClickGestureRecognizer: NSClass<NSClickGestureRecognizer>

interface NSColor extends NSObject {}
declare const NSColor: NSClass<NSColor>

interface NSColorSpace extends NSObject {}
declare const NSColorSpace: NSClass<NSColorSpace>

interface NSData extends NSObject {}
declare const NSData: NSClass<NSData>

interface NSDate extends NSObject {
	readonly timeIntervalSince1970: number
}

interface NSDateClass extends NSClass<NSDate> {
	dateWithTimeIntervalSince1970(seconds: number): NSDate
}

declare const NSDate: NSDateClass

interface NSDatePicker extends NSControl {
	datePickerElements: number
	datePickerStyle: number
	dateValue: NSDate | null
	minDate: NSDate | null
	maxDate: NSDate | null
}

declare const NSDatePicker: NSClass<NSDatePicker>

interface NSEdgeInsets extends NSObject {}
declare const NSEdgeInsets: NSClass<NSEdgeInsets>

interface NSEvent extends NSObject {
	readonly type: number
	readonly keyCode: number
	readonly modifierFlags: number
	readonly window: NSWindow | null
	readonly locationInWindow: NSPoint
	readonly trackingArea: NSTrackingArea
}

interface NSEventClass extends NSClass<NSEvent> {
	addLocalMonitorForEventsMatchingMaskHandler(
		mask: number,
		handler: (event: NSEvent) => NSEvent | null,
	): any
	addGlobalMonitorForEventsMatchingMaskHandler(
		mask: number,
		handler: (event: NSEvent) => NSEvent | null,
	): any
	removeMonitor(monitor: any): void
}

declare const NSEvent: NSEventClass

interface NSFont extends NSObject {}
declare const NSFont: NSClass<NSFont>

interface NSFontDescriptor extends NSObject {}
declare const NSFontDescriptor: NSClass<NSFontDescriptor>

interface NSFontManager extends NSObject {}
declare const NSFontManager: NSClass<NSFontManager>

interface NSImage extends NSObject {}
declare const NSImage: NSClass<NSImage>

interface NSImageView extends NSControl {
	image: NSImage | null
	imageScaling: number
}

declare const NSImageView: NSClass<NSImageView>

interface NSMenu extends NSObject {
	autoenablesItems: boolean
	addItem(item: NSMenuItem): void
}

declare const NSMenu: NSClass<NSMenu>

interface NSMenuItem extends NSObject {
	initWithTitleActionKeyEquivalent(
		title: string,
		action: string | null,
		keyEquivalent: string,
	): this
	target: any
	action: string | null
	enabled: boolean
	tag?: number
}

interface NSMenuItemClass extends NSClass<NSMenuItem> {
	separatorItem(): NSMenuItem
}

declare const NSMenuItem: NSMenuItemClass

interface NSApplication extends NSObject {
	readonly keyWindow: NSWindow | null
}

interface NSApplicationClass extends NSClass<NSApplication> {
	readonly sharedApplication: NSApplication
}

declare const NSApplication: NSApplicationClass

interface NSAppearance extends NSObject {}
interface NSAppearanceClass extends NSClass<NSAppearance> {
	appearanceNamed(name: string): NSAppearance
}

declare const NSAppearance: NSAppearanceClass

interface NSMutableParagraphStyle extends NSObject {}
declare const NSMutableParagraphStyle: NSClass<NSMutableParagraphStyle>

interface NSNotification extends NSObject {
	readonly object: any
}

declare const NSNotification: NSClass<NSNotification>

interface NSNotificationCenter extends NSObject {
	addObserverForNameObjectQueueUsingBlock(
		name: string,
		object: any,
		queue: any,
		block: () => void,
	): any
	removeObserver(observer: any): void
}

interface NSNotificationCenterClass extends NSClass<NSNotificationCenter> {
	readonly defaultCenter: NSNotificationCenter
}

declare const NSNotificationCenter: NSNotificationCenterClass

interface NSNumber extends NSObject {}
declare const NSNumber: NSClass<NSNumber>

interface NSPanGestureRecognizer extends NSGestureRecognizer {
	translationInView(view: NSView | null): NSPoint
	velocityInView(view: NSView | null): NSPoint
}

declare const NSPanGestureRecognizer: NSClass<NSPanGestureRecognizer>

interface NSPopover extends NSObject {
	contentViewController: NSViewController
	contentSize: NSSize
	behavior: number
	animates: boolean
	showRelativeToRectOfViewPreferredEdge(rect: NSRect, view: NSView, preferredEdge: number): void
	close(): void
}

declare const NSPopover: NSClass<NSPopover>

interface NSScrollView extends NSView {
	documentView: NSView | null
	contentView: any
	borderType: number
	drawsBackground: boolean
	hasVerticalScroller: boolean
	hasHorizontalScroller: boolean
	reflectScrolledClipView(clipView: any): void
}

declare const NSScrollView: NSClass<NSScrollView>

interface NSSlider extends NSControl {
	minValue: number
	maxValue: number
}

declare const NSSlider: NSClass<NSSlider>

interface NSStackView extends NSView {}
declare const NSStackView: NSClass<NSStackView>

interface NSTextField extends NSControl {
	stringValue: string
	placeholderString?: string
	placeholderAttributedString: any
	bezeled: boolean
	drawsBackground: boolean
	editable: boolean
	selectable: boolean
	sendsActionOnEndEditing: boolean
	alignment: number
}

declare const NSTextField: NSClass<NSTextField>

interface NSSecureTextField extends NSTextField {}
declare const NSSecureTextField: NSClass<NSSecureTextField>

interface NSTextView extends NSView {
	string: string
	editable: boolean
	selectable: boolean
	drawsBackground: boolean
	delegate: any
	font: any
	textColor: any
	textContainer: any
	textContainerInset: NSSize
}

declare const NSTextView: NSClass<NSTextView>

interface NSTrackingArea extends NSObject {
	initWithRectOptionsOwnerUserInfo(rect: NSRect, options: number, owner: any, userInfo: any): this
}

declare const NSTrackingArea: NSClass<NSTrackingArea>

interface NSURL extends NSObject {}
declare const NSURL: NSClass<NSURL>

interface NSView extends NSObject {
	initWithFrame(frame: NSRect): this
	addSubview(child: NSView): void
	removeFromSuperview(): void
	addGestureRecognizer(recognizer: NSGestureRecognizer): void
	removeGestureRecognizer(recognizer: NSGestureRecognizer): void
	addTrackingArea(area: NSTrackingArea): void
	removeTrackingArea(area: NSTrackingArea): void
	hitTest(point: NSPoint): NSView | null
	acceptsFirstResponder(): boolean
	keyDown(event: NSEvent): void
	layout(): void
	layoutSubtreeIfNeeded(): void
	convertRectToView(rect: NSRect, view: NSView | null): NSRect
	isFlipped(): boolean
	frame: NSRect
	bounds: NSRect
	readonly fittingSize: NSSize
	readonly superview: NSView | null
	readonly window: NSWindow | null
	hidden: boolean
	tag?: number
	menu: NSMenu | null
	alphaValue: number
	autoresizingMask?: number
	translatesAutoresizingMaskIntoConstraints: boolean
	wantsLayer: boolean
	postsBoundsChangedNotifications: boolean
	postsFrameChangedNotifications: boolean
}

declare const NSView: NSClass<NSView>

interface NSViewController extends NSObject {
	view: NSView
	preferredContentSize: NSSize
}

declare const NSViewController: NSClass<NSViewController>

interface NSWindow extends NSObject {
	initWithContentRectStyleMaskBackingDefer(
		contentRect: NSRect,
		styleMask: number,
		backing: number,
		defer: boolean,
	): this
	contentView: NSView
	contentViewController: NSViewController
	frame: NSRect
	firstResponder: any
	delegate: any
	effectiveAppearance: any
	releasedWhenClosed: boolean
	makeFirstResponder(responder: any): boolean
	beginSheetCompletionHandler(sheet: NSWindow, handler: () => void): void
	endSheet(sheet: NSWindow): void
	orderOut(sender: any): void
	center(): void
	makeKeyAndOrderFront(sender: any): void
}

declare const NSWindow: NSClass<NSWindow>

// QuartzCore, referenced lazily by the presentation bridge for sheet
// transition fades.
interface CABasicAnimation extends NSObject {
	fromValue: any
	toValue: any
	duration: number
}

interface CABasicAnimationClass extends NSClass<CABasicAnimation> {
	animationWithKeyPath(keyPath: string): CABasicAnimation
}

declare const CABasicAnimation: CABasicAnimationClass

// Enum containers. Members resolve to `number`, so bitwise masks compose.
declare const NSBackingStoreType: { [key: string]: number }
declare const NSBezelStyle: { [key: string]: number }
declare const NSBorderType: { [key: string]: number }
declare const NSButtonType: { [key: string]: number }
declare const NSDatePickerElementFlags: { [key: string]: number }
declare const NSDatePickerStyle: { [key: string]: number }
declare const NSLayoutAttribute: { [key: string]: number }
declare const NSPopoverBehavior: { [key: string]: number }
declare const NSRectEdge: { [key: string]: number }
declare const NSStackViewDistribution: { [key: string]: number }
declare const NSStackViewGravity: { [key: string]: number }
declare const NSTextAlignment: { [key: string]: number }
declare const NSTrackingAreaOptions: { [key: string]: number }
declare const NSUserInterfaceLayoutOrientation: { [key: string]: number }
declare const NSWindowStyleMask: { [key: string]: number }

// Standalone constants.
declare const NSImageScaleProportionallyDown: number
declare const NSImageScaleProportionallyUpOrDown: number

// NSString notification names and attributed-string keys.
declare const NSPopoverDidCloseNotification: string
declare const NSViewBoundsDidChangeNotification: string
declare const NSViewFrameDidChangeNotification: string
declare const NSFontAttributeName: string
declare const NSForegroundColorAttributeName: string
declare const NSParagraphStyleAttributeName: string
declare const NSURLErrorFailingURLErrorKey: string

// Protocol objects (opaque bridge references used in ObjCProtocols arrays).
declare const NSTextViewDelegate: any
declare const NSWindowDelegate: any
declare const WKNavigationDelegate: any

// Runtime framework loader injected by the bridge host.
declare function dlopen(path: string, flags: number): unknown

// Cross-package bridge published by this renderer for AppKit-specific leaves
// (hover, popups, menus, sheets) and the VirtualList offset channel.
declare var __xplatAppKit: {
	observeHover?: (view: NSView, handlers: any) => void
	showAnchoredPopup?: (options: any) => void
	showLayer?: (options: any) => any
	attachContextMenu?: (view: NSView, options: any, onSelect: any) => void
	attachDatePicker?: (view: NSView, options: any, onChange: any) => void
	presentSheet?: (view: NSView, options: any) => void
	presentSurface?: (options: any) => any
	setSurfaceAppearance?: (view: NSView, dark: boolean) => void
	[key: string]: any
}

declare var __xplatVlistOffsets: { [key: string]: number } | undefined

// Node host globals.
declare const performance: { now(): number }
declare function setTimeout(callback: () => void, ms?: number): unknown
declare function clearTimeout(timer: unknown): void
declare function queueMicrotask(callback: () => void): void
declare const console: {
	log(...args: any[]): void
	warn(...args: any[]): void
	error(...args: any[]): void
	[key: string]: any
}

declare const process: { env: { [key: string]: string | undefined } }
