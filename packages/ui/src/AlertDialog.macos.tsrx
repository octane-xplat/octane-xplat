/** @jsxImportSource @xplat/macos/renderer */
import type { AlertDialogProps } from './props'
import { Dialog } from './Dialog.macos.tsrx'
import { Button } from './controls.macos.tsrx'
import { cx } from './cx'

const ACTION_VARIANT_CLASS: Record<string, string> = {
	primary: 'bg-primary text-onprimary',
	secondary: 'btn-secondary',
	ghost: 'btn-ghost',
	destructive: 'bg-danger text-onprimary',
}

/** macOS leaf — inline coverage only (the AppKit target has no in-window
 *  modal layer service yet). */
export function AlertDialog(props: AlertDialogProps) @{
	return (
		<Dialog
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
			purpose="required"
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
						<label textWrap={true}>{props.description}</label>
					) : (
						props.description
					)}
				</flexboxlayout>
			)}
			<flexboxlayout flexDirection="row" justifyContent="flex-end" className="vx-alertdialog-actions">
				<Button
					className="btn btn-secondary"
					onPress={() => props.onOpenChange(false)}
					disabled={props.isActionLoading}
				>
					{props.cancelLabel ?? 'Cancel'}
				</Button>
				<Button
					className={cx('btn', ACTION_VARIANT_CLASS[props.actionVariant ?? 'destructive'])}
					onPress={props.onAction}
					loading={props.isActionLoading}
				>
					{props.actionLabel}
				</Button>
			</flexboxlayout>
		</Dialog>
	);
}
