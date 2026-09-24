import { createElement, useEffect, useRef } from 'octane';
import type { ModalProps } from "./props";

/** Modal — <dialog> driven by showModal()/close(). Renders in place; the
 *  browser puts it in the top layer above everything. */
export function Modal(props: ModalProps) @{
	const el = useRef<HTMLDialogElement | null>(null);
	const content = props.component
		? createElement(props.component, props.params ?? {})
		: props.children;

	const presentation = props.presentation;
	const className = presentation === 'sheet'
		? 'vx-modal vx-modal--sheet'
		: presentation === 'dialog'
			? 'vx-modal vx-modal--dialog'
			: presentation === 'fullscreen' || (!presentation && props.fullscreen)
				? 'vx-modal vx-modal--fullscreen'
				: 'vx-modal';

	useEffect(() => {
		const d = el.current;
		if (!d) return;
		if (props.open && !d.open) d.showModal();
		else if (!props.open && d.open) d.close();
	}, [props.open]);

	<dialog ref={el} onClose={() => props.onClose?.()} className={className}>
		{content}
	</dialog>
}
