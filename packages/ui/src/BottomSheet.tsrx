/** @jsxImportSource @nativescript-community/octane */
import { useContext, useEffect, useMemo, useRef } from 'octane';
import { GridLayout, Screen, isAndroid, isIOS } from '@nativescript/core';
import { createNativeScriptRoot } from '@nativescript-community/octane';
import type { UniversalComponent } from 'octane/universal';
import type { BottomSheetProps, BottomSheetSwitcherProps } from './props';
import {
	BottomSheetSwitcherContext,
	BottomSheetSwitcherProvider,
	type BottomSheetRegistration,
	type BottomSheetSwitcherHandle,
} from './bottom-sheet-context';

import { createStore } from './store';
import { useStore } from './use-store.tsrx';
import { cx } from './cx';
import { applyThemeClasses } from './theme/theme-scheme';
import { rootLayoutFor } from './root-layout';
import { createOverlayLifetime } from './overlay-lifetime';
import { attachSheetDetents, type SheetDetentsController } from './sheet-detents';
import { normalizeSnapPoints } from './sheet-snap';
import { bindBottomInsetToKeyboard } from './keyboard-inset';
import { attachTapToBlur } from './tap-to-blur';

const screenVh = () => Screen.mainScreen.heightDIPs;

/** `height` budget → dips; null keeps the content-sized panel. */
function sheetHeightDips(height: BottomSheetProps['height'], vh: number): number | null {
	if (height == null || height === 'capped') {
		return vh * 0.62;
	}

	if (height === 'hug') {
		return null;
	}

	if (height === 'tall') {
		return vh * 0.92;
	}

	if (typeof height === 'number') {
		return height;
	}

	const trimmed = String(height).trim();
	if (trimmed.endsWith('%')) {
		return (parseFloat(trimmed) / 100) * vh;
	}

	return parseFloat(trimmed) || null;
}

/** The sheet's content — rendered inside the dedicated overlay root. */
function BottomSheetBody(props: { children?: any }) @{
	<>{props.children}</>
}

/** One open bottom-sheet host on a RootLayout: theme classes, bottom
 *  docking, grabber + snap/swipe gestures, keyboard lift, tap-to-blur.
 *  Shared by the declarative standalone and the imperative service. */
export function attachBottomSheetHost(
	host: GridLayout,
	props: {
		label?: string;
		height?: BottomSheetProps['height'];
		snapPoints?: BottomSheetProps['snapPoints'];
		purpose?: BottomSheetProps['purpose'];
		className?: any;
		style?: any;
		ios?: Record<string, any>;
		android?: Record<string, any>;
	},
	lifetime: ReturnType<typeof createOverlayLifetime>,
	closeNow: () => void,
): () => void {
	const purpose = props.purpose ?? 'info';
	host.horizontalAlignment = 'stretch';
	host.verticalAlignment = 'bottom';
	host.accessibilityLabel = props.label ?? '';
	if (props.style) Object.assign(host.style, props.style);
	Object.assign(host, isIOS ? props.ios : isAndroid ? props.android : undefined);

	const detentFractions = props.snapPoints?.length
		? normalizeSnapPoints(props.snapPoints, screenVh())
		: [];

	// Snap points fix the height to the largest stop; otherwise apply the
	// height budget (capped default keeps content from covering the screen).
	const sizedHeight = detentFractions.length ? null : sheetHeightDips(props.height, screenVh());
	if (sizedHeight != null) {
		host.height = sizedHeight;
	}

	const ctl: SheetDetentsController = attachSheetDetents(host, detentFractions, closeNow, {
		dismissible: purpose !== 'required',
		swipeOnly: true,
	});

	lifetime.own(ctl.detach);
	lifetime.own(bindBottomInsetToKeyboard(host));
	lifetime.own(attachTapToBlur(host));
	return () => ctl.enter();
}

/** Declarative in-window bottom sheet (Astryx `BottomSheet`), native leaf —
 *  RootLayout host + dedicated Octane root on the declaring component's
 *  RootLayout. With `sheetId` inside `BottomSheetSwitcher` it registers
 *  under the switcher's shared host instead. */
