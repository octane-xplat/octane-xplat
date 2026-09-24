import { createRoot } from 'octane';
import type { ModalOpenOptions, ModalOpenResult, OpenModal } from './props';

/** Open a component in a document-level dialog and resolve with close(value). */
export const openModal: OpenModal = (Component, params, options = {}) =>
	new Promise<ModalOpenResult>((resolve) => {
		const dialog = document.createElement('dialog');
		dialog.className = options.presentation === 'sheet'
			? 'vx-modal vx-modal--sheet'
			: options.presentation === 'dialog'
				? 'vx-modal vx-modal--dialog'
				: options.presentation === 'fullscreen' || (!options.presentation && options.fullscreen)
					? 'vx-modal vx-modal--fullscreen'
					: 'vx-modal';

		document.body.appendChild(dialog);
		const root = createRoot(dialog);
		let finished = false;
		const finish = (result?: ModalOpenResult) => {
			if (finished) return;
			finished = true;
			root.unmount();
			dialog.remove();
			resolve(result);
		};

		const close = (result?: ModalOpenResult) => {
			if (finished) return;
			if (dialog.open) dialog.close();
			finish(result);
		};

		dialog.addEventListener('close', () => finish());
		dialog.addEventListener('cancel', () => finish());
		root.render(Component, { params, close });
		dialog.showModal();
	});

export type { ModalOpenOptions };
