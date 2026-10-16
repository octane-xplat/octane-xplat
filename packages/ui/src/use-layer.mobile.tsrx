/** @jsxImportSource @nativescript-community/octane */
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx';
import { SizeProvider } from './size-context';
import { useCallback, useEffect, useId, useRef, useState } from 'octane';
import { GridLayout } from '@nativescript/core';
import { createPortal } from './native-portal';
import type {
	ContextLayerReturn,
	ContextRenderProps,
	FixedLayerOptions,
	FixedLayerReturn,
	FixedRenderProps,
	LayerOptions,
} from './props';

import { Popover } from './Popover';
import type { PopoverInternalProps } from './internal-props';
import { applyNativeProps } from './platformProps';
import { useThemeScheme } from './theme/theme-scheme';
import { applyThemeClasses } from './theme/theme-host';
import { cx } from '@octane-xplat/lib';
import { rootLayoutFor } from './root-layout';
import { createOverlayLifetime } from './overlay-lifetime';
import { layerOffset } from './popover-position';

/** Popover accepts useLayer's internal geometry adapter — public props
 *  stay clean; the cast carries the internal field. */
const PopoverWithLayerPosition = Popover as unknown as (props: PopoverInternalProps) => unknown;

interface FixedSurfaceProps {
	layerDepth?: number
	/** Page-coordinate position in dips; consumer-authored styles carry it
	 *  under `positioning: 'custom'`. */
	x?: number
	y?: number
	lightDismiss?: boolean
	dismissOnEscape?: boolean
	onDismiss?: () => void
	className?: any
	style?: any
	accessibilityLabel?: string
	ios?: Record<string, any>
	android?: Record<string, any>
	children?: any
}

/** Layer surface inside the portal host — the Popover layout without
 *  anchor measurement. */
function FixedLayerSurface(props: FixedSurfaceProps) @{
	const panelRef = useRef<any>(null);
	useEffect(() => {
		applyNativeProps(panelRef.current, props);
	}, [props.ios, props.android]);

	<absolutelayout
		width="100%"
		height="100%"
		className={cx('vx-popover-layer', useThemeScheme() === 'dark' && 'ns-dark')}
	>
		{(props.lightDismiss ?? false) && <gridlayout
			width="100%"
			height="100%"
			backgroundColor={"transparent" as any}
			className="vx-popover-backdrop"
			onTap={() => props.onDismiss?.()}
		/>}
		<gridlayout
			ref={panelRef}
			left={props.x ?? 0}
			top={props.y ?? 0}
			accessibilityLabel={props.accessibilityLabel}
			className={cx('vx-popover', props.className)}
			style={props.style}
		>
			<LayerDepthProvider value={props.layerDepth ?? 0}><SizeProvider value={null}>{props.children}</SizeProvider></LayerDepthProvider>
		</gridlayout>
	</absolutelayout>
}

/** Mounts the fixed-position layer on the enclosing RootLayout. */
function FixedLayerMount(props: FixedSurfaceProps & { open?: boolean }) @{
	const dismissal = useLayerDismissal({ get active() { return !!props.open }, isPresent: () => !!shown.current, dismiss: () => props.onDismiss?.(), get behavior() { return (props.dismissOnEscape ?? props.lightDismiss) ? 'close' : 'block' } });
	const sentinel = useRef<any>(null);
	const [portalHost, setPortalHost] = useState<GridLayout | null>(null);
	const shown = useRef<{ host: GridLayout; lifetime: ReturnType<typeof createOverlayLifetime> } | null>(null);
	const dismiss = useRef(props.onDismiss);
	dismiss.current = props.onDismiss;

	useEffect(() => {
		const current = shown.current;
		if (!props.open) {
			current?.lifetime.close();
			return;
		}

		const rl = rootLayoutFor(sentinel.current);
		if (!rl) return;

		if (current) return;

		const host = new GridLayout();
		const unbindTheme = applyThemeClasses(host, 'vx-layer-host');
		host.horizontalAlignment = 'stretch';
		host.verticalAlignment = 'stretch';
		const lifetime = createOverlayLifetime(rl, host, null, 'Layer', (dismissed) => {
			if (shown.current?.host === host) {
				shown.current = null;
				setPortalHost(null);
			}
			if (dismissed) dismiss.current?.();
		});

		lifetime.own(unbindTheme);
		shown.current = { host, lifetime };
		setPortalHost(host);
		lifetime.open();
	}, [props.open, props.children, props.x, props.y, props.lightDismiss, props.className, props.style, props.ios, props.android]);

	useEffect(() => () => shown.current?.lifetime.close(), []);

	<>
		<stacklayout ref={(v: any) => { sentinel.current = v; }} style={{ width: 0, height: 0 }} />
		{props.open && portalHost
			? createPortal(
				<FixedLayerSurface
					{...props}
					layerDepth={dismissal.depth}
					onDismiss={() => { if (dismissal.shouldClose()) dismiss.current?.(); }}
				/>,
				portalHost,
			)
			: null}
	</>
}

