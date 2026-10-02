/** @jsxImportSource @octane-xplat/macos-renderer */
import { useCallback, useState } from 'octane';
import type {
	ScrollableAreaState,
	UseScrollableAreaOptions,
	UseScrollableAreaResult,
} from './props';

const EPS = 1;
const AT_EDGES = { isScrollable: false, atStart: true, atEnd: true };
const INITIAL: ScrollableAreaState = { inline: AT_EDGES, block: AT_EDGES };

/** Headless scroll-viewport state, macOS leaf — the AppKit `<scrollview>`
 *  reports `onScroll` with offsets and viewport/content heights; forwards it
 *  through `getViewportProps`. There is no native horizontal scroll event
 *  contract yet, so `axis: 'inline'` reports unscrolled (documented). */
export function useScrollableArea(options: UseScrollableAreaOptions = {}): UseScrollableAreaResult {
	const axis = options.axis ?? 'block';
	const [state, setState] = useState<ScrollableAreaState>(INITIAL);

	const onScroll = useCallback(
		(event: { verticalOffset?: number; viewportHeight?: number; contentHeight?: number }) => {
			const maxY = Math.max(0, (event.contentHeight ?? 0) - (event.viewportHeight ?? 0));
			const y = event.verticalOffset ?? 0;
			const block = {
				isScrollable: (axis === 'block' || axis === 'both') && maxY > EPS,
				atStart: axis === 'inline' || y <= EPS,
				atEnd: axis === 'inline' || y >= maxY - EPS,
			};

			setState((prev) =>
				prev.block.isScrollable === block.isScrollable &&
				prev.block.atStart === block.atStart &&
				prev.block.atEnd === block.atEnd
					? prev
					: { inline: AT_EDGES, block },
			);
		},
		[axis],
	);

	const getViewportProps = useCallback(
		(props: Record<string, any> = {}): Record<string, any> => ({
			...props,
			onScroll: (event: any) => {
				onScroll(event);
				props.onScroll?.(event);
			},
		}),
		[onScroll],
	);

	const getContentProps = useCallback(
		(props: Record<string, any> = {}): Record<string, any> => props,
		[],
	);

	return { getViewportProps, getContentProps, state };
}
