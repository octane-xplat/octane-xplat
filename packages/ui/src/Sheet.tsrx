/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import { GridLayout, isAndroid, isIOS } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { SheetProps } from './props';
import { cx } from './cx';
import { applyThemeClasses } from './theme/theme-scheme';
import { rootLayoutFor } from './root-layout.mobile';
import { createOverlayLifetime } from './overlay-lifetime.mobile';
import { attachSheetDetents } from './sheet-detents';
import { bindBottomInsetToKeyboard } from './keyboard-inset.mobile';
import { attachTapToBlur } from './tap-to-blur';

function SheetBody(props: { children?: any }) @{
	<>{props.children}</>
}

/** In-window bottom sheet — a GridLayout host opened on the RootLayout
 *  enclosing the declaring component (rootLayoutFor sentinel walk), with a
 *  dedicated Octane root. Slide-in/out via RootLayout open animations. */
export function Sheet(props: SheetProps) @{
	const sentinel = useRef<any>(null);
	const shown = useRef<{
		host: GridLayout;
		root: any;
		lifetime: ReturnType<typeof createOverlayLifetime>;
	} | null>(null);

	const dismiss = useRef(props.onDismiss);
	dismiss.current = props.onDismiss;

	useEffect(() => {
		const cur = shown.current;
		if (!props.open) {
			cur?.lifetime.close();
			return;
		}

		const rl = rootLayoutFor(sentinel.current);
		if (!rl) return;

		if (cur) {
			cur.root.render(SheetBody as unknown as UniversalComponent, { children: props.children });
			return;
		}

		const host = new GridLayout();
		const unbindTheme = applyThemeClasses(host, cx('vx-sheet-host', props.className));
		host.horizontalAlignment = 'stretch';
		host.verticalAlignment = 'bottom';
		if (props.style) Object.assign(host.style, props.style);
		Object.assign(host, isIOS ? props.ios : isAndroid ? props.android : undefined);
		const root = createNativeScriptRoot(host);
		const lifetime = createOverlayLifetime(rl, host, root, 'Sheet', (dismissed) => {
			if (shown.current?.host === host) shown.current = null;
			if (dismissed) dismiss.current?.();
		});

		lifetime.own(unbindTheme);
		// Detents: the controller owns enter/slide-out — RootLayout's open
		// animation always lands translateY at 0, which would fight the
		// detent offsets, so it's skipped while detents are attached.
		const detents = props.detents?.length
			? attachSheetDetents(host, props.detents, () => {
					const owner = host.parent as any;
					owner?.close?.(host)?.catch?.((error: unknown) => {
						console.error('[Sheet] close failed', error);
					});
				})
			: null;

		// Lift the host above the software keyboard (todo 'Add' row inside a
		// demo sheet is bottom-anchored and was covered on iOS).
		lifetime.own(bindBottomInsetToKeyboard(host));
		lifetime.own(attachTapToBlur(host));
		if (detents) lifetime.own(detents.detach);
		shown.current = { host, root, lifetime };
		root.render(SheetBody as unknown as UniversalComponent, { children: props.children });

		lifetime.open({
			...(props.shadeCover ?? true)
				? { shadeCover: { opacity: 0.4, tapToClose: true } }
				: {},
			...(detents
				? {}
				: {
						animation: {
							enterFrom: { translateY: 400, duration: 250 },
							exitTo: { translateY: 400, duration: 200 },
						},
					}),
		}, () => detents?.enter());
	}, [props.open, props.children, props.className, props.style, props.shadeCover, props.ios, props.android]);

	useEffect(() => () => shown.current?.lifetime.close(), []);

	// Zero-size sentinel — the sheet resolves its owning RootLayout from the
	// declaring component's ancestry, not getRootLayout() (first-mounted shell).
	<stacklayout ref={(v: any) => { sentinel.current = v; }} style={{ width: 0, height: 0 }} />
}
