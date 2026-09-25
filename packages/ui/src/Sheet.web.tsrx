import { createPortal } from 'octane';
import type { SheetProps } from './props';
import { cx } from './cx';
import { useThemeScheme } from './theme/theme-scheme';

/** In-window bottom sheet — portal layer with a backdrop and a bottom-
 *  anchored panel. Same vocabulary as the native RootLayout sheet. */
export function Sheet(props: SheetProps) @{
	const dark = useThemeScheme() === 'dark';

	@if (props.open) {
		<>{createPortal(
			<div className={cx('vx-sheet-layer', dark && 'dark')}>
				{(props.shadeCover ?? true) && <div className="vx-sheet-backdrop" onClick={props.onDismiss} />}
				<div className={cx('vx-sheet', props.className)} style={{ ...props.style }} {...props.web}>
					{props.children}
				</div>
			</div>,
			document.body,
		)}</>
	}
}
