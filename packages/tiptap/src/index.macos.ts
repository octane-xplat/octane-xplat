export { TiptapEditor } from './Editor.macos'
/** The AppKit/WKWebView backend is implemented. */
export const supported = true
export type * from './types'

/** The local bundle includes its JSON model; wait for onReady before reading a document. */
export async function ensureJSONBridge(): Promise<boolean> { return true }
export function jsonBridgeReady(): boolean { return true }
