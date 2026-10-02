/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useRef, useState } from 'octane';
import type {
	ScrollAxisState,
	ScrollableAreaState,
	UseScrollableAreaOptions,
	UseScrollableAreaResult,
} from './props';

const EPS = 1;
const AT_EDGES: ScrollAxisState = { isScrollable: false, atStart: true, atEnd: true };
const INITIAL: ScrollableAreaState = { inline: AT_EDGES, block: AT_EDGES };

/**
 * Headless scroll-viewport behavior (Astryx `useScrollableArea`), native
 * leaf. NS ScrollView reports `scrollableWidth/Height` + offsets through
 * its `scroll` event; `layoutChanged` on the viewport covers content
 * resize. The getters merge `bind` (element hook) and `accessibilityLabel`
 * — there is no tab stop, role, overscroll-chaining, or sticky
 * containment to own on native, so `keyboardAccess`, `overscroll`, and
 * `stickyContainment` are accepted but inert.
 */
export function useScrollableArea(options: UseScrollableAreaOptions = {}): UseScrollableAreaResult {
	const axis = options.axis ?? 'block';
	const viewportRef = useRef<any>(null);
	const contentRef = useRef<any>(null);
	const detachRef = useRef<(() => void) | null>(null);
	const [state, setState] = useState<ScrollableAreaState>(INITIAL);

	const measure = useCallback(() => {
		const el = viewportRef.current;
		if (!el) {
			return;
		}

		const inlineOk = axis === 'inline' || axis === 'both';
		const blockOk = axis === 'block' || axis === 'both';
		// scrollableWidth/Height are the max offsets; a positive max means
		// content overflows on that axis.
		const maxX = Math.max(0, Number(el.scrollableWidth) || 0);
		const maxY = Math.max(0, Number(el.scrollableHeight) || 0);
		const x = Number(el.horizontalOffset) || 0;
		const y = Number(el.verticalOffset) || 0;
		const inline: ScrollAxisState = {
			isScrollable: inlineOk && maxX > EPS,
			atStart: !inlineOk || x <= EPS,
			atEnd: !inlineOk || x >= maxX - EPS,
		};

		const block: ScrollAxisState = {
			isScrollable: blockOk && maxY > EPS,
			atStart: !blockOk || y <= EPS,
			atEnd: !blockOk || y >= maxY - EPS,
		};

		setState((prev) =>
			prev.inline.isScrollable === inline.isScrollable &&
			prev.inline.atStart === inline.atStart &&
			prev.inline.atEnd === inline.atEnd &&
			prev.block.isScrollable === block.isScrollable &&
			prev.block.atStart === block.atStart &&
			prev.block.atEnd === block.atEnd
				? prev
				: { inline, block },
		);
	}, [axis]);

	const bindViewport = useCallback(
		(el: any) => {
			detachRef.current?.();
			detachRef.current = null;
			viewportRef.current = el;
			if (el?.on) {
				el.on('scroll', measure);
				el.on('layoutChanged', measure);
				detachRef.current = () => {
					el.off?.('scroll', measure);
					el.off?.('layoutChanged', measure);
				};
			}

			measure();
		},
		[measure],
	);

	const bindContent = useCallback((el: any) => {
		contentRef.current = el;
	}, []);

	useEffect(() => () => detachRef.current?.(), []);

	const getViewportProps = useCallback(
		(props: Record<string, any> = {}): Record<string, any> => ({
			...props,
			bind: bindViewport,
		}),
		[bindViewport],
	);

	const getContentProps = useCallback(
		(props: Record<string, any> = {}): Record<string, any> => ({
			...props,
			bind: bindContent,
		}),
		[bindContent],
	);

	return { getViewportProps, getContentProps, state };
}
