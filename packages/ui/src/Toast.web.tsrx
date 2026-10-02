import { useCallback, useEffect, useRef } from 'octane';
import type { ToastProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';

const SWIPE_DISMISS_PX = 44;

/**
 * Toast surface (Astryx `Toast`), web leaf. Manages its own auto-hide
 * timer (pauses while hovered or focused, like upstream), horizontal
 * swipe/touch drag to dismiss, and `renderContent` takeover. ARIA:
 * `role="status" aria-live="polite"` for info, `role="alert"` for error.
 */
export function Toast(props: ToastProps) @{
	const type = props.type ?? 'info';
	const autoHide = props.isAutoHide ?? type !== 'error';
	const duration = Math.max(0, props.autoHideDuration ?? 5000);
	const el = useRef<HTMLDivElement | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const remaining = useRef(duration);
	const deadline = useRef(0);
	const onDismiss = useRef(props.onDismiss);
	onDismiss.current = props.onDismiss;
	const dismissed = useRef(false);

	const dismiss = useCallback(
		(reason: 'auto' | 'manual' = 'auto') => {
			if (dismissed.current) return;
			dismissed.current = true;
			if (timer.current) clearTimeout(timer.current);
			onDismiss.current?.(reason);
		},
		[],
	);

	const arm = useCallback(() => {
		if (!autoHide || dismissed.current) return;
		if (timer.current) clearTimeout(timer.current);
		deadline.current = Date.now() + remaining.current;
		timer.current = setTimeout(() => dismiss('auto'), remaining.current);
	}, [autoHide, dismiss]);

	const pause = useCallback(() => {
		if (timer.current) {
			clearTimeout(timer.current);
			timer.current = null;
			remaining.current = Math.max(0, deadline.current - Date.now());
		}
	}, []);

	useEffect(() => {
		arm();
		return () => {
			if (timer.current) clearTimeout(timer.current);
		};
	}, [arm]);

	// Touch/stylus drag toward the nearest horizontal edge dismisses.
	const drag = useRef<{ x: number } | null>(null);
	const onPointerDown = (e: PointerEvent) => {
		if (e.pointerType === 'mouse' || !el.current) return;
		drag.current = { x: e.clientX };
		el.current.setPointerCapture?.(e.pointerId);
	};

	const onPointerMove = (e: PointerEvent) => {
		if (!drag.current || !el.current) return;
		const dx = e.clientX - drag.current.x;
		el.current.style.transform = `translateX(${dx}px)`;
		el.current.style.opacity = String(Math.max(0.3, 1 - Math.abs(dx) / 160));
	};

	const onPointerUp = (e: PointerEvent) => {
		const start = drag.current;
		drag.current = null;
		if (!start || !el.current) return;
		const dx = e.clientX - start.x;
		if (Math.abs(dx) >= SWIPE_DISMISS_PX) {
			dismiss('manual');
			return;
		}

		el.current.style.transform = '';
		el.current.style.opacity = '';
	};

	const role = type === 'error' ? 'alert' : 'status';
	const body = props.renderContent ? (
		props.renderContent({
			body: props.body,
			endContent: props.endContent,
			type,
			isAutoHide: autoHide,
			autoHideDuration: duration,
			dismiss: () => dismiss('manual'),
		})
	) : (
		<>
			<div className="vx-toast-body">{props.body}</div>
			{props.endContent != null && (
				<div className="vx-toast-end">{props.endContent}</div>
			)}
		</>
	);

	return (
		<div
			ref={(node: any) => {
				el.current = node;
				applyEscapeProps(node, props);
			}}
			id={props.id}
			className={cx('vx-toast', `vx-toast--${type}`, props.isExiting && 'vx-toast--exiting', props.className)}
			style={{ touchAction: 'pan-y', ...props.style }}
			role={role}
			aria-live={type === 'error' ? 'assertive' : 'polite'}
			tabIndex={0}
			onMouseEnter={pause}
			onMouseLeave={arm}
			onFocus={pause}
			onBlur={arm}
			onPointerDown={onPointerDown}
			onPointerMove={onPointerMove}
			onPointerUp={onPointerUp}
			onPointerCancel={onPointerUp}
		>
			{body}
		</div>
	);
}

/** Internal viewport alias; the public card remains `Toast`. */
export const ToastSurface = Toast
