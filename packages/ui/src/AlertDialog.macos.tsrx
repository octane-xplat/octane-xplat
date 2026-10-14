/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane'
import type { AlertDialogProps } from './props'
import { Dialog } from './Dialog.macos.tsrx'
import { Button } from './controls.macos.tsrx'
import { cx } from '@octane-xplat/lib'

const ACTION_VARIANT_CLASS: Record<string, string> = {
	primary: 'bg-primary text-onprimary',
	secondary: 'btn-secondary',
	ghost: 'btn-ghost',
	destructive: 'bg-danger text-onprimary',
}

/** Required decisions share Dialog presentation and block passive dismissal. */
export function AlertDialog(props: AlertDialogProps) @{
	const [internal, setInternal] = useState(props.defaultOpen ?? false)
	const open = props.isOpen ?? internal
	const requestChange = (isOpen: boolean) => {
		if (props.isOpen === undefined) setInternal(isOpen)
		props.onOpenChange?.(isOpen)
	}

	return (
		<Dialog
			isOpen={open}
			onOpenChange={requestChange}
			purpose="required"
			accessibilityLabel={typeof props.title === 'string' ? props.title : 'Required decision'}
			finalFocusRef={props.finalFocusRef}
			width={props.width ?? 400}
			isInline={props.isInline}
			className={cx('vx-alertdialog', props.className)}
			style={props.style}
			id={props.id}
		>
			<flexboxlayout flexDirection="column" className="vx-alertdialog-title">
				<label className="vx-alertdialog-heading">{props.title}</label>
			</flexboxlayout>
			{props.description != null && (
				<flexboxlayout className="vx-alertdialog-desc">
					{typeof props.description === 'string' ? (
						<label whiteSpace="normal">{props.description}</label>
					) : (
						props.description
					)}
				</flexboxlayout>
			)}
			<flexboxlayout flexDirection="row" justifyContent="flex-end" className="vx-alertdialog-actions">
				<Button
					className="btn btn-secondary"
					clickAction={() => requestChange(false)}
					isDisabled={props.isActionLoading}
				>
					{props.cancelLabel ?? 'Cancel'}
				</Button>
				<Button
					className={cx('btn', ACTION_VARIANT_CLASS[props.actionVariant ?? 'destructive'])}
					clickAction={props.onAction}
					isLoading={props.isActionLoading}
				>
					{props.actionLabel}
				</Button>
			</flexboxlayout>
		</Dialog>
	);
}
