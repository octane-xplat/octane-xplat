/** @jsxImportSource @nativescript-community/octane */
import type { AlertDialogProps } from './props';
import { Dialog } from './Dialog.tsrx';
import { Button } from './Button.tsrx';
import { Text } from './Text.tsrx';
import { cx } from './cx';

const ACTION_VARIANT_CLASS: Record<string, string> = {
	primary: 'bg-primary text-onprimary',
	secondary: 'btn-secondary',
	ghost: 'btn-ghost',
	destructive: 'bg-danger text-onprimary',
};

/** Confirmation dialog (Astryx `AlertDialog`), native leaf — a
 *  `required`-purpose Dialog with title, description, Cancel, and one
 *  action button. */
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
			ios={props.ios}
			android={props.android}
		>
			<flexboxlayout flexDirection="column" className="vx-alertdialog-title">
				{typeof props.title === 'string' ? (
					<label className="vx-alertdialog-heading" textWrap={true}>{props.title}</label>
				) : (
					props.title
				)}
			</flexboxlayout>
			{props.description != null && (
				<flexboxlayout className="vx-alertdialog-desc">
					{typeof props.description === 'string' ? (
						<Text>{props.description}</Text>
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
