/** @jsxImportSource @nativescript-community/octane */
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx';
import { SizeProvider } from './size-context';
import { useEffect, useRef, useState } from 'octane';
import { GridLayout, isIOS, Screen } from '@nativescript/core';
import { createPortal } from './native-portal';
import type { PopoverProps } from './props';
import type { PopoverInternalProps } from './internal-props';
import { applyNativeProps } from './platformProps';
import { cx } from '@octane-xplat/lib';
import { layerOffset, nativeLayerRTL, positionPopover, resolveLayerAlignment, resolveLayerSide, type PopoverPosition } from './popover-position';
import { useThemeScheme } from './theme/theme-scheme';
import { applyThemeClasses } from './theme/theme-host';
import { rootLayoutFor } from './root-layout';
import { createOverlayLifetime } from './overlay-lifetime';
import { relativePosition } from './relative-position';

function PopoverLayer(props: PopoverInternalProps & { anchorView: any; layerDepth: number }) @{
	const panelRef = useRef<any>(null);
	const [position, setPosition] = useState<PopoverPosition | null>(null);
	const [settled, setSettled] = useState(false);
	const update = () => {
		const anchor = props.anchorView;
		const coordinateRoot = anchor?.page?.content;
		if (!anchor || !coordinateRoot?.getActualSize) return;
		const point = relativePosition(anchor, coordinateRoot);
		const anchorSize = anchor.getActualSize();
		const panelSize = panelRef.current?.getActualSize?.();
		if (!point || !anchorSize) return;
		const rtl = nativeLayerRTL(anchor);
		const side = props.layerPosition ? resolveLayerSide(props.layerPosition.placement, rtl) : props.placement ?? 'bottom';
		const next = positionPopover(
			{
				left: point.x,
				top: point.y,
				width: anchorSize.width,
				height: anchorSize.height,
			},
			{ width: panelSize?.width ?? 0, height: panelSize?.height ?? 0 },
			{
				left: 0,
				top: 0,
				width: coordinateRoot.getActualSize().width,
				height: coordinateRoot.getActualSize().height,
			},
			side,
			layerOffset(props.offset ?? 8),
			props.layerPosition ? resolveLayerAlignment(props.layerPosition.alignment, side, rtl) : props.alignment ?? 'start',
		);

		const insets = isIOS ? panelRef.current?.parent?.getSafeAreaInsets?.() : undefined;
		const scale = isIOS ? Number(Screen.mainScreen.scale) || 1 : 1;
		const panelPosition = {
			...next,
			left: next.left - Number(insets?.left ?? 0) / scale,
			top: next.top - Number(insets?.top ?? 0) / scale,
		};

		setPosition((current) =>
			current?.left === panelPosition.left &&
			current?.top === panelPosition.top &&
			current?.placement === panelPosition.placement
				? current
				: panelPosition,
		);

		if (panelSize?.width > 0 && panelSize?.height > 0) setSettled(true);
	};

	useEffect(() => {
		const anchor = props.anchorView;
		if (!props.open || !anchor) return;
		const listeners: { view: any; event: string; handler: () => void }[] = [];
		let view = anchor;
		while (view) {
			for (const event of ['layoutChanged', 'scroll']) {
				const handler = () => update();
				view.on?.(event, handler);
				listeners.push({ view, event, handler });
			}

			view = view.parent;
		}

		update();
		return () => {
			for (const listener of listeners) {
				listener.view.off?.(listener.event, listener.handler);
			}
		};
	}, [props.layerPosition, props.open, props.anchorView, props.placement, props.offset, props.alignment, props.children, props.style]);

	useEffect(() => {
		if (position) {
			const panel = panelRef.current;
			const parent = panel?.parent;
			parent?.requestLayout?.();
		}
	}, [position]);

	useEffect(() => {
		applyNativeProps(panelRef.current, props);
	}, [props.ios, props.android, settled]);

	const dismiss = () => props.onDismiss?.();

	<absolutelayout
		width="100%"
		height="100%"
		className={cx('vx-popover-layer', useThemeScheme() === 'dark' && 'ns-dark')}
	>
		{(props.dismissOnOutsideTap ?? true) && <gridlayout
			width="100%"
			height="100%"
			backgroundColor={"transparent" as any}
			className="vx-popover-backdrop"
			onTap={dismiss}
		/>}
		<gridlayout
			ref={panelRef}
			left={position?.left ?? 0}
			top={position?.top ?? 0}
			opacity={settled ? 1 : 0}
			className={cx('vx-popover', props.className)}
			style={props.style as any}
			onLoaded={update}
			onLayoutChanged={update}
		>
			<LayerDepthProvider value={props.layerDepth}><SizeProvider value={null}>{props.children}</SizeProvider></LayerDepthProvider>
		</gridlayout>
	</absolutelayout>
}

/** Positions popover content in a portal hosted on the RootLayout enclosing
 *  the anchor. PopoverLayer positions itself over the anchor's rect. */
export function Popover(props: PopoverProps) @{
	const [internal, setInternal] = useState(props.defaultOpen ?? false);
	const [portalHost, setPortalHost] = useState<GridLayout | null>(null);
	const open = props.open ?? internal;
	const requestDismiss = () => {
		if (props.open === undefined) setInternal(false);
		props.onDismiss?.();
	};

	const dismissal = useLayerDismissal({ get active() { return !!open }, isPresent: () => !!shown.current, getFocusTarget: () => props.finalFocusRef?.current, dismiss: requestDismiss, get behavior() { return props.dismissOnEscape === false ? 'block' : 'close' } });
	const shown = useRef<{ host: GridLayout; lifetime: ReturnType<typeof createOverlayLifetime> } | null>(null);

	const dismiss = useRef(requestDismiss);
	dismiss.current = requestDismiss;

	useEffect(() => {
		const cur = shown.current;
		if (!open) {
			cur?.lifetime.close();
			return;
		}

		const anchor = props.anchor?.current;
		const rl = rootLayoutFor(anchor);
		if (!anchor || !rl) return;

		if (cur) {
			return;
		}

		const host = new GridLayout();
		const unbindTheme = applyThemeClasses(host, 'vx-popover-host');
		host.horizontalAlignment = 'stretch';
		host.verticalAlignment = 'stretch';
		const lifetime = createOverlayLifetime(rl, host, null, 'Popover', (dismissed) => {
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
	}, [props.anchor?.current, (props as PopoverInternalProps).layerPosition, open, props.children, props.placement, props.offset, props.alignment, props.className, props.style, props.dismissOnOutsideTap]);

	useEffect(() => () => shown.current?.lifetime.close(), []);

	<>
		{open && portalHost && props.anchor?.current
			? createPortal(
				<PopoverLayer
					{...props}
					open={open}
					anchorView={props.anchor.current}
					layerDepth={dismissal.depth}
					onDismiss={() => { if (dismissal.shouldClose()) dismiss.current?.(); }}
				/>,
				portalHost,
			)
			: null}
	</>
}
