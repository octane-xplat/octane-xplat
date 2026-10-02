import type { UniversalComponent } from 'octane/universal'
import type { RichTextEditorProps } from '../src/types'
/** Internal shared editor host. */
export declare const NativeEditor: UniversalComponent<RichTextEditorProps & { browser: string; json?: any; onJSONReady?: (ok: boolean) => void; onJSONChange?: (doc: any) => void }>
