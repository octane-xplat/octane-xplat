import type { NSEvent, NSScreen, NSWindowDelegate } from './AppKit'

import type { CGRect } from './CoreFoundation'

import type { NSDictionary, NSError, NSURL } from './Foundation'

import type { NSObjectProtocol } from './Runtime'

import type { interop } from './objc-runtime'

import { NSPanel, NSView } from './AppKit'

import { NativeObject } from './objc-runtime'



export declare const QLPreviewViewStyle: {
  Normal: 0,
  Compact: 1,
};

export declare interface QLPreviewPanelDataSource {
  numberOfPreviewItemsInPreviewPanel(panel: QLPreviewPanel): number;

  previewPanelPreviewItemAtIndex(panel: QLPreviewPanel, index: number): QLPreviewItem;
}

export declare class QLPreviewPanelDataSource extends NativeObject implements QLPreviewPanelDataSource {
}

export declare interface QLPreviewItem extends NSObjectProtocol {
  readonly previewItemURL: NSURL;

  readonly previewItemTitle?: string;

  readonly previewItemDisplayState?: interop.Object;
}

export declare class QLPreviewItem extends NativeObject implements QLPreviewItem {
}

export declare interface QLPreviewingController extends NSObjectProtocol {
  preparePreviewOfSearchableItemWithIdentifierQueryStringCompletionHandler?(identifier: string, queryString: string | null, handler: (p1: NSError) => void | null): void;

  preparePreviewOfFileAtURLCompletionHandler?(url: NSURL, handler: (p1: NSError) => void | null): void;

  providePreviewForFileRequestCompletionHandler?(request: QLFilePreviewRequest, handler: (p1: QLPreviewReply, p2: NSError) => void | null): void;
}

export declare class QLPreviewingController extends NativeObject implements QLPreviewingController {
}

export declare interface QLPreviewPanelDelegate extends NSWindowDelegate {
  previewPanelHandleEvent?(panel: QLPreviewPanel, event: NSEvent): boolean;

  previewPanelSourceFrameOnScreenForPreviewItem?(panel: QLPreviewPanel, item: QLPreviewItem): CGRect;

  previewPanelTransitionImageForPreviewItemContentRect?(panel: QLPreviewPanel, item: QLPreviewItem, contentRect: interop.PointerConvertible): interop.Object;
}

export declare class QLPreviewPanelDelegate extends NativeObject implements QLPreviewPanelDelegate {
}

export declare class QLPreviewView extends NSView {
  initWithFrameStyle(frame: CGRect, style: interop.Enum<typeof QLPreviewViewStyle>): this;

  initWithFrame(frameRect: CGRect): this;
  initWithFrame(frame: CGRect): this;

  previewItem: QLPreviewItem;

  refreshPreviewItem(): void;

  displayState: interop.Object;

  close(): void;

  shouldCloseWithWindow: boolean;

  autostarts: boolean;
}

export declare class QLPreviewPanel extends NSPanel {
  static sharedPreviewPanel(): QLPreviewPanel;

  static sharedPreviewPanelExists(): boolean;

  readonly currentController: interop.Object;

  updateController(): void;

  dataSource: QLPreviewPanelDataSource;

  reloadData(): void;

  refreshCurrentPreviewItem(): void;

  currentPreviewItemIndex: number;

  readonly currentPreviewItem: QLPreviewItem;

  displayState: interop.Object;

  // @ts-ignore MemberDecl.tsIgnore
  delegate: interop.Object;

  enterFullScreenModeWithOptions(screen: NSScreen, options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): boolean;

  exitFullScreenModeWithOptions(options: NSDictionary<interop.Object, interop.Object> | Record<interop.Object, interop.Object>): void;

  readonly inFullScreenMode: boolean;

  isInFullScreenMode(): boolean;
}
