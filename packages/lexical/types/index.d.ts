import type { LexicalEditorProps, LexicalJSON } from './types.js'

export declare function LexicalEditor(props: LexicalEditorProps): unknown
export declare const supported: boolean
export declare function ensureJSONBridge(): Promise<boolean>
export declare function jsonBridgeReady(): boolean
export type * from './types.js'
