import type { NSDateInterval, NSURL } from './Foundation'

import type { interop } from './objc-runtime'

import { NSViewController } from './AppKit'

import { NSObject } from './Runtime'



export declare class STScreenTimeConfiguration extends NSObject {
  readonly enforcesChildRestrictions: boolean;
}

export declare class STScreenTimeConfigurationObserver extends NSObject {
  initWithUpdateQueue(updateQueue: NSObject): this;

  startObserving(): void;

  stopObserving(): void;

  readonly configuration: STScreenTimeConfiguration;
}

export declare class STWebpageController extends NSViewController {
  suppressUsageRecording: boolean;

  URL: NSURL;

  URLIsPlayingVideo: boolean;

  URLIsPictureInPicture: boolean;

  readonly URLIsBlocked: boolean;

  setBundleIdentifierError(bundleIdentifier: string, error: interop.PointerConvertible): boolean;
}

export declare class STWebHistory extends NSObject {
  initWithBundleIdentifierError(bundleIdentifier: string, error: interop.PointerConvertible): this;

  deleteHistoryForURL(url: NSURL): void;

  deleteHistoryDuringInterval(interval: NSDateInterval): void;

  deleteAllHistory(): void;
}
