/** @jsxImportSource @nativescript-community/octane */
import { useLayer } from './use-layer';
import { useCallback, useEffect, useRef, useState } from 'octane';
import type { HoverCardOptions, HoverCardReturn } from './props';
import { cx } from './cx';

const host = () => (globalThis as any).__xplatAppKit ?? {};

function HoverCardPanel(props: { body: any; enter: () => void; exit: () => void }) @{
	const view = useRef<any>(null);
	useEffect(() => host().observeHover?.(view.current, { enter: props.enter, exit: props.exit }), [props.enter, props.exit]);

	<flexboxlayout ref={view} flexDirection="column" className="vx-hovercard-content">{props.body}</flexboxlayout>
}

/**
 * Default (macOS) leaf of the hover-card hook — the AppKit host bridge
 * supplies real pointer intent (`observeHover` tracking areas) and the
 * card mounts through the in-window useLayer primitive
 * in its own root. iOS/Android resolve the
 * `.mobile` leaf instead.
 */
export function useHoverCard(options: HoverCardOptions = {}): HoverCardReturn @{
	const isEnabled = options.isEnabled ?? true;
	const delay = Math.max(0, options.delay ?? 300);
	const hideDelay = Math.max(0, options.hideDelay ?? 200);
	const controlled = options.isOpen !== undefined;
	const [uncontrolled, setUncontrolled] = useState(options.isDefaultOpen === true);
	const open = controlled ? options.isOpen === true : uncontrolled;

	const positionEl = useRef<any>(null);
	const interactionEl = useRef<any>(null);
	const detachHover = useRef<(() => void) | null>(null);



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

	const requestedShow = useRef(false);
	const closeNow = useCallback(() => {
		clearTimers();
		if (!controlled) setUncontrolled(false);
		onHide.current?.();
	}, [clearTimers, controlled]);

	const openNow = useCallback(() => {
		if (!isEnabled || open || !positionEl.current || typeof host().showLayer !== 'function') return;
		requestedShow.current = true;
		if (!controlled) setUncontrolled(true);
		onShow.current?.();
	}, [isEnabled, controlled, open]);

	const layer = useLayer({ mode: 'context', isOpen: open && isEnabled, dismissOnEscape: true, lightDismiss: true, onHide: closeNow });
	const id = layer.id;
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

	const scheduleCardHide = useCallback(() => {
		clearTimers();
		closeTimer.current = setTimeout(closeNow, hideDelay);
	}, [clearTimers, closeNow, hideDelay]);

	const positionRef = useCallback((el: any) => {
		positionEl.current = el;
		layer.ref(el);
	}, [layer.ref]);

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

	useEffect(() => {
		if (open && isEnabled && typeof host().showLayer === 'function') {
			if (!requestedShow.current) onShow.current?.();
			requestedShow.current = false;
		}
	}, [open, isEnabled]);

	useEffect(() => { if (options.isOpen === false) clearTimers(); }, [options.isOpen, clearTimers]);
	useEffect(() => () => { clearTimers(); detachHover.current?.(); }, [clearTimers]);
	const renderHoverCard = useCallback((children: any, props?: Record<string, any>) => { return layer.render(
		<HoverCardPanel body={children} enter={clearTimers} exit={scheduleCardHide} />,
		{ placement: props?.placement ?? options.placement ?? 'above', alignment: props?.alignment ?? options.alignment ?? 'center', offset: 8,
			className: cx('vx-hovercard', props?.className), style: props?.style, accessibilityLabel: options.label },
	); }, [layer.render, options.placement, options.alignment, options.label, scheduleCardHide, clearTimers]);

	return {
		ref,
		positionRef,
		interactionRef,
		anchorId: layer.anchorId,
		id,
		describedBy: id,
		isOpen: open,
		renderHoverCard,
		show: openNow,
		hide: closeNow,
	};
}
