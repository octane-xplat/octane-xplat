import type { AVCaptureFileOutput, AVCaptureSession, AVPlayer, AVPlayerLayer } from './AVFoundation'

import type { NSColor, NSImage, NSMenu } from './AppKit'

import type { CGRect } from './CoreFoundation'

import type { NSError } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSView } from './AppKit'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const AVPlayerViewControlsStyle: {
  None: 0,
  Inline: 1,
  Floating: 2,
  Minimal: 3,
  Default: 1,
};

export declare const AVCaptureViewControlsStyle: {
  Inline: 0,
  Floating: 1,
  InlineDeviceSelection: 2,
  Default: 0,
};

export declare const AVRoutePickerViewButtonState: {
  Normal: 0,
  NormalHighlighted: 1,
  Active: 2,
  ActiveHighlighted: 3,
};

export declare const AVPlayerViewTrimResult: {
  OK: 0,
  Cancel: 1,
};

export declare class AVLegibleMediaOptionsMenuState {
  constructor(init?: AVLegibleMediaOptionsMenuState);
  enabled: boolean;
  reason: interop.Enum<typeof AVLegibleMediaOptionsMenuStateChangeReason>;
}

export declare interface AVRoutePickerViewDelegate extends NSObjectProtocol {
  routePickerViewWillBeginPresentingRoutes?(routePickerView: AVRoutePickerView): void;

  routePickerViewDidEndPresentingRoutes?(routePickerView: AVRoutePickerView): void;
}

export declare class AVRoutePickerViewDelegate extends NativeObject implements AVRoutePickerViewDelegate {
}

export declare interface AVPlayerViewPictureInPictureDelegate extends NSObjectProtocol {
  playerViewWillStartPictureInPicture?(playerView: AVPlayerView): void;

  playerViewDidStartPictureInPicture?(playerView: AVPlayerView): void;

  playerViewFailedToStartPictureInPictureWithError?(playerView: AVPlayerView, error: NSError): void;

  playerViewWillStopPictureInPicture?(playerView: AVPlayerView): void;

  playerViewDidStopPictureInPicture?(playerView: AVPlayerView): void;

  playerViewRestoreUserInterfaceForPictureInPictureStopWithCompletionHandler?(playerView: AVPlayerView, completionHandler: (p1: boolean) => void): void;

  playerViewShouldAutomaticallyDismissAtPictureInPictureStart?(playerView: AVPlayerView): boolean;
}

export declare class AVPlayerViewPictureInPictureDelegate extends NativeObject implements AVPlayerViewPictureInPictureDelegate {
}

export declare interface AVCaptureViewDelegate extends NSObjectProtocol {
  captureViewStartRecordingToFileOutput(captureView: AVCaptureView, fileOutput: AVCaptureFileOutput): void;
}

export declare class AVCaptureViewDelegate extends NativeObject implements AVCaptureViewDelegate {
}

export declare interface AVPictureInPictureControllerDelegate extends NSObjectProtocol {
  pictureInPictureControllerWillStartPictureInPicture?(pictureInPictureController: AVPictureInPictureController): void;

  pictureInPictureControllerDidStartPictureInPicture?(pictureInPictureController: AVPictureInPictureController): void;

  pictureInPictureControllerFailedToStartPictureInPictureWithError?(pictureInPictureController: AVPictureInPictureController, error: NSError): void;

  pictureInPictureControllerWillStopPictureInPicture?(pictureInPictureController: AVPictureInPictureController): void;

  pictureInPictureControllerDidStopPictureInPicture?(pictureInPictureController: AVPictureInPictureController): void;

  pictureInPictureControllerRestoreUserInterfaceForPictureInPictureStopWithCompletionHandler?(pictureInPictureController: AVPictureInPictureController, completionHandler: (p1: boolean) => void): void;
}

export declare class AVPictureInPictureControllerDelegate extends NativeObject implements AVPictureInPictureControllerDelegate {
}

export declare class AVRoutePickerView extends NSView {
  delegate: AVRoutePickerViewDelegate;

  player: AVPlayer;

  routePickerButtonColorForState(state: interop.Enum<typeof AVRoutePickerViewButtonState>): NSColor;

  setRoutePickerButtonColorForState(color: NSColor | null, state: interop.Enum<typeof AVRoutePickerViewButtonState>): void;

  routePickerButtonBordered: boolean;

  isRoutePickerButtonBordered(): boolean;
}

export declare class AVPictureInPictureController extends NSObject {
  static isPictureInPictureSupported(): boolean;

  static readonly pictureInPictureButtonStartImage: NSImage;

  static readonly pictureInPictureButtonStopImage: NSImage;

  initWithPlayerLayer(playerLayer: AVPlayerLayer): this;

  readonly playerLayer: AVPlayerLayer;

  delegate: AVPictureInPictureControllerDelegate;

  startPictureInPicture(): void;

  stopPictureInPicture(): void;

  readonly pictureInPicturePossible: boolean;

  readonly pictureInPictureActive: boolean;

  readonly pictureInPictureSuspended: boolean;

  requiresLinearPlayback: boolean;

  isPictureInPicturePossible(): boolean;

  isPictureInPictureActive(): boolean;

  isPictureInPictureSuspended(): boolean;
}

export declare class AVCaptureView extends NSView {
  readonly session: AVCaptureSession;

  setSessionShowVideoPreviewShowAudioPreview(session: AVCaptureSession | null, showVideoPreview: boolean, showAudioPreview: boolean): void;

  readonly fileOutput: AVCaptureFileOutput;

  delegate: AVCaptureViewDelegate;

  controlsStyle: interop.Enum<typeof AVCaptureViewControlsStyle>;

  videoGravity: string;
}

export declare class AVPlayerView extends NSView {
  player: AVPlayer;

  controlsStyle: interop.Enum<typeof AVPlayerViewControlsStyle>;

  videoGravity: string;

  readonly readyForDisplay: boolean;

  readonly videoBounds: CGRect;

  readonly contentOverlayView: NSView;

  updatesNowPlayingInfoCenter: boolean;

  isReadyForDisplay(): boolean;

  showsFrameSteppingButtons: boolean;

  showsSharingServiceButton: boolean;

  actionPopUpButtonMenu: NSMenu;

  showsFullScreenToggleButton: boolean;

  showsTimecodes: boolean;

  readonly canBeginTrimming: boolean;

  beginTrimmingWithCompletionHandler(handler: (p1: interop.Enum<typeof AVPlayerViewTrimResult>) => void | null): void;

  flashChapterNumberChapterTitle(chapterNumber: number, chapterTitle: string | null): void;

  allowsPictureInPicturePlayback: boolean;

  pictureInPictureDelegate: AVPlayerViewPictureInPictureDelegate;
}
