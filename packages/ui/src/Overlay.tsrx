/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import { GridLayout, isAndroid, isIOS } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { OverlayProps } from './props';
import { cx } from './cx';
import { applyThemeClasses } from './theme/theme-scheme';
import { rootLayoutFor } from './root-layout.mobile';
import { createOverlayLifetime } from './overlay-lifetime.mobile';

function OverlayBody(props: { children?: any }) @{
	<>{props.children}</>
}

type OpenOverlay = { host: GridLayout; root: any; lifetime: ReturnType<typeof createOverlayLifetime>; unbindTheme?: () => void };

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
			current?.lifetime.close();
			return;
		}

		if (current) {
			current.root.render(OverlayBody as unknown as UniversalComponent, { children: props.children });
			current.unbindTheme?.();
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
		const lifetime = createOverlayLifetime(rl, host, root, 'Overlay', (dismissed) => {
			if (shown.current?.host === host) shown.current = null;
			if (dismissed) dismiss.current?.();
		});
		const opened = { host, root, lifetime, unbindTheme };
		lifetime.own(() => opened.unbindTheme?.());
		shown.current = opened;
		root.render(OverlayBody as unknown as UniversalComponent, { children: props.children });
		lifetime.open(props.shadeCover ? {
			shadeCover: { opacity: 0.45, color: '#000000', tapToClose: true },
		} : {});
	}, [props.open, props.children, props.shadeCover, props.className, props.style, props.ios, props.android]);

	useEffect(() => () => shown.current?.lifetime.close(), []);

	<stacklayout ref={(v: any) => { hostView.current = v; }} style={{ width: 0, height: 0 }} />
}
