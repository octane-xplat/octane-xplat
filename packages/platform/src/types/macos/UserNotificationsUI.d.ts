import type { NSColor } from './AppKit'

import type { CGRect } from './CoreFoundation'

import type { NSObjectProtocol } from './Runtime'

import type { UNNotification, UNNotificationResponse } from './UserNotifications'

import type { interop } from './objc-runtime'

import { NativeObject } from './objc-runtime'



export declare const UNNotificationContentExtensionResponseOption: {
  DoNotDismiss: 0,
  Dismiss: 1,
  DismissAndForwardAction: 2,
};

export declare const UNNotificationContentExtensionMediaPlayPauseButtonType: {
  None: 0,
  Default: 1,
  Overlay: 2,
};

export declare interface UNNotificationContentExtension extends NSObjectProtocol {
  didReceiveNotification(notification: UNNotification): void;

  didReceiveNotificationResponseCompletionHandler?(response: UNNotificationResponse, completion: (p1: interop.Enum<typeof UNNotificationContentExtensionResponseOption>) => void): void;

  readonly mediaPlayPauseButtonType?: interop.Enum<typeof UNNotificationContentExtensionMediaPlayPauseButtonType>;

  readonly mediaPlayPauseButtonFrame?: CGRect;

  readonly mediaPlayPauseButtonTintColor?: NSColor;

  mediaPlay?(): void;

  mediaPause?(): void;
}

export declare class UNNotificationContentExtension extends NativeObject implements UNNotificationContentExtension {
}
