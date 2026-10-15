import type { TiptapEditorProps, TiptapJSON } from './types'

export declare function TiptapEditor(props: TiptapEditorProps): unknown
export declare const supported: boolean
export declare function ensureJSONBridge(): Promise<boolean>
export declare function jsonBridgeReady(): boolean
export type * from './types'
