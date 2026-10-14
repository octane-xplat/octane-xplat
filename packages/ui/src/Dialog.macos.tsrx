/** @jsxImportSource @octane-xplat/macos-renderer */
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { useContext, useState } from 'octane'
import type { DialogHeaderProps, DialogProps } from './props'
import { cx } from '@octane-xplat/lib'
import { usePresentation } from './presentation.macos.tsrx'
import { Button } from './controls.macos.tsrx'
import { DialogContext, DialogProvider } from './dialog-context'

function DialogPanel(props: DialogProps & { dark?: boolean; layerDepth: number }) @{
	<LayerDepthProvider value={props.layerDepth}>
		<DialogProvider value={{ titleId: '', isModal: !props.isInline, requestClose: props.onOpenChange }}>
		<flexboxlayout flexDirection="column" id={props.id}
			className={cx('vx-dialog', props.variant === 'fullscreen' && 'vx-dialog--fullscreen', props.dark && 'ns-dark', props.className)}
			style={{ padding: (props.padding ?? 5) * 4, ...props.style }}>
			{props.children}
		</flexboxlayout>
		</DialogProvider>
	</LayerDepthProvider>
}

function ScrollingDialogPanel(props: DialogProps & { dark?: boolean; layerDepth: number }) @{
	<scrollview><DialogPanel {...props} /></scrollview>
}

export function Dialog(props: DialogProps) @{
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.isOpen ?? internal
	const requestChange = (isOpen: boolean) => {
		if (props.isOpen === undefined) setInternal(isOpen)
		props.onOpenChange?.(isOpen)
	}

	const dismissal = useLayerDismissal({
		get active() { return !!open && !props.isInline },
		dismiss: () => requestChange(false),
		get behavior() { return props.purpose === 'required' ? 'block' : 'close' },
		getFocusTarget: () => props.finalFocusRef?.current,
		restoreFocus: false,
	})

	const panelProps = { ...props, onOpenChange: requestChange, layerDepth: dismissal.depth }
	const owner = usePresentation(open && !props.isInline, ScrollingDialogPanel, panelProps, {
		kind: 'dialog', modal: true, purpose: props.purpose, width: props.width,
		maxHeight: props.maxHeight, position: props.position,
		fullscreen: props.variant === 'fullscreen', label: props.accessibilityLabel,
		finalFocusRef: props.finalFocusRef,
		canDismiss: () => dismissal.shouldClose(),
		onDismiss: () => requestChange(false),
	})

	<>
		@if (props.isInline && open) { <DialogPanel {...panelProps} layerDepth={dismissal.depth - 1} /> }
		@if (!props.isInline) { <flexboxlayout ref={owner} style={{ width: 0, height: 0 }} /> }
	</>
}

export function DialogHeader(props: DialogHeaderProps) @{
	const ctx = useContext(DialogContext)
	const requestClose = props.onOpenChange ?? ctx?.requestClose

	<flexboxlayout flexDirection="column" className={cx('vx-dialog-header', props.className)} style={props.style}>
		<flexboxlayout flexDirection="row" alignItems="center">
			{props.startContent}
			<flexboxlayout flexDirection="column" flexGrow={1} className="vx-dialog-header-text">
				{props.title != null && <label className="vx-dialog-title">{props.title}</label>}
				{props.subtitle != null && <label className="vx-dialog-subtitle">{props.subtitle}</label>}
			</flexboxlayout>
			{props.endContent}
			{requestClose != null && <Button accessibilityLabel="Close dialog" clickAction={() => requestClose(false)}>×</Button>}
		</flexboxlayout>
	</flexboxlayout>
}
