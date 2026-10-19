/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
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
		<masonview
			id={props.id}
			className={props.className}
			style={mergeStyle(
				{
					flexGrow: props.flexGrow,
					flexShrink: props.flexShrink,
					alignSelf: props.alignSelf,
					order: props.order,
					gridRow:
						props.row == null
							? undefined
							: `${Number(props.row) + 1}${Number(props.rowSpan) > 1 ? ` / span ${Number(props.rowSpan)}` : ''}`,
					gridColumn:
						props.col == null
							? undefined
							: `${Number(props.col) + 1}${Number(props.colSpan) > 1 ? ` / span ${Number(props.colSpan)}` : ''}`,
					...(props.dock === 'left' || props.dock === 'top' || props.dock === 'bottom'
						? { left: 0 }
						: {}),
					...(props.dock === 'right' || props.dock === 'top' || props.dock === 'bottom'
						? { right: 0 }
						: {}),
					...(props.dock === 'top' || props.dock === 'left' || props.dock === 'right'
						? { top: 0 }
						: {}),
					...(props.dock === 'bottom' || props.dock === 'left' || props.dock === 'right'
						? { bottom: 0 }
						: {}),
					left: props.left,
					top: props.top,
					...(props.dock !== undefined || props.left !== undefined || props.top !== undefined
						? { position: 'absolute' }
						: {}),
				},
				{ display: 'flex', ...props.style },
			)}
			ref={attach}
		/>
	)
}