/**
 * Anchored-layer primitive (Astryx `useLayer`), iOS/Android leaf. Context
 * mode delegates to `Popover` — JS measure/flip placement on the page's
 * RootLayout, not CSS anchor positioning. Logical sides and horizontal alignment use the anchor's effective OS direction. Fixed mode positions at page-coordinate x/y. The
 * fixed mode uses a portal in the declaring root and preserves its context.
 */
export function useLayer<O extends LayerOptions>(
	options: O,
): O extends FixedLayerOptions ? FixedLayerReturn : ContextLayerReturn @{
	const fixed = options.mode === 'fixed';
	const id = useId();
	const [uncontrolled, setIsOpen] = useState(false);
	const isOpen = options.isOpen ?? uncontrolled;
	const controlled = options.isOpen !== undefined;
	const openRef = useRef(false);
	const anchor = useRef<{ current: any }>({ current: null });
	openRef.current = isOpen;
	const onShow = useRef(options.onShow);
	onShow.current = options.onShow;
	const onHide = useRef(options.onHide);
	onHide.current = options.onHide;

	const show = useCallback(() => {
		if (openRef.current) return;
		if (!controlled) { openRef.current = true; setIsOpen(true); }
		onShow.current?.();
	}, [controlled]);

	const hide = useCallback(() => {
		if (!openRef.current) return;
		if (!controlled) { openRef.current = false; setIsOpen(false); }
		onHide.current?.();
	}, [controlled]);

	const ref = useCallback((el: any) => {
		anchor.current.current = el;
	}, []);

	const render = useCallback(
		(children: any, props?: ContextRenderProps | FixedRenderProps) => {
			if (fixed) {
				const p = (props ?? {}) as FixedRenderProps;
				return (
					<FixedLayerMount
						open={isOpen}
						x={p.x}
						y={p.y}
						lightDismiss={options.lightDismiss}
						dismissOnEscape={options.dismissOnEscape}
						onDismiss={hide}
						className={p.className}
						style={p.style}
						accessibilityLabel={p.accessibilityLabel}
						ios={p.ios}
						android={p.android}
					>
						{children}
					</FixedLayerMount>
				);
			}

			const p = (props ?? {}) as ContextRenderProps;
			if (p.positioning === 'custom') {
				return (
					<FixedLayerMount
						open={isOpen}
						lightDismiss={options.lightDismiss}
						dismissOnEscape={options.dismissOnEscape}
						onDismiss={hide}
						className={p.className}
						style={p.style}
						accessibilityLabel={p.accessibilityLabel}
						ios={p.ios}
						android={p.android}
					>
						{children}
					</FixedLayerMount>
				);
			}

			return (
				<PopoverWithLayerPosition
					open={isOpen}
					layerPosition={p}
					anchor={anchor.current}
					offset={layerOffset(p.offset)}
					dismissOnOutsideTap={options.lightDismiss === true}
					dismissOnEscape={options.dismissOnEscape ?? options.lightDismiss === true}
					onDismiss={hide}
					finalFocusRef={p.finalFocusRef}
					className={p.className}
					style={p.style}
					ios={{ accessibilityLabel: p.accessibilityLabel, ...p.ios }}
					android={{ accessibilityLabel: p.accessibilityLabel, ...p.android }}
				>
					{children}
				</PopoverWithLayerPosition>
			);
		},
		[fixed, isOpen, options.lightDismiss, options.dismissOnEscape, hide],
	);

	return (fixed
		? { ref: undefined, id, isOpen, show, hide, render }
		: { ref, anchorId: id, id, isOpen, show, hide, render }) as O extends FixedLayerOptions
		? FixedLayerReturn
		: ContextLayerReturn;
}
