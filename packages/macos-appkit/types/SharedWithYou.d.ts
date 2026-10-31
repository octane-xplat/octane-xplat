/// <reference types="@nativescript/objc-node-api" />

declare const NSPasteboardTypeCollaborationMetadata: string

declare interface SWHighlightCenterDelegate extends NSObjectProtocol {
	highlightCenterHighlightsDidChange(highlightCenter: SWHighlightCenter): void
}

declare class SWHighlightCenterDelegate extends NativeObject implements SWHighlightCenterDelegate {}
