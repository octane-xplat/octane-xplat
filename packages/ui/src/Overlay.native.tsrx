/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import { GridLayout, isAndroid, isIOS } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { OverlayProps } from './props';
import { cx } from './cx';
import { applyThemeClasses } from './theme/theme-scheme';
import { rootLayoutFor } from './root-layout.native';

function OverlayBody(props: { children?: any }) @{
	<>{props.children}</>
}

type OpenOverlay = { host: GridLayout; root: any; dismissOnClose: boolean; unbindTheme?: () => void };

/** Renders children in a separate RootLayout root above the current screen. */
export function Overlay(props: OverlayProps) @{
	const shown = useRef<OpenOverlay | null>(null);
	const hostView = useRef<any>(null);
	const dismiss = useRef(props.onDismiss);
	dismiss.current = props.onDismiss;

	const rootLayout = () => rootLayoutFor(hostView.current);

	useEffect(() => {
		const current = shown.current;
		if (!props.open) {
			if (!current) return;
			current.dismissOnClose = false;
			shown.current = null;
			const rl = rootLayout();
			if (rl && (rl as any)?.hasChild?.(current.host)) {
				rl.close(current.host).then(
					() => current.root.unmount?.(),
					(error) => { console.error('[Overlay] close failed', error); current.root.unmount?.(); },
				);
			} else current.root.unmount?.();

			return;
		}

		if (current) {
			current.root.render(OverlayBody as unknown as UniversalComponent, { children: props.children });
			current.unbindTheme = applyThemeClasses(current.host, cx('vx-overlay-host', props.className));
			if (props.style) Object.assign(current.host.style, props.style);
			Object.assign(current.host, isIOS ? props.ios : isAndroid ? props.android : undefined);
			return;
		}

		const rl = rootLayout();
		if (!rl) return;
		const host = new GridLayout();
		const unbindTheme = applyThemeClasses(host, cx('vx-overlay-host', props.className));
		host.horizontalAlignment = 'stretch';
		host.verticalAlignment = 'stretch';
		if (props.style) Object.assign(host.style, props.style);
		Object.assign(host, isIOS ? props.ios : isAndroid ? props.android : undefined);
		const root = createNativeScriptRoot(host);
		const opened = { host, root, dismissOnClose: true, unbindTheme };
		shown.current = opened;
		root.render(OverlayBody as unknown as UniversalComponent, { children: props.children });
		host.on('closed', () => {
			if (shown.current === opened) shown.current = null;
			opened.unbindTheme?.();
			root.unmount?.();
			if (opened.dismissOnClose) dismiss.current?.();
		});

		const open = () => rl.open(host, props.shadeCover ? {
			shadeCover: { opacity: 0.45, color: '#000000', tapToClose: true },
		} : {}).catch((error: unknown) => {
			if (shown.current === opened) shown.current = null;
			console.error('[Overlay] open failed', error);
			root.unmount?.();
		});

		if ((rl as any).hasChild?.(host)) {
			rl.close(host).then(open, (error) => console.error('[Overlay] stale host close failed', error));
		} else open();
	}, [props.open, props.children, props.shadeCover, props.className, props.style, props.ios, props.android]);

	<stacklayout ref={(v: any) => { hostView.current = v; }} style={{ width: 0, height: 0 }} />
}
