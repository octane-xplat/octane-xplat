import { useEffect, useRef } from 'octane';

/** Modal — <dialog> driven by showModal()/close(). Renders in place; the
 *  browser puts it in the top layer above everything. */
export function Modal(props: {
	open?: boolean;
	onClose?: () => void;
	fullscreen?: boolean;
	children?: any;
}) @{
	const el = useRef<HTMLDialogElement | null>(null);

	useEffect(() => {
		const d = el.current;
		if (!d) return;
		if (props.open && !d.open) d.showModal();
		else if (!props.open && d.open) d.close();
	}, [props.open]);

	<dialog ref={el} onClose={props.onClose} className="vx-modal">
		{props.children}
	</dialog>
}
