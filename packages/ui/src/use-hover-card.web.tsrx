import { useCallback, useEffect, useId, useRef, useState } from 'octane';
import type {
	HoverCardAlignment,
	HoverCardOptions,
	HoverCardPlacement,
	HoverCardReturn,
	PopoverPlacement,
} from './props';

import { Popover } from './Popover.web.tsrx';
import { cx } from './cx';

/** Elements a tap "belongs to" — under `touchTrigger: 'auto'` their tap
 *  runs the control instead of opening the card. */
const ACTION_SELECTOR =
	'button, a[href], input, select, textarea, summary, [role="button"], [role="link"], [contenteditable="true"]';

const isFocusable = (el: HTMLElement): boolean => {
	if (el.hasAttribute('tabindex')) {
		return el.tabIndex >= 0;
	}

	if (el.isContentEditable) {
		return true;
	}

	return ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
};

export function placementFor(place: HoverCardPlacement, rtl: boolean): PopoverPlacement {
	switch (place) {
		case 'below':
			return 'bottom';
		case 'start':
			return rtl ? 'right' : 'left';
		case 'end':
			return rtl ? 'left' : 'right';
		default:
			return 'top';
	}
}

/**
 * Hover/focus/tap-triggered anchored card (Astryx `useHoverCard`), web
 * leaf. Hover opens after `delay` and hides after `hideDelay`; the card
 * stays open while the pointer or focus moves into it. Focus triggers
 * attach when `focusTrigger` allows (auto = naturally focusable). A tap
 * on a touch pointer opens immediately per `touchTrigger`. Escape hides
 * (or reports, when `isOpen` is controlled).
 */
