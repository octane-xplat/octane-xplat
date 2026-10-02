/** @jsxImportSource @octane-xplat/macos-renderer */
import type { LexicalEditorProps } from './types'
import browser from '../dist/macos/browser.js'
import { NativeEditor } from '@octane-xplat/richtext/macos-host'

/** AppKit mounts the local editor engine in WKWebView. */
export function LexicalEditor(props: LexicalEditorProps) {
	return <NativeEditor {...props} browser={browser} />
}
