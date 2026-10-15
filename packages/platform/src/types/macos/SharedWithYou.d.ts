import type { NSObjectProtocol } from './Runtime'

import { NativeObject } from './objc-runtime'



export declare const NSPasteboardTypeCollaborationMetadata: string;

export declare interface SWHighlightCenterDelegate extends NSObjectProtocol {
  highlightCenterHighlightsDidChange(highlightCenter: SWHighlightCenter): void;
}

export declare class SWHighlightCenterDelegate extends NativeObject implements SWHighlightCenterDelegate {
}