export function useHoverCard(options: HoverCardOptions = {}): HoverCardReturn {
	const {
		placement = 'above',
		alignment = 'center',
		delay = 300,
		hideDelay = 200,
		focusTrigger = 'auto',
		touchTrigger = 'auto',
		isEnabled = true,
		label,
		isOpen,
		isDefaultOpen = false,
		onShow,
		onHide,
	} = options;

	const id = useId();
	const [uncontrolled, setUncontrolled] = useState(isDefaultOpen);
	const controlled = isOpen !== undefined;
	const open = controlled ? isOpen === true : uncontrolled;
	const positionEl = useRef<HTMLElement | null>(null);
	const interactionEl = useRef<HTMLElement | null>(null);
	const cardEl = useRef<HTMLElement | null>(null);
	const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isTouch = useRef(false);
	const escapeHiding = useRef(false);
	const anchorObj = useRef<{ current: any }>({ current: null });

	const onShowRef = useRef(onShow);
	onShowRef.current = onShow;
	const onHideRef = useRef(onHide);
	onHideRef.current = onHide;

	const clearTimers = useCallback(() => {
		if (showTimer.current) clearTimeout(showTimer.current);
		if (hideTimer.current) clearTimeout(hideTimer.current);
		showTimer.current = null;
		hideTimer.current = null;
	}, []);

	const showNow = useCallback(() => {
		clearTimers();
		if (!controlled) setUncontrolled(true);
		onShowRef.current?.();
	}, [clearTimers, controlled]);

	const hideNow = useCallback(() => {
		clearTimers();
		if (!controlled) setUncontrolled(false);
		onHideRef.current?.();
	}, [clearTimers, controlled]);

	const scheduleShow = useCallback(() => {
		if (!isEnabled || isOpen === false) return;
		clearTimers();
		showTimer.current = setTimeout(() => {
			showTimer.current = null;
			if (!controlled) setUncontrolled(true);
			onShowRef.current?.();
		}, Math.max(0, delay));
	}, [isEnabled, isOpen, controlled, delay, clearTimers]);

	const scheduleHide = useCallback(() => {
		if (isOpen === true) return;
		clearTimers();
		hideTimer.current = setTimeout(() => {
			hideTimer.current = null;
			if (!controlled) setUncontrolled(false);
			onHideRef.current?.();
		}, Math.max(0, hideDelay));
	}, [isOpen, controlled, hideDelay, clearTimers]);

	// --- interaction listeners on the trigger element ---
	const onMouseEnter = useCallback(() => {
		// A tap synthesizes mouseenter — the touch path owns that decision.
		if (isTouch.current) return;
		scheduleShow();
	}, [scheduleShow]);

	const onMouseLeave = useCallback(() => {
		if (isTouch.current) return;
		scheduleHide();
	}, [scheduleHide]);

	const onPointerDown = useCallback(
		(event: PointerEvent) => {
			if (event.pointerType !== 'touch') {
				isTouch.current = false;
				return;
			}

			isTouch.current = true;
			if (!isEnabled || touchTrigger === 'none' || controlled) return;
			if (touchTrigger === 'auto') {
				const target = event.target as HTMLElement | null;
				if (target?.closest?.(ACTION_SELECTOR)) {
					return;
				}
			}

			open ? hideNow() : showNow();
		},
		[isEnabled, touchTrigger, controlled, open, showNow, hideNow],
	);

	const onFocusIn = useCallback(() => {
		if (!isEnabled || isTouch.current) return;
		if (escapeHiding.current) {
			escapeHiding.current = false;
			return;
		}

		clearTimers();
		if (!controlled) setUncontrolled(true);
		onShowRef.current?.();
	}, [isEnabled, controlled, clearTimers]);

	const onFocusOut = useCallback(
		(event: FocusEvent) => {
			const next = event.relatedTarget as HTMLElement | null;
			if (cardEl.current?.contains(next)) {
				return;
			}

			scheduleHide();
		},
		[scheduleHide],
	);

	const interactionRef = useCallback(
		(el: HTMLElement | null) => {
			const prev = interactionEl.current;
			if (prev) {
				prev.removeEventListener('mouseenter', onMouseEnter);
				prev.removeEventListener('mouseleave', onMouseLeave);
				prev.removeEventListener('pointerdown', onPointerDown as EventListener);
				prev.removeEventListener('focusin', onFocusIn);
				prev.removeEventListener('focusout', onFocusOut as EventListener);
			}

			interactionEl.current = el;
			if (el) {
				el.addEventListener('mouseenter', onMouseEnter);
				el.addEventListener('mouseleave', onMouseLeave);
				el.addEventListener('pointerdown', onPointerDown as EventListener);
				const attachFocus =
					focusTrigger === 'always' || (focusTrigger === 'auto' && isFocusable(el));

				if (attachFocus) {
					el.addEventListener('focusin', onFocusIn);
					el.addEventListener('focusout', onFocusOut as EventListener);
				}
			}
		},
		[focusTrigger, onMouseEnter, onMouseLeave, onPointerDown, onFocusIn, onFocusOut],
	);

	const positionRef = useCallback((el: HTMLElement | null) => {
		positionEl.current = el;
		anchorObj.current.current = el;
	}, []);

	const ref = useCallback(
		(el: HTMLElement | null) => {
			positionRef(el);
			interactionRef(el);
		},
		[positionRef, interactionRef],
	);

	// Escape hides the open card (or reports upward under control).
	useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key !== 'Escape' || event.isComposing) return;
			clearTimers();
			isTouch.current = false;
			if (controlled) {
				onHideRef.current?.();
				return;
			}

			const hadFocus = cardEl.current?.contains(document.activeElement) ?? false;
			setUncontrolled(false);
			onHideRef.current?.();
			if (hadFocus) {
				escapeHiding.current = true;
				interactionEl.current?.focus?.({ preventScroll: true });
			}
		};

		document.addEventListener('keydown', onKey);
		return () => document.removeEventListener('keydown', onKey);
	}, [open, controlled, clearTimers]);

	// isDefaultOpen lands once.
	useEffect(() => {
		if (isDefaultOpen) {
			if (!controlled) setUncontrolled(true);
			onShowRef.current?.();
		}
		// eslint-disable-next-line -- mount-only
	}, []);

	useEffect(() => () => clearTimers(), [clearTimers]);

	const renderHoverCard = useCallback(
		(children: any, props?: Record<string, any>) => {
			const rtl =
				positionEl.current != null &&
				getComputedStyle(positionEl.current).direction === 'rtl';

			return (
				<Popover
					open={open}
					anchor={anchorObj.current}
					placement={placementFor(props?.placement ?? placement, rtl)}
					alignment={(props?.alignment ?? alignment) as HoverCardAlignment as any}
					dismissOnOutsideTap={isTouch.current}
					onDismiss={() => hideNow()}
					className={cx('vx-hovercard', props?.className)}
					style={props?.style}
					web={{
						id,
						role: label ? 'dialog' : 'group',
						'aria-label': label || undefined,
						onMouseEnter: () => {
							if (isTouch.current) return;
							clearTimers();
						},
						onMouseLeave: () => {
							if (isTouch.current) return;
							scheduleHide();
						},
						onFocusOut: (e: FocusEvent) => {
							const next = e.relatedTarget as HTMLElement | null;
							const panel = e.currentTarget as HTMLElement;
							if (panel.contains(next) || interactionEl.current?.contains(next)) {
								return;
							}

							scheduleHide();
						},
					}}
				>
					<div ref={(el: any) => { cardEl.current = el; }} className="vx-hovercard-content">
						{children}
					</div>
				</Popover>
			);
		},
		[open, placement, alignment, label, id, hideNow, clearTimers, scheduleHide],
	);

	return {
		ref,
		positionRef,
		interactionRef,
		anchorId: id,
		id,
		describedBy: id,
		isOpen: open,
		renderHoverCard,
		show: showNow,
		hide: hideNow,
	};
}
