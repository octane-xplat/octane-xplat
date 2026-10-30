/** @jsxImportSource @octane-xplat/jsx */
import type { RichTextEditorProps } from './types'
import browser from '../dist/macos/browser.js'
import { NativeEditor } from './NativeEditor.macos'

/** AppKit mounts the local editor engine in WKWebView. */
export function RichTextEditor(props: RichTextEditorProps): unknown {
	return <NativeEditor {...props} browser={browser} />
}
