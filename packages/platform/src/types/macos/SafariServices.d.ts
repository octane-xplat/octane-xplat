import type { NSImage, NSRunningApplication } from './AppKit'

import type { NSArray, NSCoder, NSCopying, NSDictionary, NSError, NSExtensionContext, NSExtensionRequestHandling, NSSecureCoding, NSURL } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSViewController } from './AppKit'

import { NSObject } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const _SFSafariServicesVersion: interop.Enum<typeof SFSafariServicesVersion>;

export declare const _SFSafariServicesAvailable: interop.Pointer;

export declare const SFSafariSettingsErrorDomain: string;

export declare const SFExtensionProfileKey: string;

export declare const SFErrorDomain: string;

export declare const SFExtensionMessageKey: string;

export declare const SFSafariServicesVersion: {
  Version10_0: 0,
  Version10_1: 1,
  Version11_0: 2,
  Version12_0: 3,
  Version12_1: 4,
  Version13_0: 5,
  Version27_0: 6,
};

export declare const SFSafariSettingsError: {
  NotAllowed: 0,
  Failed: 1,
};

export declare const SFErrorCode: {
  NoExtensionFound: 1,
  NoAttachmentFound: 2,
  LoadingInterrupted: 3,
};

export declare interface SFSafariExtensionHandling extends NSObjectProtocol {
  messageReceivedWithNameFromPageUserInfo?(messageName: string, page: SFSafariPage, userInfo: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  messageReceivedFromContainingAppWithNameUserInfo?(messageName: string, userInfo: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  toolbarItemClickedInWindow?(window: SFSafariWindow): void;

  validateToolbarItemInWindowValidationHandler?(window: SFSafariWindow, validationHandler: (p1: boolean, p2: string) => void): void;

  contextMenuItemSelectedWithCommandInPageUserInfo?(command: string, page: SFSafariPage, userInfo: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  validateContextMenuItemWithCommandInPageUserInfoValidationHandler?(command: string, page: SFSafariPage, userInfo: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, validationHandler: (p1: boolean, p2: string) => void | null): void;

  popoverWillShowInWindow?(window: SFSafariWindow): void;

  popoverDidCloseInWindow?(window: SFSafariWindow): void;

  popoverViewController?(): SFSafariExtensionViewController;

  additionalRequestHeadersForURLCompletionHandler?(url: NSURL, completionHandler: (p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>) => void | null): void;

  contentBlockerWithIdentifierBlockedResourcesWithURLsOnPage?(contentBlockerIdentifier: string, urls: NSArray<interop.Object> | Array<interop.Object>, page: SFSafariPage): void;

  pageWillNavigateToURL?(page: SFSafariPage, url: NSURL | null): void;
}

export declare class SFSafariExtensionHandling extends NativeObject implements SFSafariExtensionHandling {
}

export declare class SFSafariExtension extends NSObject {
  static getBaseURIWithCompletionHandler(completionHandler: (p1: NSURL) => void | null): void;
}

export declare class SFSafariWindow extends NSObject implements NSCopying, NSSecureCoding {
  getActiveTabWithCompletionHandler(completionHandler: (p1: SFSafariTab) => void | null): void;

  getAllTabsWithCompletionHandler(completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>) => void): void;

  openTabWithURLMakeActiveIfPossibleCompletionHandler(url: NSURL, activateTab: boolean, completionHandler: (p1: SFSafariTab) => void | null): void;

  getToolbarItemWithCompletionHandler(completionHandler: (p1: SFSafariToolbarItem) => void | null): void;

  close(): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class SFSafariTab extends NSObject implements NSCopying, NSSecureCoding {
  getActivePageWithCompletionHandler(completionHandler: (p1: SFSafariPage) => void | null): void;

  getPagesWithCompletionHandler(completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>) => void | null): void;

  getContainingWindowWithCompletionHandler(completionHandler: (p1: SFSafariWindow) => void | null): void;

  activateWithCompletionHandler(completionHandler: () => void | null): void;

  navigateToURL(url: NSURL): void;

  close(): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class SFSafariPage extends NSObject implements NSCopying, NSSecureCoding {
  dispatchMessageToScriptWithNameUserInfo(messageName: string, userInfo: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  reload(): void;

  getPagePropertiesWithCompletionHandler(completionHandler: (p1: SFSafariPageProperties) => void | null): void;

  getContainingTabWithCompletionHandler(completionHandler: (p1: SFSafariTab) => void): void;

  getScreenshotOfVisibleAreaWithCompletionHandler(completionHandler: (p1: NSImage) => void | null): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class SFSafariExtensionViewController extends NSViewController {
  dismissPopover(): void;
}

export declare class SFSafariExtensionHandler extends NSObject implements NSExtensionRequestHandling, SFSafariExtensionHandling {
  beginRequestWithExtensionContext(context: NSExtensionContext): void;

  isEqual(object: interop.Object): boolean;

  readonly hash: number;

  readonly superclass: interop.Pointer;

  class(): interop.Pointer;

  self(): this;

  performSelector(aSelector: string): interop.Object;

  performSelectorWithObject(aSelector: string, object: interop.Object): interop.Object;

  performSelectorWithObjectWithObject(aSelector: string, object1: interop.Object, object2: interop.Object): interop.Object;

  readonly isProxy: boolean;

  isKindOfClass(aClass: interop.PointerConvertible): boolean;

  isMemberOfClass(aClass: interop.PointerConvertible): boolean;

  conformsToProtocol(aProtocol: interop.PointerConvertible): boolean;

  respondsToSelector(aSelector: string): boolean;

  retain(): this;

  release(): void;

  autorelease(): this;

  retainCount(): number;

  readonly zone: interop.Pointer;

  readonly description: string;

  readonly debugDescription: string;

  messageReceivedWithNameFromPageUserInfo(messageName: string, page: SFSafariPage, userInfo: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  messageReceivedFromContainingAppWithNameUserInfo(messageName: string, userInfo: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  toolbarItemClickedInWindow(window: SFSafariWindow): void;

  validateToolbarItemInWindowValidationHandler(window: SFSafariWindow, validationHandler: (p1: boolean, p2: string) => void): void;

  contextMenuItemSelectedWithCommandInPageUserInfo(command: string, page: SFSafariPage, userInfo: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null): void;

  validateContextMenuItemWithCommandInPageUserInfoValidationHandler(command: string, page: SFSafariPage, userInfo: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, validationHandler: (p1: boolean, p2: string) => void | null): void;

  popoverWillShowInWindow(window: SFSafariWindow): void;

  popoverDidCloseInWindow(window: SFSafariWindow): void;

  popoverViewController(): SFSafariExtensionViewController;

  additionalRequestHeadersForURLCompletionHandler(url: NSURL, completionHandler: (p1: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>) => void | null): void;

  contentBlockerWithIdentifierBlockedResourcesWithURLsOnPage(contentBlockerIdentifier: string, urls: NSArray<interop.Object> | Array<interop.Object>, page: SFSafariPage): void;

  pageWillNavigateToURL(page: SFSafariPage, url: NSURL | null): void;
}

export declare class SFContentBlockerManager extends NSObject {
  static reloadContentBlockerWithIdentifierCompletionHandler(identifier: string, completionHandler: (p1: NSError) => void | null): void;

  static getStateOfContentBlockerWithIdentifierCompletionHandler(identifier: string, completionHandler: (p1: SFContentBlockerState, p2: NSError) => void | null): void;
}

export declare class SFSafariToolbarItem extends NSObject implements NSCopying, NSSecureCoding {
  setEnabledWithBadgeText(enabled: boolean, badgeText: string | null): void;

  setEnabled(enabled: boolean): void;

  setBadgeText(badgeText: string | null): void;

  setImage(image: NSImage | null): void;

  setLabel(label: string | null): void;

  showPopover(): void;

  copyWithZone(zone: interop.PointerConvertible): interop.Object;

  static readonly supportsSecureCoding: boolean;

  encodeWithCoder(coder: NSCoder): void;

  initWithCoder(coder: NSCoder): this;
}

export declare class SFContentBlockerState extends NSObject {
  readonly enabled: boolean;

  isEnabled(): boolean;
}

export declare class SFSafariExtensionState extends NSObject {
  readonly enabled: boolean;

  isEnabled(): boolean;
}

export declare class SFSafariApplication extends NSObject {
  static getActiveWindowWithCompletionHandler(completionHandler: (p1: SFSafariWindow) => void | null): void;

  static getAllWindowsWithCompletionHandler(completionHandler: (p1: NSArray<interop.Object> | Array<interop.Object>) => void): void;

  static openWindowWithURLCompletionHandler(url: NSURL, completionHandler: (p1: SFSafariWindow) => void | null): void;

  static setToolbarItemsNeedUpdate(): void;

  static getHostApplicationWithCompletionHandler(completionHandler: (p1: NSRunningApplication) => void): void;

  static showPreferencesForExtensionWithIdentifierCompletionHandler(identifier: string, completionHandler: (p1: NSError) => void | null): void;

  static dispatchMessageWithNameToExtensionWithIdentifierUserInfoCompletionHandler(messageName: string, identifier: string, userInfo: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object> | null, completionHandler: (p1: NSError) => void | null): void;
}

export declare class SFSafariSettings extends NSObject {
  static checkAutoFillUserNamesAndPasswordsEnabledWithCompletionHandler(completionHandler: (p1: boolean, p2: NSError) => void | null): void;
}

export declare class SFUniversalLink extends NSObject {
  initWithWebpageURL(url: NSURL): this;

  readonly webpageURL: NSURL;

  readonly applicationURL: NSURL;

  enabled: boolean;

  isEnabled(): boolean;
}

export declare class SFSafariExtensionManager extends NSObject {
  static getStateOfSafariExtensionWithIdentifierCompletionHandler(identifier: string, completionHandler: (p1: SFSafariExtensionState, p2: NSError) => void | null): void;
}

export declare class SFSafariPageProperties extends NSObject {
  readonly url: NSURL;

  readonly title: string;

  readonly usesPrivateBrowsing: boolean;

  readonly active: boolean;

  isActive(): boolean;
}
