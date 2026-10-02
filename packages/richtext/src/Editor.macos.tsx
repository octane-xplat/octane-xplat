/** @jsxImportSource @octane-xplat/macos-renderer */
import type { RichTextEditorProps } from './types'
import browser from '../dist/macos/browser.js'
import { NativeEditor } from './NativeEditor.macos'

/** AppKit mounts the local editor engine in WKWebView. */
export function RichTextEditor(props: RichTextEditorProps) {
	return <NativeEditor {...props} browser={browser} />
}
