/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import type { ToastProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { Text } from './Text';

const SWIPE_DISMISS_DIP = 44;

/**
 * Toast surface (Astryx `Toast`), native leaf. Auto-hide timer; a
 * horizontal pan drags the card and releases-to-dismiss past the
 * threshold; `accessibilityLiveRegion` announces info politely and errors
 * assertively.
 */
export function Toast(props: ToastProps) @{
	const type = props.type ?? 'info';
	const autoHide = props.isAutoHide ?? type !== 'error';
	const duration = Math.max(0, props.autoHideDuration ?? 5000);
	const el = useRef<any>(null);
	const dismissed = useRef(false);
	const onDismiss = useRef(props.onDismiss);
	onDismiss.current = props.onDismiss;

	const dismiss = (reason: 'auto' | 'manual' = 'auto') => {
		if (dismissed.current) return;
		dismissed.current = true;
		onDismiss.current?.(reason);
	};

	useEffect(() => {
		if (!autoHide) return;
		const timer = setTimeout(() => dismiss('auto'), duration);
		return () => clearTimeout(timer);
	}, [autoHide, duration]);

	useEffect(() => {
		const view = el.current;
		if (!view?.on) return;
		let dragging = false;
		const onPan = (e: any) => {
			// GestureStateTypes: began=1, changed=2, ended=3, cancelled=4
			if (e.state === 1) {
				dragging = true;
			} else if (e.state === 2 && dragging) {
				view.translateX = e.deltaX;
				view.opacity = Math.max(0.3, 1 - Math.abs(view.translateX) / 160);
			} else if (e.state === 3 || e.state === 4) {
				dragging = false;
				if (Math.abs(view.translateX) >= SWIPE_DISMISS_DIP) {
					dismiss('manual');
					return;
				}

				if (view.animate) {
					view.animate({ translate: { x: 0, y: 0 }, opacity: 1, duration: 120 });
				} else {
					view.translateX = 0;
					view.opacity = 1;
				}
			}
		};

		view.on('pan', onPan);
		return () => view.off?.('pan', onPan);
	}, []);

	<flexboxlayout
		ref={(v: any) => {
			el.current = v;
			applyEscapeProps(v, props);
		}}
		id={props.id}
		flexDirection="row"
		alignItems="center"
		className={cx('vx-toast', `vx-toast--${type}`, props.isExiting && 'vx-toast--exiting', props.className)}
		style={props.style}
		accessibilityLiveRegion={(type === 'error' ? 'assertive' : 'polite') as any}
			>
		{props.renderContent ? (
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
				<flexboxlayout flexDirection="column" className="vx-toast-body" flexGrow={1}>
					{typeof props.body === 'string' ? (
						<Text>{props.body}</Text>
					) : (
						props.body
					)}
				</flexboxlayout>
				{props.endContent != null && (
					<flexboxlayout className="vx-toast-end">{props.endContent}</flexboxlayout>
				)}
			</>
		)}
	</flexboxlayout>
}
