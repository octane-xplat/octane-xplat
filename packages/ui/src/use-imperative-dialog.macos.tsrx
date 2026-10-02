/** @jsxImportSource @octane-xplat/macos-renderer */
import { useCallback, useState } from 'octane';
import type { DialogOptions, ImperativeDialogReturn } from './props';
import { Dialog } from './Dialog.macos.tsrx';

export function useImperativeDialog(): ImperativeDialogReturn @{
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
