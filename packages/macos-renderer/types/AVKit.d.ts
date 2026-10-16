/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./AppKit.d.ts" />
/// <reference path="./Runtime.d.ts" />

declare const AVPlayerViewControlsStyle: {
	None: 0
	Inline: 1
	Floating: 2
	Minimal: 3
	Default: 1
}

declare const AVCaptureViewControlsStyle: {
	Inline: 0
	Floating: 1
	InlineDeviceSelection: 2
	Default: 0
}

declare const AVRoutePickerViewButtonState: {
	Normal: 0
	NormalHighlighted: 1
	Active: 2
	ActiveHighlighted: 3
}

declare const AVPlayerViewTrimResult: {
	OK: 0
	Cancel: 1
}

declare class AVLegibleMediaOptionsMenuState {
	constructor(init?: AVLegibleMediaOptionsMenuState)
	enabled: boolean
	reason: interop.Enum<typeof AVLegibleMediaOptionsMenuStateChangeReason>
}

declare interface AVRoutePickerViewDelegate extends NSObjectProtocol {
	routePickerViewWillBeginPresentingRoutes?(routePickerView: AVRoutePickerView): void

	routePickerViewDidEndPresentingRoutes?(routePickerView: AVRoutePickerView): void
}

declare class AVRoutePickerViewDelegate extends NativeObject implements AVRoutePickerViewDelegate {}

declare interface AVPlayerViewPictureInPictureDelegate extends NSObjectProtocol {
	playerViewWillStartPictureInPicture?(playerView: AVPlayerView): void

	playerViewDidStartPictureInPicture?(playerView: AVPlayerView): void

	playerViewFailedToStartPictureInPictureWithError?(playerView: AVPlayerView, error: NSError): void

	playerViewWillStopPictureInPicture?(playerView: AVPlayerView): void

	playerViewDidStopPictureInPicture?(playerView: AVPlayerView): void

	playerViewRestoreUserInterfaceForPictureInPictureStopWithCompletionHandler?(
		playerView: AVPlayerView,
		completionHandler: (p1: boolean) => void,
	): void

	playerViewShouldAutomaticallyDismissAtPictureInPictureStart?(playerView: AVPlayerView): boolean
}

declare class AVPlayerViewPictureInPictureDelegate
	extends NativeObject
	implements AVPlayerViewPictureInPictureDelegate {}

declare interface AVCaptureViewDelegate extends NSObjectProtocol {
	captureViewStartRecordingToFileOutput(
		captureView: AVCaptureView,
		fileOutput: AVCaptureFileOutput,
	): void
}

declare class AVCaptureViewDelegate extends NativeObject implements AVCaptureViewDelegate {}

declare interface AVPictureInPictureControllerDelegate extends NSObjectProtocol {
	pictureInPictureControllerWillStartPictureInPicture?(
		pictureInPictureController: AVPictureInPictureController,
	): void

	pictureInPictureControllerDidStartPictureInPicture?(
		pictureInPictureController: AVPictureInPictureController,
	): void

	pictureInPictureControllerFailedToStartPictureInPictureWithError?(
		pictureInPictureController: AVPictureInPictureController,
		error: NSError,
	): void

	pictureInPictureControllerWillStopPictureInPicture?(
		pictureInPictureController: AVPictureInPictureController,
	): void

	pictureInPictureControllerDidStopPictureInPicture?(
		pictureInPictureController: AVPictureInPictureController,
	): void

	pictureInPictureControllerRestoreUserInterfaceForPictureInPictureStopWithCompletionHandler?(
		pictureInPictureController: AVPictureInPictureController,
		completionHandler: (p1: boolean) => void,
	): void
}

declare class AVPictureInPictureControllerDelegate
	extends NativeObject
	implements AVPictureInPictureControllerDelegate {}

declare class AVRoutePickerView extends NSView {
	delegate: AVRoutePickerViewDelegate

	player: AVPlayer

	routePickerButtonColorForState(state: interop.Enum<typeof AVRoutePickerViewButtonState>): NSColor

	setRoutePickerButtonColorForState(
		color: NSColor | null,
		state: interop.Enum<typeof AVRoutePickerViewButtonState>,
	): void

	routePickerButtonBordered: boolean

	isRoutePickerButtonBordered(): boolean
}

declare class AVPictureInPictureController extends NSObject {
	static isPictureInPictureSupported(): boolean

	static readonly pictureInPictureButtonStartImage: NSImage

	static readonly pictureInPictureButtonStopImage: NSImage

	initWithPlayerLayer(playerLayer: AVPlayerLayer): this

	readonly playerLayer: AVPlayerLayer

	delegate: AVPictureInPictureControllerDelegate

	startPictureInPicture(): void

	stopPictureInPicture(): void

	readonly pictureInPicturePossible: boolean

	readonly pictureInPictureActive: boolean

	readonly pictureInPictureSuspended: boolean

	requiresLinearPlayback: boolean

	isPictureInPicturePossible(): boolean

	isPictureInPictureActive(): boolean

	isPictureInPictureSuspended(): boolean
}

declare class AVCaptureView extends NSView {
	readonly session: AVCaptureSession

	setSessionShowVideoPreviewShowAudioPreview(
		session: AVCaptureSession | null,
		showVideoPreview: boolean,
		showAudioPreview: boolean,
	): void

	readonly fileOutput: AVCaptureFileOutput

	delegate: AVCaptureViewDelegate

	controlsStyle: interop.Enum<typeof AVCaptureViewControlsStyle>

	videoGravity: string
}

declare class AVPlayerView extends NSView {
	player: AVPlayer

	controlsStyle: interop.Enum<typeof AVPlayerViewControlsStyle>

	videoGravity: string

	readonly readyForDisplay: boolean

	readonly videoBounds: CGRect

	readonly contentOverlayView: NSView

	updatesNowPlayingInfoCenter: boolean

	isReadyForDisplay(): boolean

	showsFrameSteppingButtons: boolean

	showsSharingServiceButton: boolean

	actionPopUpButtonMenu: NSMenu

	showsFullScreenToggleButton: boolean

	showsTimecodes: boolean

	readonly canBeginTrimming: boolean

	beginTrimmingWithCompletionHandler(
		handler: (p1: interop.Enum<typeof AVPlayerViewTrimResult>) => void | null,
	): void

	flashChapterNumberChapterTitle(chapterNumber: number, chapterTitle: string | null): void

	allowsPictureInPicturePlayback: boolean

	pictureInPictureDelegate: AVPlayerViewPictureInPictureDelegate
}
