/** @jsxImportSource @nativescript-community/octane */
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
import { resolveLayerSide } from './popover-position';

const host = () => (globalThis as any).__xplatAppKit ?? {};

function LayerPanel(props: { body?: any; className?: any; style?: any; label?: string }) @{
	<flexboxlayout
		flexDirection="column"
		className={cx('vx-popover', props.className)}
		style={props.style}
		accessibilityLabel={props.label}
	>
		{props.body}
	</flexboxlayout>
}

/**
 * Anchored-layer primitive (Astryx `useLayer`), native-default/macOS leaf.
 * The AppKit host bridge presents the layer as a real anchored `NSPopover`
 * (`showAnchoredPopup`): context mode anchors on the `ref` view, fixed mode
 * anchors at a top-left-origin point via the `at` option. The panel is a separate
 * Octane root, so `render` snapshots its content at open — updates to the
 * declaring tree do not reach an open layer.
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

	const show = useCallback(() => {
		if (openRef.current || popup.current) return;
		const showPopup = host().showAnchoredPopup;
		if (typeof showPopup !== 'function') return;

		const reportClose = () => {
			popup.current = null;
			if (!openRef.current) return;
			openRef.current = false;
			setIsOpen(false);
			onHide.current?.();
		};

		const p = renderProps.current;
		const presented = fixed
			? (() => {
					const fx = (p ?? {}) as FixedRenderProps;
					if (!markerEl.current) return null;
					return showPopup({
						anchor: markerEl.current,
						at: { x: fx.x ?? 0, y: fx.y ?? 0 },
						placement: 'bottom',
						lightDismiss: options.lightDismiss === true,
						onClose: reportClose,
						component: LayerPanel,
						props: {
							body: content.current,
							className: fx.className,
							style: fx.style,
							label: fx.accessibilityLabel,
						},
					});
				})()
			: (() => {
					const cxp = (p ?? {}) as ContextRenderProps;
					if (!anchorEl.current) return null;
					return showPopup({
						anchor: anchorEl.current,
						placement: resolveLayerSide(cxp.placement),
						lightDismiss: options.lightDismiss === true,
						onClose: reportClose,
						component: LayerPanel,
						props: {
							body: content.current,
							className: cxp.className,
							style: cxp.style,
							label: cxp.accessibilityLabel,
						},
					});
				})();

		if (!presented) return;
		popup.current = presented;
		openRef.current = true;
		setIsOpen(true);
		onShow.current?.();
	}, [fixed, options.lightDismiss]);

	const hide = useCallback(() => {
		popup.current?.close?.();
		popup.current = null;
		if (!openRef.current) return;
		openRef.current = false;
		setIsOpen(false);
		onHide.current?.();
	}, []);

	useEffect(
		() => () => {
			popup.current?.close?.();
			popup.current = null;
		},
		[],
	);

	const ref = useCallback((el: any) => {
		anchorEl.current = el;
	}, []);

	const render = useCallback(
		(children: any, props?: ContextRenderProps | FixedRenderProps) => {
			content.current = children;
			renderProps.current = props;
			// The layer mounts imperatively through the host bridge — nothing
			// lands in the declaring tree except the fixed-mode marker, which
			// locates the owning AppKit view for the point anchor.
			if (!fixed) return null;
			return <flexboxlayout ref={(v: any) => { markerEl.current = v; }} style={{ width: 0, height: 0 }} />;
		},
		[fixed],
	);

	return (fixed
		? { ref: undefined, id, isOpen, show, hide, render }
		: { ref, anchorId: id, id, isOpen, show, hide, render }) as O extends FixedLayerOptions
		? FixedLayerReturn
		: ContextLayerReturn;
}
