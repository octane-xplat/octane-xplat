/** @jsxImportSource @xplat/macos/renderer */
import { useCallback, useState } from 'octane';
import type { AlertDialogProps, ImperativeAlertDialogReturn } from './props';
import { AlertDialog } from './AlertDialog.macos.tsrx';

/** Imperative AlertDialog control (Astryx `useImperativeAlertDialog`).
 *  macOS renders the inline leaf — no overlay service on that target yet. */
export function useImperativeAlertDialog(): ImperativeAlertDialogReturn {
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
