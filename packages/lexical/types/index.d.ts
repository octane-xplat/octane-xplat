import type { UniversalComponent } from 'octane/universal'
import type { LexicalEditorProps, LexicalJSON } from '../src/types'

export declare const LexicalEditor: UniversalComponent<LexicalEditorProps>
export declare const supported: boolean
export declare function ensureJSONBridge(): Promise<boolean>
export declare function jsonBridgeReady(): boolean
export type * from '../src/types'
