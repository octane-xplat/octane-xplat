/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useId, useRef, useState } from 'octane';
import type { HoverCardOptions, HoverCardReturn, PopoverPlacement } from './props';
import { cx } from './cx';

const host = () => (globalThis as any).__xplatAppKit ?? {};

const PLACEMENT: Record<string, PopoverPlacement> = {
	above: 'top',
	below: 'bottom',
	start: 'left',
	end: 'right',
};

function HoverCardPanel(props: { body?: any; className?: any; style?: any }) @{
	<flexboxlayout
		flexDirection="column"
		className={cx('vx-hovercard', props.className)}
		style={props.style}
	>
		{props.body}
	</flexboxlayout>
}

/**
 * Default (macOS) leaf of the hover-card hook — the AppKit host bridge
 * supplies real pointer intent (`observeHover` tracking areas) and the
 * card mounts as an anchored `showAnchoredPopup` (NSPopover-kind surface)
 * in its own root. iOS/Android resolve the
 * `.mobile` leaf instead.
 */
export function useHoverCard(options: HoverCardOptions = {}): HoverCardReturn {
	const isEnabled = options.isEnabled ?? true;
	const delay = Math.max(0, options.delay ?? 300);
	const hideDelay = Math.max(0, options.hideDelay ?? 200);
	const controlled = options.isOpen !== undefined;
	const [uncontrolled, setUncontrolled] = useState(options.isDefaultOpen === true);
	const open = controlled ? options.isOpen === true : uncontrolled;
	const id = useId();
	const positionEl = useRef<any>(null);
	const interactionEl = useRef<any>(null);
	const detachHover = useRef<(() => void) | null>(null);
	const cardContent = useRef<any>(null);
	const cardChrome = useRef<Record<string, any> | undefined>(undefined);
	const popup = useRef<any>(null);
	const detachCardHover = useRef<(() => void) | null>(null);
	const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onShow = useRef(options.onShow);
	onShow.current = options.onShow;
	const onHide = useRef(options.onHide);
	onHide.current = options.onHide;

	const clearTimers = useCallback(() => {
		if (openTimer.current) clearTimeout(openTimer.current);
		if (closeTimer.current) clearTimeout(closeTimer.current);
		openTimer.current = null;
		closeTimer.current = null;
	}, []);

	const closeNow = useCallback(() => {
		clearTimers();
		detachCardHover.current?.();
		detachCardHover.current = null;
		popup.current?.close?.();
		popup.current = null;
		if (!controlled) setUncontrolled(false);
		onHide.current?.();
	}, [clearTimers, controlled]);

	const openNow = useCallback(() => {
		if (!isEnabled || popup.current) return;
		const view = positionEl.current;
		const showAnchored = host().showAnchoredPopup;
		if (!view || typeof showAnchored !== 'function') return;
		popup.current = showAnchored({
			anchor: view,
			placement: PLACEMENT[options.placement ?? 'above'] ?? 'top',
			component: HoverCardPanel,
			props: {
				body: cardContent.current,
				className: cardChrome.current?.className,
				style: cardChrome.current?.style,
			},
		});

		if (popup.current?.contentView && typeof host().observeHover === 'function') {
			detachCardHover.current = host().observeHover(popup.current.contentView, {
				enter: clearTimers,
				exit: () => {
					clearTimers();
					closeTimer.current = setTimeout(closeNow, hideDelay);
				},
			});
		}

		if (!controlled) setUncontrolled(true);
		onShow.current?.();
	}, [isEnabled, controlled, options.placement, clearTimers, hideDelay, closeNow]);

	const scheduleShow = useCallback(() => {
		if (!isEnabled || options.isOpen === false) return;
		clearTimers();
		openTimer.current = setTimeout(() => {
			openTimer.current = null;
			openNow();
		}, delay);
	}, [isEnabled, options.isOpen, clearTimers, openNow, delay]);

	const scheduleHide = useCallback(() => {
		if (options.isOpen === true) return;
		clearTimers();
		closeTimer.current = setTimeout(() => {
			closeTimer.current = null;
			closeNow();
		}, hideDelay);
	}, [options.isOpen, clearTimers, hideDelay, closeNow]);

	const positionRef = useCallback((el: any) => {
		positionEl.current = el;
	}, []);

	const interactionRef = useCallback(
		(el: any) => {
			detachHover.current?.();
			detachHover.current = null;
			interactionEl.current = el;
			if (!el || !isEnabled) return;
			const observe = host().observeHover;
			if (typeof observe !== 'function') return;
			detachHover.current = observe(el, {
				enter: scheduleShow,
				exit: () => {
					if (openTimer.current) {
						clearTimeout(openTimer.current);
						openTimer.current = null;
					}

					scheduleHide();
				},
			});
		},
		[isEnabled, scheduleShow, scheduleHide],
	);

	const ref = useCallback(
		(el: any) => {
			positionRef(el);
			interactionRef(el);
		},
		[positionRef, interactionRef],
	);

	// Controlled open drives the popup directly.
	useEffect(() => {
		if (options.isOpen === true) {
			openNow();
		} else if (options.isOpen === false) {
			closeNow();
		}
	}, [options.isOpen, openNow, closeNow]);

	useEffect(() => {
		if (options.isDefaultOpen === true && !controlled) {
			openNow();
		}
		// eslint-disable-next-line -- mount-only
	}, []);

	useEffect(
		() => () => {
			clearTimers();
			detachHover.current?.();
			detachCardHover.current?.();
			popup.current?.close?.();
			popup.current = null;
		},
		[clearTimers],
	);

	const renderHoverCard = useCallback((children: any, props?: Record<string, any>) => {
		cardContent.current = children;
		cardChrome.current = props;
		// The panel mounts imperatively through the host bridge on open —
		// nothing lands in the declaring tree.
		return null;
	}, []);

	return {
		ref,
		positionRef,
		interactionRef,
		anchorId: id,
		id,
		describedBy: id,
		isOpen: open,
		renderHoverCard,
		show: openNow,
		hide: closeNow,
	};
}
