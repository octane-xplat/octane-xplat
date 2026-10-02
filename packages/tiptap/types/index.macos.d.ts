import type { UniversalComponent } from 'octane/universal'
import type { TiptapEditorProps } from '../src/types'
export declare const TiptapEditor: UniversalComponent<TiptapEditorProps>
export declare const supported: boolean
export type * from '../src/types'
export declare function ensureJSONBridge(): Promise<boolean>
export declare function jsonBridgeReady(): boolean
