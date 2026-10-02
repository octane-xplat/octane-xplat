/** @jsxImportSource @nativescript-community/octane */
import { LayerDepthProvider, useLayerDismissal } from './layer-dismissal.tsrx';
import { useCallback, useEffect, useId, useRef, useState } from 'octane';
import type {
	ContextLayerReturn,
	ContextRenderProps,
	FixedLayerOptions,
	FixedLayerReturn,
	FixedRenderProps,
	LayerOptions,
} from './props';

import { cx } from './cx';
import { layerOffset, nativeLayerRTL, positionPopover, resolveLayerAlignment, resolveLayerSide } from './popover-position';

const host = () => (globalThis as any).__xplatAppKit ?? {};

function LayerPanel(props: { body?: any; className?: any; style?: any; label?: string; layerDepth?: number }) @{
	<flexboxlayout
		flexDirection="column"
		className={cx('vx-popover', props.className)}
		style={props.style}
		accessibilityLabel={props.label}
	>
		<LayerDepthProvider value={props.layerDepth ?? 0}>{props.body}</LayerDepthProvider>
	</flexboxlayout>
}

function LayerContentUpdate(props: { sync: () => void; body: any; surface?: ContextRenderProps | FixedRenderProps; open: boolean }) @{
	useEffect(() => { props.sync(); }, [props.sync, props.open, props.body, props.surface]);
	return null;
}

/**
 * Anchored-layer primitive (Astryx `useLayer`), native-default/macOS leaf.
 * The AppKit host bridge presents a self-drawn in-window view (`showLayer`).
 * Context mode measures the ref view; fixed/custom use top-left window points. The panel is a separate
 * Octane root; `render` passes updated content and surface props to that root
 * while the layer is open. Context from the declaring tree is not shared.
 */
export function useLayer<O extends LayerOptions>(
	options: O,
): O extends FixedLayerOptions ? FixedLayerReturn : ContextLayerReturn @{
	const fixed = options.mode === 'fixed';
	const id = useId();
	const [isOpen, setIsOpen] = useState(false);
	const openRef = useRef(false);
	const anchorEl = useRef<any>(null);
	const markerEl = useRef<any>(null);
	const content = useRef<any>(null);
	const renderProps = useRef<ContextRenderProps | FixedRenderProps | undefined>(undefined);
	const popup = useRef<any>(null);
	const onShow = useRef(options.onShow);
	onShow.current = options.onShow;
	const onHide = useRef(options.onHide);
	onHide.current = options.onHide;

	const dismissal = useLayerDismissal({ get active() { return (options.isOpen ?? isOpen) && typeof host().showLayer === 'function' }, isPresent: () => !!popup.current && !popup.current.closed, dismiss: () => hide(), get behavior() { return (options.dismissOnEscape ?? options.lightDismiss) ? 'close' : 'block' } });

	const controlled = options.isOpen !== undefined;
	const visible = options.isOpen ?? isOpen;
	const controlledOpen = useRef(options.isOpen);
	controlledOpen.current = options.isOpen;
	const position = (surface: ContextRenderProps | FixedRenderProps | undefined) => (anchor: any, panel: any, viewport: any) => {
		const p = (surface ?? {}) as ContextRenderProps;
		if (fixed || p.positioning === 'custom') {
			const fx = surface as FixedRenderProps | undefined;
			const x = fixed ? fx?.x ?? 0 : p.style?.left ?? 0;
			const y = fixed ? fx?.y ?? 0 : p.style?.top ?? 0;
			if (!Number.isFinite(x) || !Number.isFinite(y)) throw new TypeError('macOS custom layer left/top require finite window points');
			return { left: x, top: y };
		}

		const rtl = nativeLayerRTL(anchorEl.current);
		const side = resolveLayerSide(p.placement, rtl);
		return positionPopover(anchor, panel, viewport, side, layerOffset(p.offset), resolveLayerAlignment(p.alignment, side, rtl));
	};

	const sync = (present = controlledOpen.current ?? openRef.current) => {
		const p = renderProps.current;
		if (!present) { popup.current?.close(); popup.current = null; return; }
		const surface = { body: content.current, layerDepth: dismissal.depth, className: p?.className, style: p?.style, label: p?.accessibilityLabel };
		if (popup.current) { popup.current.update(surface, { position: position(p), lightDismiss: options.lightDismiss === true }); return popup.current; }
		const showLayer = host().showLayer;
		if (typeof showLayer !== 'function') return;
		const anchor = fixed ? markerEl.current : anchorEl.current;
		if (!anchor) return;
		popup.current = showLayer({ anchor, position: position(p), lightDismiss: options.lightDismiss === true,
			onClose: () => { if (dismissal.shouldClose()) hide(); }, component: LayerPanel, props: surface });

		return popup.current;
	};

	const show = useCallback(() => {
		if (visible || openRef.current || typeof host().showLayer !== 'function') return;
		if (!controlled) { if (!sync(true)) return; openRef.current = true; setIsOpen(true); }
		onShow.current?.();
	}, [visible, controlled, sync]);

	const hide = useCallback(() => {
		if (!(controlledOpen.current ?? openRef.current)) return;
		if (!controlled) { openRef.current = false; setIsOpen(false); }
		onHide.current?.();
	}, [visible, controlled]);

	useEffect(() => () => { openRef.current = false; popup.current?.close(); popup.current = null; }, []);

	const ref = useCallback((el: any) => {
		anchorEl.current = el;
	}, []);

	const render = useCallback(
		(children: any, props?: ContextRenderProps | FixedRenderProps) => {
			content.current = children;
			renderProps.current = props;
			// The layer mounts imperatively through the host bridge. The update
			// component adds no view; the fixed-mode marker
			// locates the owning AppKit view for the point anchor.
			return <>
				<LayerContentUpdate sync={sync} body={children} surface={props} open={visible} />
				{fixed && <flexboxlayout ref={(v: any) => { markerEl.current = v; }} style={{ width: 0, height: 0 }} />}
			</>;
		},
		[fixed, visible, sync],
	);

	return (fixed
		? { ref: undefined, id, isOpen: visible, show, hide, render }
		: { ref, anchorId: id, id, isOpen: visible, show, hide, render }) as O extends FixedLayerOptions
		? FixedLayerReturn
		: ContextLayerReturn;
}
