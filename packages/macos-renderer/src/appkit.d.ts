// Ambient host globals injected by @nativescript/macos-node-api and the
// embedding Node process. The prerelease ships no generated AppKit metadata
// types, so bridge classes expose members loosely while the type names stay
// usable in our own signatures.

type NSClass<T> = {
	new (...args: any[]): T
	alloc(): T
	[key: string]: any
}

// Objective-C classes. Instances expose bridged members as `any`; the type
// name is real so parameters and node structs can reference them.
declare class NSObject {
	[key: string]: any
	static alloc(): any
	static new(): any
	static extend(methods: object, options?: object): any
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
interface WKWebView extends NSView {}
declare const WKWebView: NSClass<WKWebView>

interface WKWebViewConfiguration extends NSObject {}
declare const WKWebViewConfiguration: NSClass<WKWebViewConfiguration>

interface NSButton extends NSView {}
declare const NSButton: NSClass<NSButton>

interface NSClickGestureRecognizer extends NSObject {}
declare const NSClickGestureRecognizer: NSClass<NSClickGestureRecognizer>

interface NSColor extends NSObject {}
declare const NSColor: NSClass<NSColor>

interface NSColorSpace extends NSObject {}
declare const NSColorSpace: NSClass<NSColorSpace>

interface NSData extends NSObject {}
declare const NSData: NSClass<NSData>

interface NSDate extends NSObject {}
declare const NSDate: NSClass<NSDate>

interface NSDatePicker extends NSView {}
declare const NSDatePicker: NSClass<NSDatePicker>

interface NSEdgeInsets extends NSObject {}
declare const NSEdgeInsets: NSClass<NSEdgeInsets>

interface NSEvent extends NSObject {}
declare const NSEvent: NSClass<NSEvent>

interface NSFont extends NSObject {}
declare const NSFont: NSClass<NSFont>

interface NSFontDescriptor extends NSObject {}
declare const NSFontDescriptor: NSClass<NSFontDescriptor>

interface NSFontManager extends NSObject {}
declare const NSFontManager: NSClass<NSFontManager>

interface NSImage extends NSObject {}
declare const NSImage: NSClass<NSImage>

interface NSImageView extends NSView {}
declare const NSImageView: NSClass<NSImageView>

interface NSMenu extends NSObject {}
declare const NSMenu: NSClass<NSMenu>

interface NSMenuItem extends NSObject {}
declare const NSMenuItem: NSClass<NSMenuItem>

interface NSMutableParagraphStyle extends NSObject {}
declare const NSMutableParagraphStyle: NSClass<NSMutableParagraphStyle>

interface NSNotification extends NSObject {}
declare const NSNotification: NSClass<NSNotification>

interface NSNotificationCenter extends NSObject {}
declare const NSNotificationCenter: NSClass<NSNotificationCenter>

interface NSNumber extends NSObject {}
declare const NSNumber: NSClass<NSNumber>

interface NSPanGestureRecognizer extends NSObject {}
declare const NSPanGestureRecognizer: NSClass<NSPanGestureRecognizer>

interface NSPopover extends NSObject {}
declare const NSPopover: NSClass<NSPopover>

interface NSScrollView extends NSView {}
declare const NSScrollView: NSClass<NSScrollView>

interface NSSlider extends NSView {}
declare const NSSlider: NSClass<NSSlider>

interface NSStackView extends NSView {}
declare const NSStackView: NSClass<NSStackView>

interface NSTextField extends NSView {}
declare const NSTextField: NSClass<NSTextField>

interface NSSecureTextField extends NSTextField {}
declare const NSSecureTextField: NSClass<NSSecureTextField>

interface NSTextView extends NSView {}
declare const NSTextView: NSClass<NSTextView>

interface NSTrackingArea extends NSObject {}
declare const NSTrackingArea: NSClass<NSTrackingArea>

interface NSURL extends NSObject {}
declare const NSURL: NSClass<NSURL>

interface NSView extends NSObject {}
declare const NSView: NSClass<NSView>

interface NSViewController extends NSObject {}
declare const NSViewController: NSClass<NSViewController>

interface NSWindow extends NSObject {}
declare const NSWindow: NSClass<NSWindow>

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
	attachContextMenu?: (view: NSView, options: any, onSelect: any) => void
	attachDatePicker?: (view: NSView, options: any, onChange: any) => void
	presentSheet?: (view: NSView, options: any) => void
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
