/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import { AbsoluteLayout, getRootLayout, GridLayout, isAndroid, isIOS } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { PopoverProps } from './props';
import { cx } from './cx';
import { getColorScheme } from './theme/colorScheme.native.tsrx';

function PopoverBody(props: { children?: any; left: number; top: number; className?: any; style?: any }) @{
	<absolutelayout>
		<gridlayout left={props.left} top={props.top} className={cx('vx-popover', props.className)} style={props.style}>
			{props.children}
		</gridlayout>
	</absolutelayout>
}

type OpenPopover = { host: GridLayout; root: any; left: number; top: number };

/** Anchors a separate RootLayout root to a NativeScript view in root-relative DIPs. */
export function Popover(props: PopoverProps) @{
	const shown = useRef<OpenPopover | null>(null);
	const anchorRef = props.anchor?.current ?? props.anchor;
	useEffect(() => {
		const current = shown.current;
		if (!props.open) {
			if (!current) return;
			shown.current = null;
			const rootLayout = getRootLayout();
			if ((rootLayout as any)?.hasChild?.(current.host)) {
				rootLayout.close(current.host).then(
					() => current.root.unmount?.(),
					(error) => { console.error('[Popover] close failed', error); current.root.unmount?.(); },
				);
			} else current.root.unmount?.();
			return;
		}
		const rootLayout = getRootLayout();
		if (!rootLayout || !anchorRef?.getLocationRelativeTo || !anchorRef?.getActualSize) return;
		const anchorPoint = anchorRef.getLocationRelativeTo(rootLayout);
		const size = anchorRef.getActualSize();
		const gap = 8;
		let left = anchorPoint.x;
		let top = anchorPoint.y + size.height + gap;
		if (props.placement === 'top') top = anchorPoint.y - 56;
		if (props.placement === 'left') { left = anchorPoint.x - 168; top = anchorPoint.y; }
		if (props.placement === 'right') { left = anchorPoint.x + size.width + gap; top = anchorPoint.y; }
		if (current) {
			current.left = left;
			current.top = top;
			current.root.render(PopoverBody as unknown as UniversalComponent, {
				children: props.children, left, top, className: props.className, style: props.style,
			});
			return;
		}

		const host = new GridLayout();
		host.className = cx('vx-popover-host', getColorScheme() === 'dark' && 'ns-dark');
		host.horizontalAlignment = 'stretch';
		host.verticalAlignment = 'stretch';
		Object.assign(host, isIOS ? props.ios : isAndroid ? props.android : undefined);
		const root = createNativeScriptRoot(host);
		const opened = { host, root, left, top };
		shown.current = opened;
		root.render(PopoverBody as unknown as UniversalComponent, {
			children: props.children, left, top, className: props.className, style: props.style,
		});
		const open = () => rootLayout.open(host).catch((error: unknown) => {
			if (shown.current === opened) shown.current = null;
			console.error('[Popover] open failed', error);
			root.unmount?.();
		});
		if ((rootLayout as any).hasChild?.(host)) {
			rootLayout.close(host).then(open, (error) => console.error('[Popover] stale host close failed', error));
		} else open();
	}, [props.open, props.anchor, props.placement, props.children, props.className, props.style, props.ios, props.android]);
	<></>
}
