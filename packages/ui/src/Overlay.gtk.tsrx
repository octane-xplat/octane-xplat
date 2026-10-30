/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useEffect, useRef, useState } from 'octane'
import { createPortal } from './native-portal'
import { SizeProvider } from './size-context'
import type { OverlayProps } from './props'
import { cx } from '@octane-xplat/lib'

/** Renders children in a portal on the root's `Gtk.Overlay` layer — the
 *  in-window surface above the root content (matching the native
 *  `RootLayout` / macOS `presentSurface` hosting model). */
export function Overlay(props: OverlayProps) @{
	const hostView = useRef<any>(null)
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.open ?? internal
	const [layer, setLayer] = useState<any>(null)
	const requestDismiss = () => {
		if (props.open === undefined) { setInternal(false) }
		props.onDismiss?.()
	}
	const dismiss = useRef(requestDismiss)
	dismiss.current = requestDismiss
	const modal = !!(props.shadeCover || props.isModal)

	useEffect(() => {
		const view = hostView.current
		if (!view || !open) { return }
		const l = view.createOverlayLayer({
			modal,
			scrim: !!props.shadeCover,
			onScrimPress: props.shadeCover ? () => dismiss.current() : undefined,
		})
		setLayer(l)
		l.setVisible(true)
		return () => l.dispose()
	}, [open, modal, props.shadeCover])

	<>
		<masonview
			ref={(v: any) => { hostView.current = v }}
			style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, { width: 0, height: 0 }))}
		/>
		{open && layer
			? createPortal(
					<>
						<SizeProvider value={null}>{props.children}</SizeProvider>
					</>,
					layer.target,
				)
			: null}
	</>
}
