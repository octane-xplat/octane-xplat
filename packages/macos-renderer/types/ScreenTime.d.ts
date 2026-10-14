/// <reference types="@nativescript/objc-node-api" />
/// <reference path="./Runtime.d.ts" />
/// <reference path="./AppKit.d.ts" />

declare class STScreenTimeConfiguration extends NSObject {
  readonly enforcesChildRestrictions: boolean;
}

declare class STScreenTimeConfigurationObserver extends NSObject {
  initWithUpdateQueue(updateQueue: NSObject): this;

  startObserving(): void;

  stopObserving(): void;

  readonly configuration: STScreenTimeConfiguration;
}

declare class STWebpageController extends NSViewController {
  suppressUsageRecording: boolean;

  URL: NSURL;

  URLIsPlayingVideo: boolean;

  URLIsPictureInPicture: boolean;

  readonly URLIsBlocked: boolean;

  setBundleIdentifierError(bundleIdentifier: string, error: interop.PointerConvertible): boolean;
}

declare class STWebHistory extends NSObject {
  initWithBundleIdentifierError(bundleIdentifier: string, error: interop.PointerConvertible): this;

  deleteHistoryForURL(url: NSURL): void;

  deleteHistoryDuringInterval(interval: NSDateInterval): void;

  deleteAllHistory(): void;
}

