/** @jsxImportSource @octane-xplat/macos-renderer */
import { useEffect } from 'octane';
import type { CanvasContextKind, CanvasProps } from './props';

/** AppKit mounts a neutral frame. No drawing surface or GPU is created. */
export function Canvas(props: CanvasProps) @{
	useEffect(() => {
		// Preserve deferred acquisition without pretending this is a native view.
		const canvas = Object.freeze({
			getContext: (_kind: CanvasContextKind, _options?: any): null => null,
		});

		props.onReady?.({ canvas, context: null });
	}, []);

	<gridlayout
		id={props.id}
		className={props.className}
		style={props.style}
		width={props.width}
		height={props.height}
	/>;
}
