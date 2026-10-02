import type { AlertDialogProps } from './props';
import { Dialog } from './Dialog.web.tsrx';
import { Button } from './Button.web.tsrx';
import { Text } from './Text.web.tsrx';
import { cx } from './cx';

const ACTION_VARIANT_CLASS: Record<string, string> = {
	primary: 'bg-primary text-onprimary',
	secondary: 'btn-secondary',
	ghost: 'btn-ghost',
	destructive: 'bg-danger text-onprimary',
};

/** Confirmation dialog (Astryx `AlertDialog`) — a `required`-purpose
 *  dialog (backdrop and Escape stay closed; web renders
 *  `role="alertdialog"`) with title, description, Cancel, and one action
 *  button. The action reports through `onAction`; callers own `isOpen`. */
export function AlertDialog(props: AlertDialogProps) @{
	return (
		<Dialog
			isOpen={props.isOpen}
			onOpenChange={props.onOpenChange}
			purpose="required"
			width={props.width ?? 400}
			isInline={props.isInline}
			finalFocusRef={props.finalFocusRef}
			accessibilityLabel={typeof props.title === 'string' ? props.title : undefined}
			className={cx('vx-alertdialog', props.className)}
			style={props.style}
			id={props.id}
			web={props.web}
		>
			<div className="vx-alertdialog-title" data-vx-dialog-title="" tabIndex={-1}>
				{typeof props.title === 'string' ? <h2 className="vx-alertdialog-heading">{props.title}</h2> : props.title}
			</div>
			{props.description != null && (
				<div className="vx-alertdialog-desc">
					{typeof props.description === 'string' ? (
						<Text>{props.description}</Text>
					) : (
						props.description
					)}
				</div>
			)}
			<div className="vx-alertdialog-actions">
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
			</div>
		</Dialog>
	);
}
