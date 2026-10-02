/** @jsxImportSource @octane-xplat/macos-renderer */
import type { TiptapEditorProps } from './types'
import browser from '../dist/macos/browser.js'
import { NativeEditor } from '@octane-xplat/richtext/macos-host'

/** AppKit mounts the local editor engine in WKWebView. */
export function TiptapEditor(props: TiptapEditorProps) {
	return <NativeEditor {...props} browser={browser} />
}
