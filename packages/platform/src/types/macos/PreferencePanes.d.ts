import type { NSView } from './AppKit'

import type { NSArray, NSBundle } from './Foundation'

import type { interop } from './objc-runtime'

import { NSObject } from './Runtime'



export declare const NSPrefPaneHelpMenuAnchorKey: string;

export declare const NSPrefPaneHelpMenuInfoPListKey: string;

export declare const NSPrefPaneHelpMenuTitleKey: string;

export declare const NSPreferencePaneSwitchToPaneNotification: string;

export declare const NSPreferencePaneCancelUnselectNotification: string;

export declare const NSPreferencePrefPaneIsAvailableNotification: string;

export declare const NSPreferencePaneDoUnselectNotification: string;

export declare const NSPreferencePaneUpdateHelpMenuNotification: string;

export declare const NSPreferencePaneUnselectReply: {
  Cancel: 0,
  Now: 1,
  Later: 2,
};

export declare class NSPreferencePane extends NSObject {
  initWithBundle(bundle: NSBundle): this;

  readonly bundle: NSBundle;

  loadMainView(): NSView;

  mainViewDidLoad(): void;

  readonly mainNibName: string;

  assignMainView(): void;

  willSelect(): void;

  didSelect(): void;

  readonly shouldUnselect: interop.Enum<typeof NSPreferencePaneUnselectReply>;

  replyToShouldUnselect(shouldUnselect: boolean): void;

  willUnselect(): void;

  didUnselect(): void;

  mainView: NSView;

  initialKeyView: NSView;

  firstKeyView: NSView;

  lastKeyView: NSView;

  readonly autoSaveTextFields: boolean;

  readonly selected: boolean;

  updateHelpMenuWithArray(inArrayOfMenuItems: NSArray<interop.Object> | Array<interop.Object> | null): void;

  isSelected(): boolean;
}
