/** @jsxImportSource @nativescript-community/octane */
import { createPortal, useEffect, useRef, useState } from 'octane';
import type { PopoverProps } from './props';
import { applyNativeProps } from './platformProps.native';
import { cx } from './cx';
import { positionPopover, type PopoverPosition } from './popover-position';
import { getColorScheme } from './theme/colorScheme.native.tsrx';

function PopoverLayer(props: PopoverProps & { anchorView: any }) @{
	const panelRef = useRef<any>(null);
	const [position, setPosition] = useState<PopoverPosition | null>(null);
	const [settled, setSettled] = useState(false);
	const update = () => {
		const anchor = props.anchorView;
		const coordinateRoot = anchor?.page?.content;
		if (!anchor?.getLocationRelativeTo || !coordinateRoot?.getActualSize) return;
		const point = anchor.getLocationRelativeTo(coordinateRoot);
		const anchorSize = anchor.getActualSize();
		const panelSize = panelRef.current?.getActualSize?.();
		if (!point || !anchorSize) return;
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
			props.placement ?? 'bottom',
		);
		setPosition((current) =>
			current?.left === next.left &&
			current?.top === next.top &&
			current?.placement === next.placement
				? current
				: next,
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
	}, [props.open, props.anchorView, props.placement, props.children, props.style]);
	useEffect(() => {
		applyNativeProps(panelRef.current, props);
	}, [props.ios, props.android, settled]);
	const dismiss = () => props.onDismiss?.();
	<absolutelayout
		width="100%"
		height="100%"
		className={cx('vx-popover-layer', getColorScheme() === 'dark' && 'ns-dark')}
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
			{props.children}
		</gridlayout>
	</absolutelayout>
}

/** Positions popover content in a page-local native portal. */
export function Popover(props: PopoverProps) @{
	const [anchorView, setAnchorView] = useState<any>(props.anchor?.current ?? null);
	useEffect(() => {
		const next = props.anchor?.current ?? null;
		if (next !== anchorView) setAnchorView(next);
	}, [props.anchor, props.open, anchorView]);
	@if (props.open && anchorView) {
		<>{createPortal(<PopoverLayer {...props} anchorView={anchorView} />, anchorView)}</>
	}
}
