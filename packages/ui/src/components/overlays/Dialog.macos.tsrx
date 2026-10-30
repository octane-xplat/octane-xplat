/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx'
import { useContext, useState } from 'octane'
import type { DialogHeaderProps, DialogProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { usePresentation } from './presentation.macos.tsrx'
import { Button } from '../actions/controls.macos.tsrx'
import { DialogContext, DialogProvider } from './dialog-context'

function DialogPanel(props: DialogProps & { dark?: boolean; layerDepth: number }) @{
	<LayerDepthProvider value={props.layerDepth}>
		<DialogProvider
			value={{ titleId: '', isModal: !props.isInline, requestClose: props.onOpenChange }}
		>
			<masonview
				id={props.id}
				className={cx(
					'vx-dialog',
					props.variant === 'fullscreen' && 'vx-dialog--fullscreen',
					props.dark && 'ns-dark',
					props.className,
				)}
				style={mergeStyle(
					{ flexDirection: 'column' },
					mergeStyle(
						{ display: 'flex' },
						{ padding: (props.padding ?? 5) * 4, ...styleRecord(props.style) },
					),
				)}
			>
				{props.children}
			</masonview>
		</DialogProvider>
	</LayerDepthProvider>
}

function ScrollingDialogPanel(
	props: DialogProps & { dark?: boolean; layerDepth: number },
) @{
	<scrollview>
		<DialogPanel {...props} />
	</scrollview>
}

export function Dialog(props: DialogProps): unknown @{
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.isOpen ?? internal
	const requestChange = (isOpen: boolean) => {
		if (props.isOpen === undefined) {
			setInternal(isOpen)
		}

		props.onOpenChange?.(isOpen)
	}

	const dismissal = useLayerDismissal({
		get active() {
			return !!open && !props.isInline
		},
		dismiss: () => requestChange(false),
		get behavior() {
			return props.purpose === 'required' ? 'block' : 'close'
		},
		getFocusTarget: () => props.finalFocusRef?.current,
		restoreFocus: false,
	})

	const panelProps = { ...props, onOpenChange: requestChange, layerDepth: dismissal.depth }
	const owner = usePresentation(open && !props.isInline, ScrollingDialogPanel, panelProps, {
		kind: 'dialog',
		modal: true,
		purpose: props.purpose,
		width: props.width,
		maxHeight: props.maxHeight,
		position: props.position,
		fullscreen: props.variant === 'fullscreen',
		label: props.accessibilityLabel,
		finalFocusRef: props.finalFocusRef,
		canDismiss: () => dismissal.shouldClose(),
		onDismiss: () => requestChange(false),
	})

	<>
		@if (props.isInline && open) {
			<DialogPanel {...panelProps} layerDepth={dismissal.depth - 1} />
		}
		@if (!props.isInline) {
			<>{owner}</>
		}
	</>
}

export function DialogHeader(props: DialogHeaderProps): unknown @{
	const ctx = useContext(DialogContext)
	const requestClose = props.onOpenChange ?? ctx?.requestClose

	<masonview
		className={cx('vx-dialog-header', props.className)}
		style={mergeStyle({ flexDirection: 'column' }, mergeStyle({ display: 'flex' }, props.style))}
	>
		<masonview
			style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
		>
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
