import type { NSWindow } from './AppKit'

import type { DRBurn, DRDevice, DRErase } from './DiscRecording'

import type { NSDictionary } from './Foundation'

import type { interop } from './objc-runtime'

import { NSPanel } from './AppKit'



export declare const DREraseIcon: string;

export declare const DRBurnIcon: string;

export declare const DRBurnSetupPanelDefaultButtonDefaultTitle: string;

export declare const DRSetupPanelSelectedDeviceKey: string;

export declare const kEraseSessionProgressDialogOptionsCurrentVersion: number;

export declare const kDREraseProgressSetupCallbacksCurrentVersion: number;

export declare const kEraseSessionSetupDialogDontHandleReservations: number;

export declare const kBurnSessionProgressDialogDisplayVerboseProgress: number;

export declare const kBurnSessionSetupDialogAllowTestBurns: number;

export declare const kBurnSessionSetupDialogDontHandleReservations: number;

export declare const kBurnSessionSetupDialogForceClosedDiscs: number;

export declare const kBurnSessionSetupDialogDefaultOptions: number;

export declare const kDRBurnSessionOK: number;

export declare const kDRBurnSessionCancel: number;

export declare const DRSetupPanelDeviceSelectionChangedNotification: string;

export declare const kDRBurnProgressSetupCallbacksCurrentVersion: number;

export declare const kDREraseSessionOK: number;

export declare const kBurnSessionProgressDialogOptionsCurrentVersion: number;

export declare const kDRBurnSessionSetupCallbacksCurrentVersion: number;

export declare const kEraseSessionSetupDialogOptionsCurrentVersion: number;

export declare const kDREraseSessionCancel: number;

export declare const DREraseProgressPanelDidFinishNotification: string;

export declare const DRBurnProgressPanelWillBeginNotification: string;

export declare const kEraseSessionProgressDialogDefaultOptions: number;

export declare const kDREraseSessionSetupCallbacksCurrentVersion: number;

export declare const DRBurnProgressPanelDidFinishNotification: string;

export declare const kBurnSessionProgressDialogDefaultOptions: number;

export declare const DREraseProgressPanelWillBeginNotification: string;

export declare const kEraseSessionSetupDialogDefaultOptions: number;

export declare const kBurnSessionSetupDialogOptionsCurrentVersion: number;

export declare class DREraseSessionProgressDialogOptions {
  constructor(init?: DREraseSessionProgressDialogOptions);
  version: number;
  dialogOptionFlags: number;
  description: interop.Object | null;
}

export declare class DREraseSessionProgressCallbacks {
  constructor(init?: DREraseSessionProgressCallbacks);
  version: number;
  progressWillBegin: (p1: interop.PointerConvertible) => void | null;
  progressDidFinish: (p1: interop.PointerConvertible) => void | null;
  eraseDidFinish: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
}

export declare class DREraseSessionSetupDialogOptions {
  constructor(init?: DREraseSessionSetupDialogOptions);
  version: number;
  dialogOptionFlags: number;
}

export declare class __DREraseSession {
  constructor(init?: __DREraseSession);
}

export declare class DRBurnSessionProgressDialogOptions {
  constructor(init?: DRBurnSessionProgressDialogOptions);
  version: number;
  dialogOptionFlags: number;
  description: interop.Object | null;
}

export declare class DRBurnSessionProgressCallbacks {
  constructor(init?: DRBurnSessionProgressCallbacks);
  version: number;
  progressWillBegin: (p1: interop.PointerConvertible) => void | null;
  progressDidFinish: (p1: interop.PointerConvertible) => void | null;
  burnDidFinish: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
}

export declare class DRBurnSessionSetupCallbacks {
  constructor(init?: DRBurnSessionSetupCallbacks);
  version: number;
  deviceShouldBeTarget: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  containsSuitableMedia: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  deviceSelectionChanged: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
}

export declare class DRBurnSessionSetupDialogOptions {
  constructor(init?: DRBurnSessionSetupDialogOptions);
  version: number;
  dialogOptionFlags: number;
  defaultButtonTitle: interop.Object | null;
}

