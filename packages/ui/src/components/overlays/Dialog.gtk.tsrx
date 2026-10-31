/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useContext, useEffect, useId, useRef, useState } from 'octane'
import { createPortal } from '../../internal/platform/native-portal'
import { SizeProvider } from '../layout/size-context'
import type { DialogHeaderProps, DialogProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { useLayerDismissal } from './layer-dismissal.tsrx'
import { DialogContext, DialogProvider } from './dialog-context'
import { Button } from '../actions/Button'

/** The modal body rendered in the overlay layer — a centered panel above
 *  the root content on the same window. `purpose` gates the scrim tap. */
function DialogBody(props: DialogProps & { titleId: string }) @{
	const purpose = props.purpose ?? 'info'

	<masonview
		className={cx('vx-dialog-host', props.className)}
		style={mergeStyle(
			{
				display: 'flex',
				flexDirection: 'column',
				padding: props.padding,
				width: typeof props.width === 'number' ? props.width : undefined,
			},
			styleRecord(props.style),
		)}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={purpose === 'required' ? 'alert' : undefined}
	>
		<DialogProvider value={{ titleId: props.titleId, isModal: false, requestClose: props.onOpenChange }}>
			{props.children}
		</DialogProvider>
	</masonview>
}

export function DialogHeader(props: DialogHeaderProps): unknown @{
	const ctx = useContext(DialogContext)
	const requestClose = props.onOpenChange ?? ctx?.requestClose

	<masonview
		className={cx('vx-dialog-header', props.className)}
		style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
	>
		<masonview style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}>
			{props.startContent}
			<masonview
				className="vx-dialog-header-text"
				style={mergeStyle({ flexDirection: 'column', flexGrow: 1 }, { display: 'flex' })}
			>
				{props.title != null && <label className="vx-dialog-title">{props.title}</label>}
				{props.subtitle != null && <label className="vx-dialog-subtitle">{props.subtitle}</label>}
			</masonview>
			{props.endContent}
			{requestClose != null && (
				<Button accessibilityLabel="Close dialog" clickAction={() => requestClose(false)}>
					×
				</Button>
			)}
		</masonview>
	</masonview>
}

/** Modal dialog (Astryx `Dialog`), GTK leaf — a `createOverlayLayer` surface
 *  on the root's `Gtk.Overlay` (the in-window RootLayout equivalent), with
 *  content portaled from the declaring root. `purpose` maps to scrim
 *  dismiss; `finalFocusRef` returns focus on close. */
export function Dialog(props: DialogProps): unknown @{
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.isOpen ?? internal
	const titleId = useId()
	const requestChange = (isOpen: boolean) => {
		if (props.isOpen === undefined) { setInternal(isOpen) }
		props.onOpenChange?.(isOpen)
	}

	const sentinel = useRef<any>(null)
	const shown = useRef<any>(null)
	const [layer, setLayer] = useState<any>(null)
	const dismiss = useRef(requestChange)
	dismiss.current = requestChange

	useLayerDismissal({
		get active() { return !!open && !props.isInline },
		isPresent: () => !!shown.current,
		dismiss: () => requestChange(false),
		get behavior() { return props.purpose === 'required' ? 'block' : 'close' },
		getFocusTarget: () => props.finalFocusRef?.current,
		getHost: () => sentinel.current,
	})

	useEffect(() => {
		const view = sentinel.current
		if (!view || !open || props.isInline) { return }
		const l = view.createOverlayLayer({
			modal: true,
			scrim: true,
			onScrimPress: props.purpose === 'required' ? undefined : () => dismiss.current(false),
		})
		shown.current = l
		setLayer(l)
		l.setVisible(true)
		return () => { l.dispose(); shown.current = null }
	}, [open, props.isInline])

	<>
		<masonview
			ref={(v: any) => { sentinel.current = v }}
			style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, { width: 0, height: 0 }))}
		/>
		{props.isInline
			? <DialogBody {...props} titleId={titleId} />
			: open && layer
			? createPortal(
					<SizeProvider value={null}>
						<DialogBody {...props} titleId={titleId} />
					</SizeProvider>,
					layer.target,
				)
			: null}
	</>
}
