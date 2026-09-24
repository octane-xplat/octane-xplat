/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import { getRootLayout, GridLayout, isAndroid, isIOS } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { OverlayProps } from './props';
import { cx } from './cx';
import { getColorScheme } from './theme/colorScheme.native.tsrx';

function OverlayBody(props: { children?: any }) @{
	<>{props.children}</>
}

type OpenOverlay = { host: GridLayout; root: any; dismissOnClose: boolean };

/** Renders children in a separate RootLayout root above the current screen. */
export function Overlay(props: OverlayProps) @{
	const shown = useRef<OpenOverlay | null>(null);
	const dismiss = useRef(props.onDismiss);
	dismiss.current = props.onDismiss;

	useEffect(() => {
		const current = shown.current;
		if (!props.open) {
			if (!current) return;
			current.dismissOnClose = false;
			shown.current = null;
			const rootLayout = getRootLayout();
			if ((rootLayout as any)?.hasChild?.(current.host)) {
				rootLayout.close(current.host).then(
					() => current.root.unmount?.(),
					(error) => { console.error('[Overlay] close failed', error); current.root.unmount?.(); },
				);
			} else current.root.unmount?.();
			return;
		}

		if (current) {
			current.root.render(OverlayBody as unknown as UniversalComponent, { children: props.children });
			current.host.className = cx('vx-overlay-host', getColorScheme() === 'dark' && 'ns-dark', props.className);
			if (props.style) Object.assign(current.host.style, props.style);
			Object.assign(current.host, isIOS ? props.ios : isAndroid ? props.android : undefined);
			return;
		}

		const rootLayout = getRootLayout();
		if (!rootLayout) return;
		const host = new GridLayout();
		host.className = cx('vx-overlay-host', getColorScheme() === 'dark' && 'ns-dark', props.className);
		host.horizontalAlignment = 'stretch';
		host.verticalAlignment = 'stretch';
		if (props.style) Object.assign(host.style, props.style);
		Object.assign(host, isIOS ? props.ios : isAndroid ? props.android : undefined);
		const root = createNativeScriptRoot(host);
		const opened = { host, root, dismissOnClose: true };
		shown.current = opened;
		root.render(OverlayBody as unknown as UniversalComponent, { children: props.children });
		host.on('closed', () => {
			if (shown.current === opened) shown.current = null;
			root.unmount?.();
			if (opened.dismissOnClose) dismiss.current?.();
		});
		const open = () => rootLayout.open(host, props.shadeCover ? {
			shadeCover: { opacity: 0.45, color: '#000000', tapToClose: true },
		} : {}).catch((error: unknown) => {
			if (shown.current === opened) shown.current = null;
			console.error('[Overlay] open failed', error);
			root.unmount?.();
		});
		if ((rootLayout as any).hasChild?.(host)) {
			rootLayout.close(host).then(open, (error) => console.error('[Overlay] stale host close failed', error));
		} else open();
	}, [props.open, props.children, props.shadeCover, props.className, props.style, props.ios, props.android]);

	<></>
}
