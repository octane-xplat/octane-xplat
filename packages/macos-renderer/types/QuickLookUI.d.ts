/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./AppKit.d.ts" />

declare const QLPreviewViewStyle: {
	Normal: 0
	Compact: 1
}

declare interface QLPreviewPanelDataSource {
	numberOfPreviewItemsInPreviewPanel(panel: QLPreviewPanel): number

	previewPanelPreviewItemAtIndex(panel: QLPreviewPanel, index: number): QLPreviewItem
}

declare class QLPreviewPanelDataSource extends NativeObject implements QLPreviewPanelDataSource {}

declare interface QLPreviewItem extends NSObjectProtocol {
	readonly previewItemURL: NSURL

	readonly previewItemTitle?: string

	readonly previewItemDisplayState?: interop.Object
}

declare class QLPreviewItem extends NativeObject implements QLPreviewItem {}

declare interface QLPreviewingController extends NSObjectProtocol {
	preparePreviewOfSearchableItemWithIdentifierQueryStringCompletionHandler?(
		identifier: string,
		queryString: string | null,
		handler: (p1: NSError) => void | null,
	): void

	preparePreviewOfFileAtURLCompletionHandler?(
		url: NSURL,
		handler: (p1: NSError) => void | null,
	): void

	providePreviewForFileRequestCompletionHandler?(
		request: QLFilePreviewRequest,
		handler: (p1: QLPreviewReply, p2: NSError) => void | null,
	): void
}

declare class QLPreviewingController extends NativeObject implements QLPreviewingController {}

declare interface QLPreviewPanelDelegate extends NSWindowDelegate {
	previewPanelHandleEvent?(panel: QLPreviewPanel, event: NSEvent): boolean

	previewPanelSourceFrameOnScreenForPreviewItem?(panel: QLPreviewPanel, item: QLPreviewItem): CGRect

	previewPanelTransitionImageForPreviewItemContentRect?(
		panel: QLPreviewPanel,
		item: QLPreviewItem,
		contentRect: interop.PointerConvertible,
	): interop.Object
}

declare class QLPreviewPanelDelegate extends NativeObject implements QLPreviewPanelDelegate {}

declare class QLPreviewView extends NSView {
	initWithFrameStyle(frame: CGRect, style: interop.Enum<typeof QLPreviewViewStyle>): this

	initWithFrame(frameRect: CGRect): this
	initWithFrame(frame: CGRect): this

	previewItem: QLPreviewItem

	refreshPreviewItem(): void

	displayState: interop.Object

	close(): void

	shouldCloseWithWindow: boolean

	autostarts: boolean
}

// @ts-ignore ClassDecl.tsIgnore
declare class QLPreviewPanel extends NSPanel {
	static sharedPreviewPanel(): QLPreviewPanel

	static sharedPreviewPanelExists(): boolean

	readonly currentController: interop.Object

	updateController(): void

	dataSource: QLPreviewPanelDataSource

	reloadData(): void

	refreshCurrentPreviewItem(): void

	currentPreviewItemIndex: number

	readonly currentPreviewItem: QLPreviewItem

	displayState: interop.Object

	// @ts-ignore MemberDecl.tsIgnore
	delegate: interop.Object

	enterFullScreenModeWithOptions(
		screen: NSScreen,
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): boolean

	exitFullScreenModeWithOptions(
		options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>,
	): void

	readonly inFullScreenMode: boolean

	isInFullScreenMode(): boolean
}
