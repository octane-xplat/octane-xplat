import type { NSArray, NSCoder, NSCopying, NSDate, NSDateComponents, NSDictionary, NSError, NSMutableCopying, NSNumber, NSSecureCoding, NSSet, NSURL } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const UNNotificationDefaultActionIdentifier: string;

export declare const UNNotificationCategoryOptionNone: interop.Enum<typeof UNNotificationCategoryOptions>;

export declare const UNNotificationAttachmentOptionsTypeHintKey: string;

export declare const UNNotificationDismissActionIdentifier: string;

export declare const UNNotificationAttachmentOptionsThumbnailClippingRectKey: string;

export declare const UNNotificationPresentationOptionNone: interop.Enum<typeof UNNotificationPresentationOptions>;

export declare const UNErrorDomain: string;

export declare const UNNotificationAttachmentOptionsThumbnailHiddenKey: string;

export declare const UNNotificationActionOptionNone: interop.Enum<typeof UNNotificationActionOptions>;

export declare const UNAuthorizationOptionNone: interop.Enum<typeof UNAuthorizationOptions>;

export declare const UNNotificationAttachmentOptionsThumbnailTimeKey: string;

export declare const UNNotificationPresentationOptions: {
  Badge: 1,
  Sound: 2,
  Alert: 4,
  List: 8,
  Banner: 16,
};

export declare const UNAlertStyle: {
  None: 0,
  Banner: 1,
  Alert: 2,
};

export declare const UNNotificationSetting: {
  NotSupported: 0,
  Disabled: 1,
  Enabled: 2,
};

export declare const UNShowPreviewsSetting: {
  Always: 0,
  WhenAuthenticated: 1,
  Never: 2,
};

export declare const UNAuthorizationStatus: {
  NotDetermined: 0,
  Denied: 1,
  Authorized: 2,
  Provisional: 3,
};

export declare const UNAuthorizationOptions: {
  Badge: 1,
  Sound: 2,
  Alert: 4,
  CarPlay: 8,
  CriticalAlert: 16,
  ProvidesAppNotificationSettings: 32,
  Provisional: 64,
};

export declare const UNErrorCode: {
  NotificationsNotAllowed: 1,
  AttachmentInvalidURL: 100,
  AttachmentUnrecognizedType: 101,
  AttachmentInvalidFileSize: 102,
  AttachmentNotInDataStore: 103,
  AttachmentMoveIntoDataStoreFailed: 104,
  AttachmentCorrupt: 105,
  NotificationInvalidNoDate: 1400,
  NotificationInvalidNoContent: 1401,
  ContentProvidingObjectNotAllowed: 1500,
  ContentProvidingInvalid: 1501,
  BadgeInputInvalid: 1600,
};

export declare const UNNotificationCategoryOptions: {
  CustomDismissAction: 1,
  HiddenPreviewsShowTitle: 4,
  HiddenPreviewsShowSubtitle: 8,
};

export declare const UNNotificationActionOptions: {
  AuthenticationRequired: 1,
  Destructive: 2,
  Foreground: 4,
};

export declare interface UNUserNotificationCenterDelegate extends NSObjectProtocol {
  userNotificationCenterWillPresentNotificationWithCompletionHandler?(center: UNUserNotificationCenter, notification: UNNotification, completionHandler: (p1: interop.Enum<typeof UNNotificationPresentationOptions>) => void): void;

  userNotificationCenterDidReceiveNotificationResponseWithCompletionHandler?(center: UNUserNotificationCenter, response: UNNotificationResponse, completionHandler: () => void): void;

  userNotificationCenterOpenSettingsForNotification?(center: UNUserNotificationCenter, notification: UNNotification | null): void;
}

export declare class UNUserNotificationCenterDelegate extends NativeObject implements UNUserNotificationCenterDelegate {
}

export declare class UNUserNotificationCenter extends NSObject {
  delegate: UNUserNotificationCenterDelegate;

  readonly supportsContentExtensions: boolean;

  static currentNotificationCenter(): UNUserNotificationCenter;

  requestAuthorizationWithOptionsCompletionHandler(options: interop.Enum<typeof UNAuthorizationOptions>, completionHandler: (p1: boolean, p2: NSError) => void | null): void;

  setNotificationCategories(categories: NSSet): void;

  getNotificationCategoriesWithCompletionHandler(completionHandler: (p1: NSSet) => void): void;

  getNotificationSettingsWithCompletionHandler(completionHandler: (p1: UNNotificationSettings) => void): void;

  addNotificationRequestWithCompletionHandler(request: UNNotificationRequest, completionHandler: (p1: NSError) => void | null): void;

