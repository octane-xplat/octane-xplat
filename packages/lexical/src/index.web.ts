export { LexicalEditor, supported } from './LexicalEditor.web.tsrx'
export type * from './types'

/** Web needs no lazy bridge — lexical is in the bundle already. Kept for
 *  call-site parity with the native entry. */
export function ensureJSONBridge(): Promise<boolean> {
	return Promise.resolve(true)
}

export function jsonBridgeReady(): boolean {
	return true
}
