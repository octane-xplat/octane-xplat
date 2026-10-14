// Module-scoped AppKit/WebKit declarations — the shape of the native host
// globals, exported from @octane-xplat/platform/macos so platform code imports
// the names it uses instead of relying on ambient globals. The macOS prerelease
// ships no generated AppKit metadata types, so this file covers the surface the
// renderer calls for event and control wiring (target/action, gesture
// recognizers, tracking areas, notification observers, menus, pickers, sheets).
// Members outside that surface still resolve to `any` through index signatures.
export type NSClass<T> = {
	new (...args: any[]): T
	alloc(): T
	[key: string]: any
}

// Core Graphics geometry, bridged as plain objects.
export interface NSPoint {
	x: number
	y: number
}

export interface NSSize {
	width: number
	height: number
}

export interface NSRect {
	origin: NSPoint
	size: NSSize
}

// Objective-C classes. Instances expose bridged members beyond the declared
// surface as `any`; the type name is real so parameters and node structs can
// reference them.
//
// `NSObject` must be declared BEFORE any @nativescript/types copy in a
// combined all-platform program — with duplicate `declare class` globals the
// first declaration wins, and this one carries the statics (`new`, `extend`,
// `alloc`) plus the catch-all index signature the AppKit surface needs. The
// merged iOS declaration adds members but can't remove these.
export declare class NSObject {
	[key: string]: any
	static alloc(): any
	static new(): any
	static extend(methods: object, options?: object): any
	// `NSObject.class` is the ObjC metaclass accessor every class inherits;
	// when this declaration wins the merged NSObject (see note above) iOS
	// callers like `UITextField.class()` still resolve.
	static class(): typeof NSObject
	init(): this
	isEqual?(other: any): boolean
}

export interface NSObject {
	[key: string]: any
}

export interface NSAttributedString extends NSObject {}
export declare const NSAttributedString: NSClass<NSAttributedString>

export interface NSBundle extends NSObject {}
export declare const NSBundle: NSClass<NSBundle>

export interface NSError extends NSObject {}
export declare const NSError: NSClass<NSError>

export interface NSURLRequest extends NSObject {}
export declare const NSURLRequest: NSClass<NSURLRequest>

// WebKit is dlopen'd at runtime by the webview leaf.
export interface WKWebView extends NSView {
	navigationDelegate: any
	evaluateJavaScriptCompletionHandler(script: string, handler: any): void
}

export declare const WKWebView: NSClass<WKWebView>

export interface WKWebViewConfiguration extends NSObject {}
export declare const WKWebViewConfiguration: NSClass<WKWebViewConfiguration>

// NSControl carries the target/action channel shared by buttons, sliders,
// text fields, and date pickers.
export interface NSControl extends NSView {
	target: any
	action: string | null
	enabled: boolean
	doubleValue: number
	font: any
	textColor: any
	cell: any
}

export interface NSButton extends NSControl {
	bezelStyle: number
	state: number
	setButtonType(type: number): void
}

export interface NSButtonClass extends NSClass<NSButton> {
	buttonWithTitleTargetAction(title: string, target: any, action: string): NSButton
}

export declare const NSButton: NSButtonClass

export declare const NSGestureRecognizerDelegate: any

export declare class NSGestureRecognizer extends NSObject {
	delegate: any
	delaysPrimaryMouseButtonEvents: boolean
	reset(): void
	mouseDown(event: NSEvent): void
	mouseDragged(event: NSEvent): void
	mouseUp(event: NSEvent): void
	initWithTargetAction(target: any, action: string): this
	readonly view: NSView
	readonly state: number
	enabled: boolean
}

export interface NSPressGestureRecognizer extends NSGestureRecognizer {
	minimumPressDuration: number
}

export declare const NSPressGestureRecognizer: NSClass<NSPressGestureRecognizer>

export interface NSClickGestureRecognizer extends NSGestureRecognizer {
	numberOfClicksRequired: number
	buttonMask: number
}

export declare const NSClickGestureRecognizer: NSClass<NSClickGestureRecognizer>

export interface NSColor extends NSObject {}
export declare const NSColor: NSClass<NSColor>

export interface NSColorSpace extends NSObject {}
export declare const NSColorSpace: NSClass<NSColorSpace>

export interface NSData extends NSObject {}
export declare const NSData: NSClass<NSData>

export interface NSDate extends NSObject {
	readonly timeIntervalSince1970: number
}

export interface NSDateClass extends NSClass<NSDate> {
	dateWithTimeIntervalSince1970(seconds: number): NSDate
}

export declare const NSDate: NSDateClass

export interface NSDatePicker extends NSControl {
	datePickerElements: number
	datePickerStyle: number
	dateValue: NSDate | null
	minDate: NSDate | null
	maxDate: NSDate | null
}

export declare const NSDatePicker: NSClass<NSDatePicker>

