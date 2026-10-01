import type { UniversalComponent } from 'octane/universal'
import type { TiptapEditorProps, TiptapJSON } from './types'

export declare const TiptapEditor: UniversalComponent<TiptapEditorProps>
export declare const supported: boolean
export declare function ensureJSONBridge(): Promise<boolean>
export declare function jsonBridgeReady(): boolean
export type * from './types'
