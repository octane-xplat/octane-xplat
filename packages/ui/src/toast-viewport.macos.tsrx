/** @jsxImportSource @xplat/macos/renderer */
import { useId, useMemo } from 'octane'
import type { ToastViewportProps } from './props'
import { ToastViewportProvider, type ToastViewportContextValue } from './toast-context'

/** ToastViewport, macOS leaf — provides routing context but mounts no
 *  stack surface: the AppKit target has no toast layer service yet
 *  (`showToast` warns; documented gap). */
export function ToastViewport(props: ToastViewportProps) @{
	const id = useId()
	const ctx = useMemo<ToastViewportContextValue>(
		() => ({ id, position: props.position ?? 'bottomEnd', maxVisible: props.maxVisible ?? 5 }),
		[id, props.position, props.maxVisible],
	)

	<ToastViewportProvider value={ctx}>{props.children}</ToastViewportProvider>
}
