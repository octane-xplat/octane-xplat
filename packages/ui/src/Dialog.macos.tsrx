/** @jsxImportSource @octane-xplat/macos-renderer */
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import type { DialogHeaderProps, DialogProps } from './props'
import { cx } from './cx'
import { usePresentation } from './presentation.macos.tsrx'
import { Button } from './controls.macos.tsrx'

function DialogPanel(props: DialogProps & { dark?: boolean; layerDepth: number }) @{
	<LayerDepthProvider value={props.layerDepth}>
		<flexboxlayout flexDirection="column" id={props.id}
			className={cx('vx-dialog', props.variant === 'fullscreen' && 'vx-dialog--fullscreen', props.dark && 'ns-dark', props.className)}
			style={{ padding: (props.padding ?? 5) * 4, ...props.style }}>
			{props.children}
		</flexboxlayout>
	</LayerDepthProvider>
}

function ScrollingDialogPanel(props: DialogProps & { dark?: boolean; layerDepth: number }) @{
	<scrollview><DialogPanel {...props} /></scrollview>
}

export function Dialog(props: DialogProps) @{
	const dismissal = useLayerDismissal({
		get active() { return !!props.isOpen && !props.isInline },
		dismiss: () => props.onOpenChange?.(false),
		get behavior() { return props.purpose === 'required' ? 'block' : 'close' },
		getFocusTarget: () => props.finalFocusRef?.current,
		restoreFocus: false,
	})

	const panelProps = { ...props, layerDepth: dismissal.depth }
	const owner = usePresentation(props.isOpen && !props.isInline, ScrollingDialogPanel, panelProps, {
		kind: 'dialog', modal: true, purpose: props.purpose, width: props.width,
		maxHeight: props.maxHeight, position: props.position,
		fullscreen: props.variant === 'fullscreen', label: props.accessibilityLabel,
		finalFocusRef: props.finalFocusRef,
		canDismiss: () => dismissal.shouldClose(),
		onDismiss: () => props.onOpenChange(false),
	})

	<>
		@if (props.isInline && props.isOpen) { <DialogPanel {...panelProps} layerDepth={dismissal.depth - 1} /> }
		@if (!props.isInline) { <flexboxlayout ref={owner} style={{ width: 0, height: 0 }} /> }
	</>
}

export function DialogHeader(props: DialogHeaderProps) @{
	<flexboxlayout flexDirection="column" className={cx('vx-dialog-header', props.className)} style={props.style}>
		<flexboxlayout flexDirection="row" alignItems="center">
			{props.startContent}
			<flexboxlayout flexDirection="column" flexGrow={1} className="vx-dialog-header-text">
				{props.title != null && <label className="vx-dialog-title">{props.title}</label>}
				{props.subtitle != null && <label className="vx-dialog-subtitle">{props.subtitle}</label>}
			</flexboxlayout>
			{props.endContent}
			{props.onOpenChange != null && <Button accessibilityLabel="Close dialog" onPress={() => props.onOpenChange?.(false)}>×</Button>}
		</flexboxlayout>
	</flexboxlayout>
}
