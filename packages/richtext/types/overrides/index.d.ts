import type { RichTextEditorProps } from './types.js'

/** Native rich-text editor — Aztec-backed on iOS/Android, AppKit-hosted on
 *  macOS. Web routes through `@octane-xplat/tiptap` instead. */
export declare function RichTextEditor(props: RichTextEditorProps): unknown
/** Whether this leaf has a working editor backend — false on web and Windows. */
export declare const supported: boolean
export type * from './types.js'
