/** @jsxImportSource @octane-xplat/macos-renderer */
import { useState } from 'octane'
import type { LightboxProps } from './props'
import { cx } from './cx'

/** macOS coverage: renders the current media + chrome inline while open —
 *  the AppKit target has no shared full-screen layer service yet.
 *  Keyboard navigation/focus trap are web-only; swipe is N/A. */
export function Lightbox(props: LightboxProps) @{
	const [internal, setInternal] = useState(props.defaultIndex ?? 0);
	const count = props.media.length;
	const index = Math.min(Math.max(props.index ?? internal, 0), Math.max(0, count - 1));
	const item = props.media[index];
	const setIndex = (i: number) => {
		const clamped = Math.min(Math.max(i, 0), Math.max(0, count - 1));
		if (props.index == null) {
			setInternal(clamped);
		}

		if (clamped !== index) {
			props.onIndexChange?.(clamped);
		}
	};

	@if (props.isOpen && item != null) {
		<flexboxlayout
			flexDirection="column"
			className={cx('vx-lightbox', props.className)}
			style={props.style}
		>
			{props.media[index].type === 'video' ? (
				<label className="vx-lightbox-caption">{item.alt}</label>
			) : (
				<image src={item.src} className="vx-lightbox-media" />
			)}
			{count > 1 && (
				<flexboxlayout flexDirection="row" alignItems="center">
					<flexboxlayout onTap={() => setIndex(Math.max(index - 1, 0))} className="vx-lightbox-nav" />
					<label className="vx-lightbox-counter">{`${index + 1} of ${count}`}</label>
					<flexboxlayout onTap={() => setIndex(Math.min(index + 1, count - 1))} className="vx-lightbox-nav" />
				</flexboxlayout>
			)}
			<flexboxlayout onTap={() => props.onOpenChange(false)} className="vx-lightbox-close" />
		</flexboxlayout>
	}
}
