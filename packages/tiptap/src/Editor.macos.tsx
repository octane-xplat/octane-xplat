/** @jsxImportSource @octane-xplat/jsx */
import type { TiptapEditorProps } from './types'
import browser from '../dist/macos/browser.js'
import { NativeEditor } from '@octane-xplat/richtext/macos-host'

/** AppKit mounts the local editor engine in WKWebView. */
export function TiptapEditor(props: TiptapEditorProps) {
	const { ref, ...rest } = props
	// ref widens past the shared RichTextEditorProps handle — the host just
	// forwards it, so the cast is honest.
	return <NativeEditor {...rest} browser={browser} ref={ref as any} />
}
