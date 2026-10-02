import type { UniversalComponent } from 'octane/universal'
import type { LexicalEditorProps } from '../src/types'
export declare const LexicalEditor: UniversalComponent<LexicalEditorProps>
export declare const supported: boolean
export type * from '../src/types'
export declare function ensureJSONBridge(): Promise<boolean>
export declare function jsonBridgeReady(): boolean
