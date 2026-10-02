/** @jsxImportSource @nativescript-community/octane */
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx';
import { useEffect, useRef, useState } from 'octane';
import { GridLayout, isIOS, Screen } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { PopoverProps } from './props';
import { applyNativeProps } from './platformProps';
import { cx } from './cx';
import { layerOffset, nativeLayerRTL, positionPopover, resolveLayerAlignment, resolveLayerSide, type PopoverPosition } from './popover-position';
import { applyThemeClasses, useThemeScheme } from './theme/theme-scheme';
import { rootLayoutFor } from './root-layout';
import { createOverlayLifetime } from './overlay-lifetime';
import { relativePosition } from './relative-position';

function PopoverLayer(props: PopoverProps & { anchorView: any; layerDepth: number }) @{
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
			style={props.style}
			onLoaded={update}
			onLayoutChanged={update}
		>
			<LayerDepthProvider value={props.layerDepth}>{props.children}</LayerDepthProvider>
		</gridlayout>
	</absolutelayout>
}

/** Positions popover content in a layer on the current page's RootLayout —
 *  the universal driver has no createPortal, so this is imperative like
 *  Overlay: a transparent host opened on the RootLayout enclosing the
 *  anchor, with PopoverLayer positioning itself over the anchor's rect. */
export function Popover(props: PopoverProps) @{
	const dismissal = useLayerDismissal({ get active() { return !!props.open }, isPresent: () => !!shown.current, getFocusTarget: () => props.finalFocusRef?.current, dismiss: () => props.onDismiss?.(), get behavior() { return props.dismissOnEscape === false ? 'block' : 'close' } });
	const shown = useRef<{ host: any; root: any; lifetime: ReturnType<typeof createOverlayLifetime> } | null>(null);

	const dismiss = useRef(props.onDismiss);
	dismiss.current = props.onDismiss;

	useEffect(() => {
		const cur = shown.current;
		if (!props.open) {
			cur?.lifetime.close();
			return;
		}

		const anchor = props.anchor?.current;
		const rl = rootLayoutFor(anchor);
		if (!anchor || !rl) return;

		if (cur) {
			cur.root.render(PopoverLayer as unknown as UniversalComponent, { ...props, anchorView: anchor, layerDepth: dismissal.depth, onDismiss: () => { if (dismissal.shouldClose()) dismiss.current?.(); } });
			return;
		}

		const host = new GridLayout();
		const unbindTheme = applyThemeClasses(host, 'vx-popover-host');
		host.horizontalAlignment = 'stretch';
		host.verticalAlignment = 'stretch';
		const root = createNativeScriptRoot(host);
		const lifetime = createOverlayLifetime(rl, host, root, 'Popover', (dismissed) => {
			if (shown.current?.host === host) shown.current = null;
			if (dismissed) dismiss.current?.();
		});

		lifetime.own(unbindTheme);
		shown.current = { host, root, lifetime };
		root.render(PopoverLayer as unknown as UniversalComponent, { ...props, anchorView: anchor, layerDepth: dismissal.depth, onDismiss: () => { if (dismissal.shouldClose()) dismiss.current?.(); } });
		lifetime.open();
	}, [props.anchor?.current, props.layerPosition, props.open, props.children, props.placement, props.offset, props.alignment, props.className, props.style, props.dismissOnOutsideTap]);

	useEffect(() => () => shown.current?.lifetime.close(), []);

	<></>
}
