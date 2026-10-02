/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useState } from 'octane';
import type { AlertDialogProps, ImperativeAlertDialogReturn } from './props';
import { AlertDialog } from './AlertDialog';

/** Imperative AlertDialog control (Astryx `useImperativeAlertDialog`).
 *  `show(options)` mounts the confirmation dialog; `element` renders it —
 *  keep it mounted in the tree. User dismissal closes the hook's own
 *  state. */
export function useImperativeAlertDialog(): ImperativeAlertDialogReturn @{
	const [isOpen, setIsOpen] = useState(false);
	const [options, setOptions] = useState<Omit<AlertDialogProps, 'isOpen' | 'onOpenChange'>>({
		title: '',
		actionLabel: '',
		onAction: () => {},
	});

	const show = useCallback((next: Omit<AlertDialogProps, 'isOpen' | 'onOpenChange'>) => {
		setOptions(next);
		setIsOpen(true);
	}, []);

	const hide = useCallback(() => setIsOpen(false), []);

	const element = (
		<AlertDialog
			{...options}
			isOpen={isOpen}
			onOpenChange={(open: boolean) => {
				if (!open) {
					setIsOpen(false);
				}
			}}
		/>
	);

	return { show, hide, isOpen, element };
}
