/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useId, useRef, useState } from 'octane';
import { GridLayout } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type {
	ContextLayerReturn,
	ContextRenderProps,
	FixedLayerOptions,
	FixedLayerReturn,
	FixedRenderProps,
	LayerOptions,
} from './props';

import { Popover } from './Popover.tsrx';
import { applyNativeProps } from './platformProps';
import { applyThemeClasses, useThemeScheme } from './theme/theme-scheme';
import { cx } from './cx';
import { rootLayoutFor } from './root-layout';
import { createOverlayLifetime } from './overlay-lifetime';
import { layerOffset, resolveLayerSide } from './popover-position';

interface FixedSurfaceProps {
	/** Page-coordinate position in dips; consumer-authored styles carry it
	 *  under `positioning: 'custom'`. */
	x?: number
	y?: number
	lightDismiss?: boolean
	onDismiss?: () => void
	className?: any
	style?: any
	accessibilityLabel?: string
	ios?: Record<string, any>
	android?: Record<string, any>
	children?: any
}

/** Layer surface inside the overlay root — the Popover layout without
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
			{props.children}
		</gridlayout>
	</absolutelayout>
}

/** Mounts the fixed-position layer on the enclosing RootLayout — the
 *  zero-size sentinel locates the root; the layer renders in its own root
 *  above the page, the same machinery as `Overlay`/`Popover`. */
function FixedLayerMount(props: FixedSurfaceProps & { open?: boolean }) @{
	const sentinel = useRef<any>(null);
	const shown = useRef<{ host: any; root: any; lifetime: ReturnType<typeof createOverlayLifetime> } | null>(null);
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

		const surface = { ...props, onDismiss: () => dismiss.current?.() };
		if (current) {
			current.root.render(FixedLayerSurface as unknown as UniversalComponent, surface);
			return;
		}

		const host = new GridLayout();
		const unbindTheme = applyThemeClasses(host, 'vx-layer-host');
		host.horizontalAlignment = 'stretch';
		host.verticalAlignment = 'stretch';
		const root = createNativeScriptRoot(host);
		const lifetime = createOverlayLifetime(rl, host, root, 'Layer', (dismissed) => {
			if (shown.current?.host === host) shown.current = null;
			if (dismissed) dismiss.current?.();
		});

		lifetime.own(unbindTheme);
		shown.current = { host, root, lifetime };
		root.render(FixedLayerSurface as unknown as UniversalComponent, surface);
		lifetime.open();
	}, [props.open, props.children, props.x, props.y, props.lightDismiss, props.className, props.style, props.ios, props.android]);

	useEffect(() => () => shown.current?.lifetime.close(), []);

	<stacklayout ref={(v: any) => { sentinel.current = v; }} style={{ width: 0, height: 0 }} />
}

/**
 * Anchored-layer primitive (Astryx `useLayer`), iOS/Android leaf. Context
 * mode delegates to `Popover` — JS measure/flip placement on the page's
 * RootLayout, not CSS anchor positioning. Logical `start`/`end` read as
 * left/right (RTL mirroring is the consumer's responsibility — documented
 * on `LayerPlacement`). Fixed mode positions at page-coordinate x/y. The
 * layer is a separate Octane root: pass data as props, not context.
 */
export function useLayer<O extends LayerOptions>(
	options: O,
): O extends FixedLayerOptions ? FixedLayerReturn : ContextLayerReturn @{
	const fixed = options.mode === 'fixed';
	const id = useId();
	const [isOpen, setIsOpen] = useState(false);
	const openRef = useRef(false);
	const anchor = useRef<{ current: any }>({ current: null });
	const onShow = useRef(options.onShow);
	onShow.current = options.onShow;
	const onHide = useRef(options.onHide);
	onHide.current = options.onHide;

	const show = useCallback(() => {
		if (openRef.current) return;
		openRef.current = true;
		setIsOpen(true);
		onShow.current?.();
	}, []);

	const hide = useCallback(() => {
		if (!openRef.current) return;
		openRef.current = false;
		setIsOpen(false);
		onHide.current?.();
	}, []);

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
				<Popover
					open={isOpen}
					anchor={anchor.current}
					placement={resolveLayerSide(p.placement)}
					alignment={p.alignment ?? 'center'}
					offset={layerOffset(p.offset)}
					dismissOnOutsideTap={options.lightDismiss === true}
					onDismiss={hide}
					className={p.className}
					style={p.style}
					ios={{ accessibilityLabel: p.accessibilityLabel, ...p.ios }}
					android={{ accessibilityLabel: p.accessibilityLabel, ...p.android }}
				>
					{children}
				</Popover>
			);
		},
		[fixed, isOpen, options.lightDismiss, hide],
	);

	return (fixed
		? { ref: undefined, id, isOpen, show, hide, render }
		: { ref, anchorId: id, id, isOpen, show, hide, render }) as O extends FixedLayerOptions
		? FixedLayerReturn
		: ContextLayerReturn;
}
