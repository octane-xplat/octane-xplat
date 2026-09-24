import { Frame, GridLayout } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { ModalOpenOptions, ModalOpenResult, OpenModal } from './props';

/** Open a component in its own NativeScript modal root and resolve on close. */
export const openModal: OpenModal = (Component, params, options = {}) =>
	new Promise<ModalOpenResult>((resolve, reject) => {
		const presenter = (Frame.topmost()?.currentPage ?? Frame.topmost()) as any;
		if (!presenter) {
			reject(new Error('Cannot open modal before a NativeScript page is active'));
			return;
		}

		const host = new GridLayout();
		const root = createNativeScriptRoot(host) as any;
		let finished = false;
		const finish = (result?: ModalOpenResult) => {
			if (finished) return;
			finished = true;
			root.unmount?.();
			host.removeChildren?.();
			resolve(result);
		};

		const close = (result?: ModalOpenResult) => host.closeModal(result);
		root.render(Component as UniversalComponent, { params, close });

		const fullscreen = options.presentation
			? options.presentation === 'fullscreen'
			: options.fullscreen ?? true;

		// showModal takes (viewToShow, options). On iOS fullscreen=false is a
		// form sheet; on Android it is a centered dialog sized to its content.
		presenter.showModal(host, {
			context: {},
			closeCallback: finish,
			fullscreen,
			animated: options.animated ?? true,
		});
	});

export type { ModalOpenOptions };
