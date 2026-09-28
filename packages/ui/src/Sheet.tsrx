/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import { GridLayout, isAndroid, isIOS } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { SheetProps } from './props';
import { cx } from './cx';
import { applyThemeClasses } from './theme/theme-scheme';
import { rootLayoutFor } from './root-layout.mobile';
import { attachSheetDetents } from './sheet-detents';

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
		unbindTheme?: () => void;
		programmatic?: boolean;
		detach?: () => void;
	} | null>(null);

	useEffect(() => {
		const cur = shown.current;
		if (!props.open) {
			if (!cur) return;
			shown.current = null;
			cur.programmatic = true;
			cur.unbindTheme?.();
			cur.root.unmount?.();
			const owner = cur.host.parent as any;
			if (owner?.hasChild?.(cur.host)) {
				owner.close(cur.host).catch((error: unknown) => {
					console.error('[Sheet] close failed', error);
				});
			}

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

		const opened = { host, root, unbindTheme, programmatic: false, detach: detents?.detach };
		shown.current = opened;
		root.render(SheetBody as unknown as UniversalComponent, { children: props.children });
		host.on('closed', () => {
			if (shown.current === opened) shown.current = null;
			opened.detach?.();
			opened.unbindTheme?.();
			opened.root.unmount?.();
			// 'closed' fires for programmatic closes too — onDismiss only when
			// the platform dismissed it (shade tap or detent drag-out).
			if (!opened.programmatic) props.onDismiss?.();
		});

		rl.open(host, {
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
		})
			.then(() => detents?.enter())
			.catch((error: unknown) => {
				if (shown.current === opened) shown.current = null;
				opened.unbindTheme?.();
				opened.root.unmount?.();
				console.error('[Sheet] open failed', error);
			});
	}, [props.open, props.children, props.className, props.style, props.shadeCover, props.ios, props.android]);

	// Zero-size sentinel — the sheet resolves its owning RootLayout from the
	// declaring component's ancestry, not getRootLayout() (first-mounted shell).
	<stacklayout ref={(v: any) => { sentinel.current = v; }} style={{ width: 0, height: 0 }} />
}
