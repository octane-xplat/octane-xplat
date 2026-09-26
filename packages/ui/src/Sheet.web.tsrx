import { createPortal, useEffect, useRef } from 'octane';
import type { SheetProps } from './props';
import { cx } from './cx';
import { useThemeScheme } from './theme/theme-scheme';
import { normalizeDetents } from './sheet-snap';
import { attachSheetDetents } from './sheet-detents.web';

/** In-window bottom sheet — portal layer with a backdrop and a bottom-
 *  anchored panel. Same vocabulary as the native RootLayout sheet.
 *  `detents` adds a self-drawn grabber + drag-to-snap via
 *  sheet-detents.web; the drag-dismiss path reports through `onDismiss`
 *  like a shade tap. */
export function Sheet(props: SheetProps) @{
	const dark = useThemeScheme() === 'dark';
	const panel = useRef<HTMLElement | null>(null);
	const dismiss = useRef(props.onDismiss);
	dismiss.current = props.onDismiss;

	const detents = normalizeDetents(props.detents);
	const maxDetent = detents.length ? detents[detents.length - 1] : 0;
	// Inline arrays re-identify every render — dep on the normalized value.
	const detentsKey = detents.join(',');

	useEffect(() => {
		const el = panel.current;
		if (!props.open || !el || !detents.length) return;

		const ctl = attachSheetDetents(el, detents, () => dismiss.current?.());
		return () => ctl.detach();
	}, [props.open, detentsKey]);

	@if (props.open) {
		<>{createPortal(
			<div className={cx('vx-sheet-layer', dark && 'dark')}>
				{(props.shadeCover ?? true) && <div className="vx-sheet-backdrop" onClick={props.onDismiss} />}
				<div
					ref={(el: any) => { panel.current = el; }}
					className={cx('vx-sheet', detents.length && 'vx-sheet-detents', props.className)}
					style={{
						...props.style,
						...(detents.length
							// Size to the largest detent up front; the controller
							// parks translateY per detent. transform hides the panel
							// below the edge until attach slides it in.
							? { height: `${maxDetent * 100}%`, transform: 'translateY(100%)' }
							: {}),
					}}
					{...props.web}
				>
					{props.children}
				</div>
			</div>,
			document.body,
		)}</>
	}
}
