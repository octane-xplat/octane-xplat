import { useCallback, useState } from 'octane';
import type { DialogOptions, ImperativeDialogReturn } from './props';
import { Dialog } from './Dialog.web.tsrx';

/** Imperative dialog control (Astryx `useImperativeDialog`). `show()`
 *  mounts the dialog with arbitrary content; `element` renders it — keep
 *  it mounted in the tree. The hook owns open state; user dismissal is
 *  reported back as `isOpen: false` (the hook closes itself). */
export function useImperativeDialog(): ImperativeDialogReturn {
	const [isOpen, setIsOpen] = useState(false);
	const [content, setContent] = useState<any>(null);
	const [options, setOptions] = useState<DialogOptions>({});

	const show = useCallback((children: any, next: DialogOptions = {}) => {
		setContent(children);
		setOptions(next);
		setIsOpen(true);
	}, []);

	const hide = useCallback(() => setIsOpen(false), []);

	const element = (
		<Dialog
			{...options}
			isOpen={isOpen}
			onOpenChange={(open: boolean) => {
				if (!open) {
					setIsOpen(false);
				}
			}}
		>
			{content}
		</Dialog>
	);

	return { show, hide, isOpen, element };
}
