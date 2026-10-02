/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useRef, useState } from 'octane';
import type { HoverCardOptions, HoverCardReturn } from './props';
import { useLayer } from './use-layer';
import { cx } from './cx';

/**
 * Touch-leaf of the hover card hook. There is no hover or focus traversal
 * on touch platforms, so `delay`/`hideDelay`/`focusTrigger` are inert;
 * `touchTrigger` drives a tap on the interaction element. 'auto' cannot
 * detect an action trigger on native — it behaves as 'tap' (documented
 * deviation). The card dismisses on an outside tap (or Escape-equivalent
 * platform back through the popover's own dismissal).
 */
export function useHoverCard(options: HoverCardOptions = {}): HoverCardReturn @{
	const isEnabled = options.isEnabled ?? true;
	const touchTrigger = options.touchTrigger ?? 'auto';
	const controlled = options.isOpen !== undefined;
	const [uncontrolled, setUncontrolled] = useState(options.isDefaultOpen === true);
	const open = controlled ? options.isOpen === true : uncontrolled;

	const positionEl = useRef<any>(null);
	const interactionEl = useRef<any>(null);

	const onShow = useRef(options.onShow);
	onShow.current = options.onShow;
	const onHide = useRef(options.onHide);
	onHide.current = options.onHide;

	const show = useCallback(() => {
		if (!isEnabled) return;
		if (!controlled) setUncontrolled(true);
		onShow.current?.();
	}, [isEnabled, controlled]);

	const hide = useCallback(() => {
		if (controlled) {
			onHide.current?.();
			return;
		}

		setUncontrolled(false);
		onHide.current?.();
	}, [controlled]);

	const detachTap = useRef<(() => void) | null>(null);
	const interactionRef = useCallback(
		(el: any) => {
			detachTap.current?.();
			detachTap.current = null;
			interactionEl.current = el;
			if (!el?.on || touchTrigger === 'none' || !isEnabled) {
				return;
			}

			const handler = () => {
				if (controlled) {
					// Report only — the consumer's isOpen update decides.
					if (options.isOpen) {
						onHide.current?.();
					} else {
						onShow.current?.();
					}

					return;
				}

				setUncontrolled((v) => {
					if (v) {
						onHide.current?.();
					} else {
						onShow.current?.();
					}

					return !v;
				});
			};

			el.on('tap', handler);
			detachTap.current = () => el.off?.('tap', handler);
		},
		[isEnabled, touchTrigger, controlled, options.isOpen],
	);

	const layer = useLayer({ mode: 'context', isOpen: open, lightDismiss: true, dismissOnEscape: true, onHide: hide });
	const id = layer.id;

	const positionRef = useCallback((el: any) => {
		positionEl.current = el;
		layer.ref(el);
	}, [layer.ref]);

	const ref = useCallback(
		(el: any) => {
			positionRef(el);
			interactionRef(el);
		},
		[positionRef, interactionRef],
	);


	const renderHoverCard = useCallback((children: any, props?: Record<string, any>) => { return layer.render(
		<flexboxlayout
						flexDirection="column"
						className="vx-hovercard-content"
						accessibilityLabel={options.label}
					>
						{children}
					</flexboxlayout>,
		{ placement: props?.placement ?? options.placement ?? 'above', alignment: props?.alignment ?? options.alignment ?? 'center', offset: 8,
			className: cx('vx-hovercard', props?.className), style: props?.style },
	); }, [layer.render, options.placement, options.alignment, options.label]);

	return {
		ref,
		positionRef,
		interactionRef,
		anchorId: layer.anchorId,
		id,
		describedBy: id,
		isOpen: open,
		renderHoverCard,
		show,
		hide,
	};
}