export function BottomSheet(props: BottomSheetProps) @{
	const switcher = useContext(BottomSheetSwitcherContext);
	const sentinel = useRef<any>(null);
	const shown = useRef<{
		host: GridLayout;
		root: any;
		lifetime: ReturnType<typeof createOverlayLifetime>;
	} | null>(null);

	const dismiss = useRef(props.onOpenChange);
	dismiss.current = props.onOpenChange;

	useEffect(() => {
		if (props.sheetId == null) {
			return;
		}

		if (!switcher) {
			console.warn('[BottomSheet] sheetId is set but no BottomSheetSwitcher ancestor was found — the sheet renders nothing.');
			return;
		}

		const spec = { sheetId: props.sheetId, props };
		switcher.register(spec);
		return () => switcher.unregister(spec.sheetId);
	}, [switcher, props.sheetId, props]);

	useEffect(() => {
		const cur = shown.current;
		if (props.sheetId != null || !props.isOpen) {
			cur?.lifetime.close();
			return;
		}

		const rl = rootLayoutFor(sentinel.current);
		if (!rl) return;

		if (cur) {
			cur.root.render(BottomSheetBody as unknown as UniversalComponent, { children: props.children });
			return;
		}

		const host = new GridLayout();
		const unbindTheme = applyThemeClasses(host, cx('vx-sheet-host', 'vx-bottom-sheet-host', props.className));
		const root = createNativeScriptRoot(host);
		const lifetime = createOverlayLifetime(rl, host, root, 'BottomSheet', (dismissed) => {
			if (shown.current?.host === host) shown.current = null;
			if (dismissed) dismiss.current?.(false);
		});

		lifetime.own(unbindTheme);
		const purpose = props.purpose ?? 'info';
		const hasScrim = props.hasScrim ?? true;
		const enter = attachBottomSheetHost(
			host,
			props,
			lifetime,
			() => {
				// User dismissal goes through RootLayout close → 'closed' →
				// lifetime reports dismissed → onOpenChange(false).
				const owner = host.parent as any;
				owner?.close?.(host)?.catch?.((error: unknown) => {
					console.error('[BottomSheet] close failed', error);
				});
			},
		);

		shown.current = { host, root, lifetime };
		root.render(BottomSheetBody as unknown as UniversalComponent, { children: props.children });
		lifetime.open(
			{
				...(hasScrim
					? { shadeCover: { opacity: 0.4, tapToClose: purpose === 'info' } }
					: {}),
			},
			() => enter(),
		);
	}, [
		props.isOpen,
		props.sheetId,
		props.children,
		props.className,
		props.style,
		props.hasScrim,
		props.purpose,
		props.height,
		JSON.stringify(props.snapPoints ?? []),
		props.ios,
		props.android,
	]);

	useEffect(() => () => shown.current?.lifetime.close(), []);

	// Zero-size sentinel — the sheet resolves its owning RootLayout from the
	// declaring component's ancestry.
	<stacklayout ref={(v: any) => { sentinel.current = v; }} style={{ width: 0, height: 0 }} />
}

/** The active panel rendered inside the switcher's overlay root — reads
 *  the registration store (module-scope store crosses the root boundary;
 *  context does not). */
function SwitcherPanel(props: {
	store: ReturnType<typeof createStore<Map<string, BottomSheetRegistration>>>;
	host: GridLayout;
	activeSheet: string | null;
	hasScrim: boolean;
	requestDismiss: () => void;
}) @{
	const specs = useStore(props.store);
	const active = props.activeSheet != null ? specs.get(props.activeSheet) : undefined;

	useEffect(() => {
		const host = props.host;
		if (!host || !active) return;
		const detents = active.props.snapPoints?.length
			? normalizeSnapPoints(active.props.snapPoints, screenVh())
			: [];

		const ctl = attachSheetDetents(host, detents, props.requestDismiss, {
			dismissible: (active.props.purpose ?? 'info') !== 'required',
			swipeOnly: !detents.length,
		});

		// Size for this sheet: largest stop or the height budget.
		host.height = detents.length
			? detents[detents.length - 1] * screenVh()
			: (sheetHeightDips(active.props.height, screenVh()) ?? undefined) as any;

		host.accessibilityLabel = active.props.label;
		ctl.enter();
		return () => ctl.detach();
	}, [props.activeSheet, active]);

	<flexboxlayout flexDirection="column" className="vx-bottom-sheet-panel">
		{active?.props.children}
	</flexboxlayout>
}