  getPendingNotificationRequestsWithCompletionHandler(completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>) => void): void;

  removePendingNotificationRequestsWithIdentifiers(identifiers: NSArray<interop.Object> | Array<interop.Object>): void;

  removeAllPendingNotificationRequests(): void;

  getDeliveredNotificationsWithCompletionHandler(completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>) => void): void;

  removeDeliveredNotificationsWithIdentifiers(identifiers: NSArray<interop.Object> | Array<interop.Object>): void;

  removeAllDeliveredNotifications(): void;
}

export declare class UNTimeIntervalNotificationTrigger extends UNNotificationTrigger {
  readonly timeInterval: number;

  static triggerWithTimeIntervalRepeats<This extends abstract new (...args: any) => any>(this: This, timeInterval: number, repeats: boolean): InstanceType<This>;

  nextTriggerDate(): NSDate;
}

export declare class UNNotificationTrigger extends NSObject implements NSCopying, NSSecureCoding {
  readonly repeats: boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class UNNotificationSound extends NSObject implements NSCopying, NSSecureCoding {
  static readonly defaultSound: UNNotificationSound;

  static readonly defaultCriticalSound: UNNotificationSound;

  static defaultCriticalSoundWithAudioVolume<This extends abstract new (...args: any) => any>(this: This, volume: number): InstanceType<This>;

  static soundNamed<This extends abstract new (...args: any) => any>(this: This, name: string): InstanceType<This>;

  static criticalSoundNamed<This extends abstract new (...args: any) => any>(this: This, name: string): InstanceType<This>;

  static criticalSoundNamedWithAudioVolume<This extends abstract new (...args: any) => any>(this: This, name: string, volume: number): InstanceType<This>;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class UNNotificationServiceExtension extends NSObject {
  didReceiveNotificationRequestWithContentHandler(request: UNNotificationRequest, contentHandler: (p1: UNNotificationContent) => void): void;

  serviceExtensionTimeWillExpire(): void;
}

export declare class UNNotificationResponse extends NSObject implements NSCopying, NSSecureCoding {
  readonly notification: UNNotification;

  readonly actionIdentifier: string;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class UNNotificationAttachment extends NSObject implements NSCopying, NSSecureCoding {
  readonly identifier: string;

  readonly URL: NSURL;

  readonly type: string;

  static attachmentWithIdentifierURLOptionsError<This extends abstract new (...args: any) => any>(this: This, identifier: string, URL: NSURL, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, error: interop.PointerConvertible): InstanceType<This>;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class UNNotificationRequest extends NSObject implements NSCopying, NSSecureCoding {
  readonly identifier: string;

  readonly content: UNNotificationContent;

  readonly trigger: UNNotificationTrigger;

  static requestWithIdentifierContentTrigger<This extends abstract new (...args: any) => any>(this: This, identifier: string, content: UNNotificationContent, trigger: UNNotificationTrigger | null): InstanceType<This>;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class UNNotificationContent extends NSObject implements NSCopying, NSMutableCopying, NSSecureCoding {
  readonly attachments: NSArray;

  readonly badge: NSNumber;

  readonly body: string;

  readonly categoryIdentifier: string;

  readonly sound: UNNotificationSound;

  readonly subtitle: string;

  readonly threadIdentifier: string;

  readonly title: string;

  readonly userInfo: NSDictionary;

  readonly summaryArgument: string;

  readonly summaryArgumentCount: number;

  readonly targetContentIdentifier: string;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  mutableCopyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class UNNotification extends NSObject implements NSCopying, NSSecureCoding {
  readonly date: NSDate;

  readonly request: UNNotificationRequest;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class UNNotificationAction extends NSObject implements NSCopying, NSSecureCoding {
  readonly identifier: string;

  readonly title: string;

  readonly options: interop.Enum<typeof UNNotificationActionOptions>;

  static actionWithIdentifierTitleOptions<This extends abstract new (...args: any) => any>(this: This, identifier: string, title: string, options: interop.Enum<typeof UNNotificationActionOptions>): InstanceType<This>;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class UNTextInputNotificationResponse extends UNNotificationResponse {
  readonly userText: string;
}

export declare class UNMutableNotificationContent extends UNNotificationContent {
  // @ts-ignore MemberDecl.tsIgnore
  get attachments(): NSArray;
  // @ts-ignore MemberDecl.tsIgnore
  set attachments(value: NSArray<interop.Object> | Array<interop.Object>);

  // @ts-ignore MemberDecl.tsIgnore
  badge: NSNumber;

  // @ts-ignore MemberDecl.tsIgnore
  body: string;

  // @ts-ignore MemberDecl.tsIgnore
  categoryIdentifier: string;

  // @ts-ignore MemberDecl.tsIgnore
  sound: UNNotificationSound;

  // @ts-ignore MemberDecl.tsIgnore
  subtitle: string;

  // @ts-ignore MemberDecl.tsIgnore
  threadIdentifier: string;

  // @ts-ignore MemberDecl.tsIgnore
  title: string;

  // @ts-ignore MemberDecl.tsIgnore
  get userInfo(): NSDictionary;
  // @ts-ignore MemberDecl.tsIgnore
  set userInfo(value: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>);

  // @ts-ignore MemberDecl.tsIgnore
  summaryArgument: string;

  // @ts-ignore MemberDecl.tsIgnore
  summaryArgumentCount: number;

  // @ts-ignore MemberDecl.tsIgnore
  targetContentIdentifier: string;
}

export declare class UNCalendarNotificationTrigger extends UNNotificationTrigger {
  readonly dateComponents: NSDateComponents;

  static triggerWithDateMatchingComponentsRepeats<This extends abstract new (...args: any) => any>(this: This, dateComponents: NSDateComponents, repeats: boolean): InstanceType<This>;

  nextTriggerDate(): NSDate;
}

export declare class UNNotificationCategory extends NSObject implements NSCopying, NSSecureCoding {
  readonly identifier: string;

  readonly actions: NSArray;

  readonly intentIdentifiers: NSArray;

  readonly options: interop.Enum<typeof UNNotificationCategoryOptions>;

  readonly hiddenPreviewsBodyPlaceholder: string;

  readonly categorySummaryFormat: string;

  static categoryWithIdentifierActionsIntentIdentifiersOptions<This extends abstract new (...args: any) => any>(this: This, identifier: string, actions: NSArray<interop.Object> | Array<interop.Object>, intentIdentifiers: NSArray<interop.Object> | Array<interop.Object>, options: interop.Enum<typeof UNNotificationCategoryOptions>): InstanceType<This>;

  static categoryWithIdentifierActionsIntentIdentifiersHiddenPreviewsBodyPlaceholderOptions<This extends abstract new (...args: any) => any>(this: This, identifier: string, actions: NSArray<interop.Object> | Array<interop.Object>, intentIdentifiers: NSArray<interop.Object> | Array<interop.Object>, hiddenPreviewsBodyPlaceholder: string, options: interop.Enum<typeof UNNotificationCategoryOptions>): InstanceType<This>;

  static categoryWithIdentifierActionsIntentIdentifiersHiddenPreviewsBodyPlaceholderCategorySummaryFormatOptions<This extends abstract new (...args: any) => any>(this: This, identifier: string, actions: NSArray<interop.Object> | Array<interop.Object>, intentIdentifiers: NSArray<interop.Object> | Array<interop.Object>, hiddenPreviewsBodyPlaceholder: string | null, categorySummaryFormat: string | null, options: interop.Enum<typeof UNNotificationCategoryOptions>): InstanceType<This>;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class UNNotificationSettings extends NSObject implements NSCopying, NSSecureCoding {
  readonly authorizationStatus: interop.Enum<typeof UNAuthorizationStatus>;

  readonly soundSetting: interop.Enum<typeof UNNotificationSetting>;

  readonly badgeSetting: interop.Enum<typeof UNNotificationSetting>;

  readonly alertSetting: interop.Enum<typeof UNNotificationSetting>;

  readonly notificationCenterSetting: interop.Enum<typeof UNNotificationSetting>;

  readonly lockScreenSetting: interop.Enum<typeof UNNotificationSetting>;

  readonly alertStyle: interop.Enum<typeof UNAlertStyle>;

  readonly showPreviewsSetting: interop.Enum<typeof UNShowPreviewsSetting>;

  readonly criticalAlertSetting: interop.Enum<typeof UNNotificationSetting>;

  readonly providesAppNotificationSettings: boolean;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class UNTextInputNotificationAction extends UNNotificationAction {
  static actionWithIdentifierTitleOptionsTextInputButtonTitleTextInputPlaceholder<This extends abstract new (...args: any) => any>(this: This, identifier: string, title: string, options: interop.Enum<typeof UNNotificationActionOptions>, textInputButtonTitle: string, textInputPlaceholder: string): InstanceType<This>;

  readonly textInputButtonTitle: string;

  readonly textInputPlaceholder: string;
}

export declare class UNPushNotificationTrigger extends UNNotificationTrigger {
}