export declare class DREraseSessionSetupCallbacks {
  constructor(init?: DREraseSessionSetupCallbacks);
  version: number;
  deviceShouldBeTarget: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => number | null;
  containsSuitableMedia: (p1: interop.PointerConvertible, p2: interop.PointerConvertible, p3: interop.PointerConvertible) => number | null;
  deviceSelectionChanged: (p1: interop.PointerConvertible, p2: interop.PointerConvertible) => void | null;
}

export declare class __DRBurnSession {
  constructor(init?: __DRBurnSession);
}

export declare function DRBurnSessionGetTypeID(): number;

export declare function DRBurnSessionCreate(): interop.Object;

export declare function DRBurnSessionSetBurn(burnSession: interop.Object, burn: interop.Object): void;

export declare function DRBurnSessionGetBurn(burnSession: interop.Object): interop.Object;

export declare function DRBurnSessionSetupDialog(burnSession: interop.Object, options: interop.PointerConvertible, setupCallbacks: interop.PointerConvertible): number;

export declare function DRBurnSessionBeginProgressDialog(burnSession: interop.Object, layout: interop.Object, options: interop.PointerConvertible, progressCallbacks: interop.PointerConvertible): void;

export declare function DREraseSessionGetTypeID(): number;

export declare function DREraseSessionCreate(): interop.Object;

export declare function DREraseSessionSetErase(eraseSession: interop.Object, erase: interop.Object): void;

export declare function DREraseSessionGetErase(eraseSession: interop.Object): interop.Object;

export declare function DREraseSessionSetupDialog(eraseSession: interop.Object, options: interop.PointerConvertible, setupCallbacks: interop.PointerConvertible): number;

export declare function DREraseSessionBeginProgressDialog(eraseSession: interop.Object, options: interop.PointerConvertible, progressCallbacks: interop.PointerConvertible): void;

export declare class DREraseProgressPanel extends NSPanel {
  static progressPanel(): DREraseProgressPanel;

  beginProgressSheetForEraseModalForWindow(erase: DRErase, docWindow: NSWindow): void;

  beginProgressPanelForErase(erase: DRErase): void;

  setDescription(description: string): void;

  readonly description: string;
}

export declare class DRBurnProgressPanel extends NSPanel {
  static progressPanel(): DRBurnProgressPanel;

  beginProgressSheetForBurnLayoutModalForWindow(burn: DRBurn, layout: interop.Object, docWindow: NSWindow): void;

  beginProgressPanelForBurnLayout(burn: DRBurn, layout: interop.Object): void;

  setDescription(description: string): void;

  readonly description: string;

  setVerboseProgressStatus(verbose: boolean): void;

  verboseProgressStatus(): boolean;

  stopBurn(sender: interop.Object): void;
}

export declare class DRSetupPanel extends NSPanel {
  initWithNibName(nibName: string): this;

  runSetupPanel(): number;

  beginSetupSheetForWindowModalDelegateDidEndSelectorContextInfo(owner: NSWindow, modalDelegate: interop.Object, didEndSelector: string, contextInfo: interop.PointerConvertible): void;

  ok(sender: interop.Object): void;

  cancel(sender: interop.Object): void;

  eject(sender: interop.Object): void;

  open(sender: interop.Object): void;

  close(): void;
  close(sender: interop.Object): void;

  deviceSelectionChanged(device: DRDevice): void;

  mediaStateChanged(status: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): boolean;

  setupForDisplay(): void;
}

export declare class DRBurnSetupPanel extends DRSetupPanel {
  static setupPanel(): DRBurnSetupPanel;

  setDefaultButtonTitle(title: string): void;

  setCanSelectTestBurn(flag: boolean): void;

  setCanSelectAppendableMedia(flag: boolean): void;

  burnObject(): DRBurn;

  expand(sender: interop.Object): void;

  burnSpeed(sender: interop.Object): void;

  appendable(sender: interop.Object): void;

  completionAction(sender: interop.Object): void;

  testBurn(sender: interop.Object): void;

  verifyBurn(sender: interop.Object): void;
}

export declare class DREraseSetupPanel extends DRSetupPanel {
  static setupPanel(): DREraseSetupPanel;

  eraseObject(): DRErase;

  eraseType(sender: interop.Object): void;
}
