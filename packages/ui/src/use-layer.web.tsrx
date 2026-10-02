import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx';
import { createPortal, useCallback, useEffect, useId, useRef, useState } from 'octane';
import type {
	ContextLayerReturn,
	ContextRenderProps,
	FixedLayerOptions,
	FixedLayerReturn,
	FixedRenderProps,
	LayerOptions,
} from './props';

import { useThemeScheme } from './theme/theme-scheme';
import { Popover } from './Popover';
import { cx } from './cx';
import { ownAnchorName } from './layer-position.web';

interface FloatingLayerProps {
	open?: boolean
	/** Viewport coordinates; omitted under consumer-authored positioning. */
	x?: number
	y?: number
	lightDismiss?: boolean
	dismissOnEscape?: boolean
	onDismiss?: () => void
	className?: any
	style?: any
	web?: Record<string, any>
	children?: any
}

/** Portal-mounted layer without anchor math — fixed x/y placement, or
 *  consumer-authored position styles (context mode `positioning: 'custom'`,
 *  which can chain off `anchorId` via CSS anchor positioning). */
function FloatingLayer(props: FloatingLayerProps) @{
	const dark = useThemeScheme() === 'dark';
	const dismissal = useLayerDismissal({ get active() { return !!props.open }, dismiss: () => props.onDismiss?.(), get behavior() { return (props.dismissOnEscape ?? props.lightDismiss) ? 'close' : 'block' } });
	const stopPointer = (event: PointerEvent) => event.stopPropagation();
	const dismiss = (event: MouseEvent) => {
		event.preventDefault();
		event.stopPropagation();
		props.onDismiss?.();
	};

	@if (props.open) {
		<>{createPortal(
			<div
				className={cx('vx-popover-layer', dark && 'dark')}
				style={{ position: 'fixed', inset: 0, zIndex: 1000, pointerEvents: 'none' }}
			>
				{(props.lightDismiss ?? false) && <div
					className="vx-popover-backdrop"
					style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'auto' }}
					onPointerDown={stopPointer}
					onClick={dismiss}
				/>}
				<div
					className={cx('vx-popover', props.className)}
					style={{
						position: 'fixed',
						...(props.y != null && { top: props.y }),
						...(props.x != null && { left: props.x }),
						zIndex: 1,
						pointerEvents: 'auto',
						...props.style,
					}}
					{...props.web}
				>
					<LayerDepthProvider value={dismissal.depth}>{props.children}</LayerDepthProvider>
				</div>
			</div>,
			document.body,
		)}</>
	}
}

/**
 * Anchored-layer primitive (Astryx `useLayer`). Context mode positions a
 * portal layer against the `ref`-bound anchor — flip/clamp rides the shared
 * `positionPopover` geometry instead of CSS anchor positioning; `ref` still
 * stamps `anchor-name` (`anchorId`) so `positioning: 'custom'` render props
 * can author native CSS `anchor()` insets. Fixed mode positions at explicit
 * viewport x/y. Content only mounts while open.
 */
export function useLayer<O extends LayerOptions>(
	options: O,
): O extends FixedLayerOptions ? FixedLayerReturn : ContextLayerReturn {
	const fixed = options.mode === 'fixed';
	const id = useId();
	const anchorId = `--xplat-layer-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;
	const [uncontrolled, setIsOpen] = useState(false);
	const isOpen = options.isOpen ?? uncontrolled;
	const controlled = options.isOpen !== undefined;
	const openRef = useRef(false);
	const anchor = useRef<{ current: any }>({ current: null });
	openRef.current = isOpen;
	const onShowRef = useRef(options.onShow);
	onShowRef.current = options.onShow;
	const onHideRef = useRef(options.onHide);
	onHideRef.current = options.onHide;

	const show = useCallback(() => {
		if (openRef.current) return;
		if (!controlled) { openRef.current = true; setIsOpen(true); }
		onShowRef.current?.();
	}, [controlled]);

	const hide = useCallback(() => {
		if (!openRef.current) return;
		if (!controlled) { openRef.current = false; setIsOpen(false); }
		onHideRef.current?.();
	}, [controlled]);


	const releaseAnchor = useRef<(() => void) | null>(null);
	const ref = useCallback((el: any) => {
		releaseAnchor.current?.();
		anchor.current.current = el;
		releaseAnchor.current = el?.style ? ownAnchorName(el, anchorId) : null;
	}, [anchorId]);

	useEffect(() => () => releaseAnchor.current?.(), []);

	const render = useCallback(
		(children: any, props?: ContextRenderProps | FixedRenderProps) => {
			if (fixed) {
				const p = (props ?? {}) as FixedRenderProps;
				return (
					<FloatingLayer
						open={isOpen}
						x={p.x}
						y={p.y}
						lightDismiss={options.lightDismiss}
						dismissOnEscape={options.dismissOnEscape}
						onDismiss={hide}
						className={p.className}
						style={p.style}
						web={{
							id,
							role: p.accessibilityRole,
							'aria-label': p.accessibilityLabel,
							...p.web,
						}}
					>
						{children}
					</FloatingLayer>
				);
			}

			const p = (props ?? {}) as ContextRenderProps;
			const web = {
				id,
				role: p.accessibilityRole,
				'aria-label': p.accessibilityLabel,
				...p.web,
			};

			if (p.positioning === 'custom') {
				return (
					<FloatingLayer
						open={isOpen}
						lightDismiss={options.lightDismiss}
						dismissOnEscape={options.dismissOnEscape}
						onDismiss={hide}
						className={p.className}
						style={{ positionAnchor: anchorId, ...p.style }}
						web={web}
					>
						{children}
					</FloatingLayer>
				);
			}

			return (
				<Popover
					open={isOpen}
					layerPosition={p}
					anchor={anchor.current}
					offset={p.offset ?? 0}
					dismissOnOutsideTap={options.lightDismiss === true}
					dismissOnEscape={options.dismissOnEscape ?? options.lightDismiss === true}
					onDismiss={hide}
					finalFocusRef={p.finalFocusRef}
					className={p.className}
					style={p.style}
					web={web}
				>
					{children}
				</Popover>
			);
		},
		[fixed, isOpen, options.lightDismiss, options.dismissOnEscape, id, hide],
	);

	return (fixed
		? { ref: undefined, id, isOpen, show, hide, render }
		: { ref, anchorId, id, isOpen, show, hide, render }) as O extends FixedLayerOptions
		? FixedLayerReturn
		: ContextLayerReturn;
}