/** Shared host for a set of BottomSheet panels (Astryx
 *  `BottomSheetSwitcher`), native leaf — one RootLayout host whose content
 *  is driven by a module-scope registration store. */
export function BottomSheetSwitcher(props: BottomSheetSwitcherProps) @{
	const sentinel = useRef<any>(null);
	const shown = useRef<{
		host: GridLayout;
		root: any;
		lifetime: ReturnType<typeof createOverlayLifetime>;
	} | null>(null);

	const onChange = useRef(props.onActiveSheetChange);
	onChange.current = props.onActiveSheetChange;
	const activeId = props.activeSheet ?? null;

	const specs = useMemo(() => createStore(new Map<string, BottomSheetRegistration>()), []);
	const handle: BottomSheetSwitcherHandle = useMemo(
		() => ({
			register(spec) {
				const next = new Map(specs.get());
				next.set(spec.sheetId, spec);
				specs.set(next);
			},
			unregister(sheetId) {
				const next = new Map(specs.get());
				if (next.delete(sheetId)) specs.set(next);
			},
			requestDismiss() {
				onChange.current?.(null);
			},
			activeSheet() {
				return props.activeSheet ?? null;
			},
		}),
		[],
	);

	useEffect(() => {
		const cur = shown.current;
		const active = activeId != null ? specs.get().get(activeId) : undefined;
		if (!active) {
			cur?.lifetime.close();
			return;
		}

		if (cur) {
			// Re-render the overlay root with the new active id — the store
			// subscription keeps the panel content live.
			cur.root.render(SwitcherPanel as unknown as UniversalComponent, {
				store: specs,
				host: cur.host,
				activeSheet: activeId,
				hasScrim: props.hasScrim ?? true,
				requestDismiss: () => onChange.current?.(null),
			});

			return;
		}

		const rl = rootLayoutFor(sentinel.current);
		if (!rl) return;

		const host = new GridLayout();
		const unbindTheme = applyThemeClasses(host, cx('vx-sheet-host', 'vx-bottom-sheet-host', props.className));
		host.horizontalAlignment = 'stretch';
		host.verticalAlignment = 'bottom';
		const root = createNativeScriptRoot(host);
		const lifetime = createOverlayLifetime(rl, host, root, 'BottomSheetSwitcher', (dismissed) => {
			if (shown.current?.host === host) shown.current = null;
			if (dismissed) onChange.current?.(null);
		});

		lifetime.own(unbindTheme);
		lifetime.own(bindBottomInsetToKeyboard(host));
		lifetime.own(attachTapToBlur(host));
		shown.current = { host, root, lifetime };
		root.render(SwitcherPanel as unknown as UniversalComponent, {
			store: specs,
			host,
			activeSheet: activeId,
			hasScrim: props.hasScrim ?? true,
			requestDismiss: () => onChange.current?.(null),
		});

		lifetime.open({
			...((props.hasScrim ?? true)
				? { shadeCover: { opacity: 0.4, tapToClose: true } }
				: {}),
		});
	}, [activeId, props.hasScrim, props.className]);

	// Registrations also arrive while closed — no host needed until active.
	useEffect(() => () => shown.current?.lifetime.close(), []);

	<>
		<BottomSheetSwitcherProvider value={handle}>
			{props.children}
		</BottomSheetSwitcherProvider>
		<stacklayout ref={(v: any) => { sentinel.current = v; }} style={{ width: 0, height: 0 }} />
	</>
}
