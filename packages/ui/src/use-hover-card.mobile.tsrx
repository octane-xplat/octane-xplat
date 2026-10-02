/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useId, useRef, useState } from 'octane';
import type { HoverCardOptions, HoverCardReturn, PopoverPlacement } from './props';
import { Popover } from './Popover.tsrx';
import { cx } from './cx';

const PLACEMENT: Record<string, PopoverPlacement> = {
	above: 'top',
	below: 'bottom',
	start: 'left',
	end: 'right',
};

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
	const id = useId();
	const positionEl = useRef<any>(null);
	const interactionEl = useRef<any>(null);
	const anchorObj = useRef<{ current: any }>({ current: null });
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

	const positionRef = useCallback((el: any) => {
		positionEl.current = el;
		anchorObj.current.current = el;
	}, []);

	const ref = useCallback(
		(el: any) => {
			positionRef(el);
			interactionRef(el);
		},
		[positionRef, interactionRef],
	);

	const renderHoverCard = useCallback(
		(children: any, props?: Record<string, any>) => {
			return (
				<Popover
					open={open}
					anchor={anchorObj.current}
					placement={PLACEMENT[props?.placement ?? options.placement ?? 'above'] ?? 'top'}
					alignment={(props?.alignment ?? options.alignment ?? 'center') as any}
					dismissOnOutsideTap={true}
					onDismiss={hide}
					className={cx('vx-hovercard', props?.className)}
					style={props?.style}
				>
					<flexboxlayout
						flexDirection="column"
						className="vx-hovercard-content"
						accessibilityLabel={options.label}
					>
						{children}
					</flexboxlayout>
				</Popover>
			);
		},
		[open, options.placement, options.alignment, options.label, hide],
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
		show,
		hide,
	};
}