export interface NSEdgeInsets extends NSObject {}
export declare const NSEdgeInsets: NSClass<NSEdgeInsets>

export interface NSEvent extends NSObject {
	readonly type: number
	readonly keyCode: number
	readonly modifierFlags: number
	readonly window: NSWindow | null
	readonly locationInWindow: NSPoint
	readonly trackingArea: NSTrackingArea
}

export interface NSEventClass extends NSClass<NSEvent> {
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

export declare const NSEvent: NSEventClass

export interface NSFont extends NSObject {}
export declare const NSFont: NSClass<NSFont>

export interface NSFontDescriptor extends NSObject {}
export declare const NSFontDescriptor: NSClass<NSFontDescriptor>

export interface NSFontManager extends NSObject {}
export declare const NSFontManager: NSClass<NSFontManager>

export interface NSImage extends NSObject {}
export declare const NSImage: NSClass<NSImage>

export interface NSImageView extends NSControl {
	image: NSImage | null
	imageScaling: number
}

export declare const NSImageView: NSClass<NSImageView>

export interface NSMenu extends NSObject {
	autoenablesItems: boolean
	addItem(item: NSMenuItem): void
}

export declare const NSMenu: NSClass<NSMenu>

export interface NSMenuItem extends NSObject {
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

export interface NSMenuItemClass extends NSClass<NSMenuItem> {
	separatorItem(): NSMenuItem
}

export declare const NSMenuItem: NSMenuItemClass

export interface NSApplication extends NSObject {
	readonly keyWindow: NSWindow | null
}

export interface NSApplicationClass extends NSClass<NSApplication> {
	readonly sharedApplication: NSApplication
}

export declare const NSApplication: NSApplicationClass

export interface NSAppearance extends NSObject {}
export interface NSAppearanceClass extends NSClass<NSAppearance> {
	appearanceNamed(name: string): NSAppearance
}

export declare const NSAppearance: NSAppearanceClass

export interface NSMutableParagraphStyle extends NSObject {}
export declare const NSMutableParagraphStyle: NSClass<NSMutableParagraphStyle>

export interface NSNotification extends NSObject {
	readonly object: any
}

export declare const NSNotification: NSClass<NSNotification>

export interface NSNotificationCenter extends NSObject {
	addObserverForNameObjectQueueUsingBlock(
		name: string,
		object: any,
		queue: any,
		// Must carry the NSNotification param: in combined programs this
		// signature merges with @nativescript/types' copy and iOS callers
		// already pass the note argument.
		block: (notification: NSNotification) => void,
	): any
	removeObserver(observer: any): void
}

export interface NSNotificationCenterClass extends NSClass<NSNotificationCenter> {
	readonly defaultCenter: NSNotificationCenter
}

export declare const NSNotificationCenter: NSNotificationCenterClass

export interface NSNumber extends NSObject {}
export declare const NSNumber: NSClass<NSNumber>

export interface NSPanGestureRecognizer extends NSGestureRecognizer {
	translationInView(view: NSView | null): NSPoint
	velocityInView(view: NSView | null): NSPoint
}

export declare const NSPanGestureRecognizer: NSClass<NSPanGestureRecognizer>

export interface NSPopover extends NSObject {
	contentViewController: NSViewController
	contentSize: NSSize
	behavior: number
	animates: boolean
	showRelativeToRectOfViewPreferredEdge(rect: NSRect, view: NSView, preferredEdge: number): void
	close(): void
}

export declare const NSPopover: NSClass<NSPopover>

export interface NSScrollView extends NSView {
	documentView: NSView | null
	contentView: any
	borderType: number
	drawsBackground: boolean
	hasVerticalScroller: boolean
	hasHorizontalScroller: boolean
	reflectScrolledClipView(clipView: any): void
}

export declare const NSScrollView: NSClass<NSScrollView>

export interface NSSlider extends NSControl {
	minValue: number
	maxValue: number
}

export declare const NSSlider: NSClass<NSSlider>

export interface NSStackView extends NSView {}
export declare const NSStackView: NSClass<NSStackView>

export interface NSTextField extends NSControl {
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

export declare const NSTextField: NSClass<NSTextField>

export interface NSSecureTextField extends NSTextField {}
export declare const NSSecureTextField: NSClass<NSSecureTextField>

export interface NSTextView extends NSView {
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

export declare const NSTextView: NSClass<NSTextView>

export interface NSTrackingArea extends NSObject {
	initWithRectOptionsOwnerUserInfo(rect: NSRect, options: number, owner: any, userInfo: any): this
}

export declare const NSTrackingArea: NSClass<NSTrackingArea>

export interface NSURL extends NSObject {}
export declare const NSURL: NSClass<NSURL>

export interface NSView extends NSObject {
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

export declare const NSView: NSClass<NSView>

export interface NSViewController extends NSObject {
	view: NSView
	preferredContentSize: NSSize
}

export declare const NSViewController: NSClass<NSViewController>

export interface NSWindow extends NSObject {
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
	// The completion handler is optional at runtime — callers pass null.
	beginSheetCompletionHandler(sheet: NSWindow, handler: (() => void) | null): void
	endSheet(sheet: NSWindow): void
	orderOut(sender: any): void
	center(): void
	makeKeyAndOrderFront(sender: any): void
}

export declare const NSWindow: NSClass<NSWindow>

// QuartzCore, referenced lazily by the presentation bridge for sheet
// transition fades.
export interface CABasicAnimation extends NSObject {
	fromValue: any
	toValue: any
	duration: number
}

export interface CABasicAnimationClass extends NSClass<CABasicAnimation> {
	animationWithKeyPath(keyPath: string): CABasicAnimation
}

export declare const CABasicAnimation: CABasicAnimationClass

// Enum containers. Members resolve to `number`, so bitwise masks compose.
export declare const NSBackingStoreType: { [key: string]: number }
export declare const NSBezelStyle: { [key: string]: number }
export declare const NSBorderType: { [key: string]: number }
export declare const NSButtonType: { [key: string]: number }
export declare const NSDatePickerElementFlags: { [key: string]: number }
export declare const NSDatePickerStyle: { [key: string]: number }
export declare const NSLayoutAttribute: { [key: string]: number }
export declare const NSPopoverBehavior: { [key: string]: number }
export declare const NSRectEdge: { [key: string]: number }
export declare const NSStackViewDistribution: { [key: string]: number }
export declare const NSStackViewGravity: { [key: string]: number }
export declare const NSLineBreakMode: { [key: string]: number }
export declare const NSTextAlignment: { [key: string]: number }
export declare const NSTrackingAreaOptions: { [key: string]: number }
export declare const NSUserInterfaceLayoutOrientation: { [key: string]: number }
export declare const NSWindowStyleMask: { [key: string]: number }

// Standalone constants.
export declare const NSImageScaleProportionallyDown: number
export declare const NSImageScaleProportionallyUpOrDown: number

// NSString notification names and attributed-string keys.
export declare const NSPopoverDidCloseNotification: string
export declare const NSViewBoundsDidChangeNotification: string
export declare const NSViewFrameDidChangeNotification: string
export declare const NSFontAttributeName: string
export declare const NSForegroundColorAttributeName: string
export declare const NSParagraphStyleAttributeName: string
export declare const NSURLErrorFailingURLErrorKey: string

// Protocol objects (opaque bridge references used in ObjCProtocols arrays).
export declare const NSTextViewDelegate: any
export declare const NSWindowDelegate: any
export declare const WKNavigationDelegate: any

// Additional AppKit decls.
export declare const NSTextFieldDelegate: any
export declare const NSTextFieldCell: NSClass<any>
export declare const NSSecureTextFieldCell: NSClass<any>
export declare const NSAutoresizingMaskOptions: { [key: string]: number }

// Additional AppKit surface contributed by the macOS app's ambient globals
// (window ordering, workspace, pasteboard, panels, sharing, defaults).
export interface NSFileManager extends NSObject {}
export declare const NSFileManager: NSClass<NSFileManager>

export interface NSPasteboard extends NSObject {}
export declare const NSPasteboard: NSPasteboard & NSClass<NSPasteboard>

export interface NSScreen extends NSObject {}
export declare const NSScreen: NSClass<NSScreen>

export interface NSSharingServicePicker extends NSObject {}
export declare const NSSharingServicePicker: NSClass<NSSharingServicePicker>

export interface NSUserDefaults extends NSObject {}
export declare const NSUserDefaults: NSClass<NSUserDefaults>

export interface NSPanel extends NSWindow {}
export declare const NSPanel: NSClass<NSPanel>

export interface NSWorkspace extends NSObject {}
export declare const NSWorkspace: NSClass<NSWorkspace>

export declare const NSApplicationActivationPolicy: { [key: string]: number }
export declare const NSEventMask: { [key: string]: number }
export declare const NSWindowOrderingMode: { [key: string]: number }

export declare const NSApplicationDelegate: any

// CoreText entry points used by the harness font loader.
export declare function CTFontManagerCreateFontDescriptorsFromURL(url: NSURL): any
export declare function CTFontDescriptorCopyAttribute(descriptor: any, attribute: any): any
export declare const kCTFontURLAttribute: any

// Accessibility announcements.
export declare function NSAccessibilityPostNotificationWithUserInfo(
	element: any,
	notification: any,
	userInfo: any,
): void

export declare const NSAccessibilityAnnouncementRequestedNotification: any
export declare const NSAccessibilityAnnouncementKey: any
export declare const NSAccessibilityPriorityKey: any
export declare const NSAccessibilityPriorityLevel: { [key: string]: number }
