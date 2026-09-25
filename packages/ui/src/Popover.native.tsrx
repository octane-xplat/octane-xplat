/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef, useState } from 'octane';
import { GridLayout } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { PopoverProps } from './props';
import { applyNativeProps } from './platformProps.native';
import { cx } from './cx';
import { positionPopover, type PopoverPosition } from './popover-position';
import { applyThemeClasses, useThemeScheme } from './theme/theme-scheme';
import { rootLayoutFor } from './root-layout.native';

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
			{props.children}
		</gridlayout>
	</absolutelayout>
}

/** Positions popover content in a layer on the current page's RootLayout —
 *  the universal driver has no createPortal, so this is imperative like
 *  Overlay: a transparent host opened on the RootLayout enclosing the
 *  anchor, with PopoverLayer positioning itself over the anchor's rect. */
export function Popover(props: PopoverProps) @{
	const shown = useRef<{ host: any; root: any; unbindTheme?: () => void } | null>(null);

	useEffect(() => {
		const cur = shown.current;
		if (!props.open) {
			if (!cur) return;
			shown.current = null;
			cur.unbindTheme?.();
			const owner = cur.host.parent as any;
			if (owner?.hasChild?.(cur.host)) {
				owner.close(cur.host).then(
					() => cur.root.unmount?.(),
					(error: any) => { console.error('[Popover] close failed', error); cur.root.unmount?.(); },
				);
			} else cur.root.unmount?.();
			return;
		}

		const anchor = props.anchor?.current;
		const rl = rootLayoutFor(anchor);
		if (!anchor || !rl) return;

		if (cur) {
			cur.root.render(PopoverLayer as unknown as UniversalComponent, { ...props, anchorView: anchor });
			return;
		}

		const host = new GridLayout();
		const unbindTheme = applyThemeClasses(host, cx('vx-popover-host', props.className));
		host.horizontalAlignment = 'stretch';
		host.verticalAlignment = 'stretch';
		const root = createNativeScriptRoot(host);
		shown.current = { host, root, unbindTheme };
		root.render(PopoverLayer as unknown as UniversalComponent, { ...props, anchorView: anchor });
		rl.open(host).catch((error: unknown) => {
			if (shown.current?.host === host) shown.current = null;
			console.error('[Popover] open failed', error);
			root.unmount?.();
		});
	}, [props.open, props.children, props.placement, props.className, props.style, props.dismissOnOutsideTap]);

	<></>
}
