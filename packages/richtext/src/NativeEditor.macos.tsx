/** @jsxImportSource @octane-xplat/macos-renderer */
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'octane'
import type { RichTextEditorProps } from './types'
import { createEditorSession } from './host-session.macos'

declare const XplatEditorHost: { alloc(): { init(): any } }

type HostProps = RichTextEditorProps & {
	browser: string
	json?: any
	onJSONReady?: (ready: boolean) => void
	onJSONChange?: (doc: any) => void
}

/** Internal shared AppKit/WKWebView surface, owned by the editor leaf. */
export function NativeEditor(props: HostProps) {
	const latest = useRef(props)
	latest.current = props
	const session = useRef<ReturnType<typeof createEditorSession> | null>(null)
	const [handle, setHandle] = useState<any>(null)
	useImperativeHandle(props.ref, () => handle, [handle])
	const attach = useCallback((parent: any) => {
		session.current?.dispose()
		session.current = null
		if (!parent) {
			setHandle(null)
			return
		}

		const native = XplatEditorHost.alloc().init()
		const next = createEditorSession(
			(packet) => native.deliver(packet),
			native,
			() => latest.current,
		)

		session.current = next
		native.installDispatcher((packet: string) => next.receive(packet))
		native.attachTo(parent)
		native.load(props.browser)
		setHandle(next.handle)
	}, [])

	useEffect(() => {
		session.current?.update({
			value: props.value,
			json: props.json,
			placeholder: props.placeholder,
			editable: props.editable,
			autofocus: props.autofocus,
		})
	}, [handle, props.value, props.json, props.placeholder, props.editable, props.autofocus])

	useEffect(
		() => () => {
			session.current?.dispose()
			session.current = null
		},
		[],
	)

	return (
		<flexboxlayout
			id={props.id}
			className={props.className}
			style={props.style}
			row={props.row}
			col={props.col}
			rowSpan={props.rowSpan}
			colSpan={props.colSpan}
			dock={props.dock}
			left={props.left}
			top={props.top}
			flexGrow={props.flexGrow}
			flexShrink={props.flexShrink}
			alignSelf={props.alignSelf}
			order={props.order}
			ref={attach}
		/>
	)
}
