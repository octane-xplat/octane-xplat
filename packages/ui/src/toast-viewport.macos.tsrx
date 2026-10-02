/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect, useId, useMemo } from 'octane'
import type { ToastEntry, ToastPosition, ToastViewportProps } from './props'
import { ToastViewportProvider, type ToastViewportContextValue } from './toast-context'
import { dismissToast, registerToastViewport, toastOnViewport, toastStore } from './toast-store'
import { useStore } from './useStore.macos.tsrx'
import { usePresentation } from './presentation.macos.tsrx'
import { Toast } from './Toast.macos.tsrx'
import { Popover } from './Popover.macos.tsrx'
import { cx } from './cx'

const POSITIONS: ToastPosition[] = ['topStart', 'topEnd', 'bottomStart', 'bottomEnd']

function ToastCard(props: { entry: ToastEntry }) @{
	<Toast {...props.entry.options} isExiting={props.entry.exiting}
		onDismiss={(reason) => dismissToast(props.entry.id, reason)} />
}

function ToastStack(props: { entries: ToastEntry[]; dark?: boolean; className?: any; style?: any }) @{
	<flexboxlayout flexDirection="column" className={cx('vx-toast-viewport', props.dark && 'ns-dark', props.className)} style={props.style}>
		{props.entries.map(entry => <ToastCard key={entry.id} entry={entry} />)}
	</flexboxlayout>
}

function ToastGroup(props: { entries: ToastEntry[]; position: ToastPosition; inset?: ToastViewportProps['inset']; className?: any; style?: any }) @{
	const owner = usePresentation(props.entries.length > 0, ToastStack, props, {
		kind: 'toast', modal: false, position: props.position, inset: props.inset,
		width: 360, maxHeight: '92%', label: 'Notifications',
		onDismiss: () => { for (const entry of props.entries) dismissToast(entry.id, 'manual') },
	})

	<flexboxlayout ref={owner} style={{ width: 0, height: 0 }} />
}

export function ToastViewportSurface(props: ToastViewportProps & { viewportId: string }) @{
	const entries = useStore(toastStore)
	const mine = entries.filter(entry => toastOnViewport(entry, props.viewportId))
	const max = Math.max(1, props.maxVisible ?? 5)
	useEffect(() => {
		const live = mine.filter(entry => !entry.exiting)
		for (const entry of live.slice(0, Math.max(0, live.length - max))) dismissToast(entry.id, 'manual')
	}, [entries, max, props.viewportId])

	<>
		{POSITIONS.map(position => <ToastGroup key={position} position={position} inset={props.inset}
			className={props.className} style={props.style}
			entries={mine.filter(entry => !entry.options.anchor && (entry.options.position ?? props.position ?? 'bottomEnd') === position)} />)}
		{mine.filter(entry => entry.options.anchor).map(entry => (
			<Popover key={entry.id} open={!entry.exiting} anchor={entry.options.anchor!}
				placement={entry.options.placement ?? ((entry.options.position ?? props.position ?? 'bottomEnd').startsWith('top') ? 'top' : 'bottom')}
				dismissOnOutsideTap={false} onDismiss={() => dismissToast(entry.id, 'manual')}>
				<ToastCard entry={entry} />
			</Popover>
		))}
	</>
}

export function ToastViewport(props: ToastViewportProps) @{
	const id = useId()
	const ctx = useMemo<ToastViewportContextValue>(
		() => ({ id, position: props.position ?? 'bottomEnd', maxVisible: props.maxVisible ?? 5 }),
		[id, props.position, props.maxVisible],
	)

	useEffect(() => {
		const unregister = registerToastViewport(id)
		return () => {
			unregister()
			// Notify the fallback root after changing the routing registry.
			toastStore.set([...toastStore.get()])
		}
	}, [id])

	<ToastViewportProvider value={ctx}>
		{props.children}
		<ToastViewportSurface {...props} viewportId={id} />
	</ToastViewportProvider>
}
