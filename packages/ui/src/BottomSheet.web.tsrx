import { LayerDepthContext, LayerDepthProvider } from './layer-dismissal.tsrx';
import { createPortal, useContext, useEffect, useMemo, useRef, useState } from 'octane';
import type { BottomSheetProps, BottomSheetSwitcherProps } from './props';
import {
	BottomSheetSwitcherContext,
	BottomSheetSwitcherProvider,
	type BottomSheetRegistration,
	type BottomSheetSwitcherHandle,
} from './bottom-sheet-context';

import { cx } from './cx';
import { useThemeScheme } from './theme/theme-scheme';
import { normalizeSnapPoints } from './sheet-snap';
import { attachSheetDetents } from './sheet-detents.web';
import { isolateModalFocus } from './modal-focus.web';
import { applyEscapeProps } from './escape-props';

const BASE_SCRIM = 0.4;

function sheetHeightStyle(height: BottomSheetProps['height'], snapCount: number): Record<string, any> {
	if (height == null || height === 'capped') {
		// 'capped' = 62dvh (Astryx budget). With snap points the detents
		// controller sizes the panel to the largest stop instead.
		return snapCount ? {} : { height: '62dvh' };
	}

	if (height === 'hug') {
		return snapCount ? {} : { maxHeight: '92dvh' };
	}

	if (height === 'tall') {
		return snapCount ? {} : { height: '92dvh' };
	}

	return { height: typeof height === 'number' ? `${height}px` : height };
}

/** The shared bottom panel: scrim (when modal), grabber + snap/swipe
 *  gestures, focus isolation, Escape discipline per `purpose`. Renders
 *  `panel` — the active sheet's children for a switcher, or the
 *  declarative sheet's own children standalone. */
function BottomSheetLayer(props: {
	sheet: BottomSheetProps;
	panel: any;
	onDismiss: () => void;
}) @{
	const { sheet, panel } = props;
	const layerDepth = useContext(LayerDepthContext);
	const dark = useThemeScheme() === 'dark';
	const layer = useRef<HTMLDivElement | null>(null);
	const panelEl = useRef<HTMLDivElement | null>(null);
	const backdrop = useRef<HTMLDivElement | null>(null);
	const dismiss = useRef(props.onDismiss);
	dismiss.current = props.onDismiss;
	const hasScrim = sheet.hasScrim ?? true;
	const purpose = sheet.purpose ?? 'info';

	const snapPoints = useMemo(
		() => normalizeSnapPoints(sheet.snapPoints, typeof window === 'undefined' ? 0 : window.innerHeight),
		[JSON.stringify(sheet.snapPoints ?? [])],
	);

	const snapKey = snapPoints.join(',');

	// Focus isolation + Escape discipline only for the modal presentation.
	useEffect(() => {
		if (!hasScrim || !layer.current || !panelEl.current) {
			return;
		}

		return isolateModalFocus(layer.current, panelEl.current, () => {
			if ((sheet.purpose ?? 'info') !== 'required') {
				dismiss.current();
			}
		}, layerDepth);
	}, [hasScrim, purpose]);

	useEffect(() => {
		const el = panelEl.current;
		if (!el) return;
		const ctl = attachSheetDetents(el, snapPoints, () => dismiss.current(), {
			dismissible: purpose !== 'required',
			swipeOnly: !snapPoints.length,
			onOffset: (offset, vh) => {
				const shade = backdrop.current;
				if (shade) {
					shade.style.opacity = String(Math.max(0, BASE_SCRIM * (1 - offset / vh)));
				}
			},
		});

		return () => ctl.detach();
	}, [snapKey, purpose]);

	<div ref={layer} className={cx('vx-sheet-layer', 'vx-bottom-sheet-layer', dark && 'dark')}>
		{hasScrim && (
			<div
				ref={backdrop}
				className="vx-sheet-backdrop"
				style={{ opacity: BASE_SCRIM }}
				onClick={() => {
					if (purpose === 'info') {
						dismiss.current();
					}
				}}
			/>
		)}
		<div
			ref={(el: any) => {
				panelEl.current = el;
				applyEscapeProps(el, sheet);
			}}
			id={sheet.id}
			className={cx('vx-sheet', 'vx-bottom-sheet', sheet.className)}
			role={hasScrim ? 'dialog' : 'region'}
			aria-modal={hasScrim ? true : undefined}
			aria-label={sheet.label}
			style={{
				...sheet.style,
				...sheetHeightStyle(sheet.height, snapPoints.length),
				// Parked below the viewport until the gesture controller slides
				// the panel in (attachSheetDetents owns transform from then on).
				transform: 'translateY(100%)',
			}}
			{...sheet.web}
		>
			<LayerDepthProvider value={layerDepth + 1}>{panel}</LayerDepthProvider>
		</div>
	</div>
}

/** In-window bottom sheet (Astryx `BottomSheet`), web leaf. Standalone
 *  usage renders its own portal layer; inside `BottomSheetSwitcher` (with
 *  `sheetId`) it registers under the switcher's shared host and renders
 *  nothing on its own. */
export function BottomSheet(props: BottomSheetProps) @{
	const switcher = useContext(BottomSheetSwitcherContext);
	const registration: BottomSheetRegistration = {
		sheetId: props.sheetId ?? '',
		props,
	};

	useEffect(() => {
		if (props.sheetId == null) {
			return;
		}

		if (!switcher) {
			console.warn('[BottomSheet] sheetId is set but no BottomSheetSwitcher ancestor was found — the sheet renders nothing.');
			return;
		}

		switcher.register(registration);
		return () => switcher.unregister(registration.sheetId);
	}, [switcher, props.sheetId, props]);

	@if (props.sheetId != null) {
		<></>
	} @else {
		@if (props.isOpen) {
			<>{createPortal(
				<BottomSheetLayer
					sheet={props}
					panel={props.children}
					onDismiss={() => props.onOpenChange?.(false)}
				/>,
				document.body,
			)}</>
		}
	}
}

/** Shared host for a set of BottomSheet panels (Astryx
 *  `BottomSheetSwitcher`) — one layer, `activeSheet` picks which
 *  registered child renders inside it. */
export function BottomSheetSwitcher(props: BottomSheetSwitcherProps) @{
	const dark = useThemeScheme() === 'dark';
	const registry = useRef(new Map<string, BottomSheetRegistration>());
	const [version, bump] = useState(0);
	const activeId = props.activeSheet ?? null;
	const onChange = useRef(props.onActiveSheetChange);
	onChange.current = props.onActiveSheetChange;

	const handle: BottomSheetSwitcherHandle = useMemo(
		() => ({
			register(spec) {
				const prev = registry.current.get(spec.sheetId);
				registry.current.set(spec.sheetId, spec);
				if (prev !== spec) bump((v) => v + 1);
			},
			unregister(sheetId) {
				if (registry.current.delete(sheetId)) bump((v) => v + 1);
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

	const active = activeId != null ? registry.current.get(activeId) : undefined;
	void version;

	<BottomSheetSwitcherProvider value={handle}>
		{props.children}
		{active != null && (
			<>{createPortal(
				<BottomSheetLayer
					sheet={{ ...active.props, hasScrim: props.hasScrim ?? active.props.hasScrim }}
					panel={active.props.children}
					onDismiss={() => onChange.current?.(null)}
				/>,
				document.body,
			)}</>
		)}
	</BottomSheetSwitcherProvider>
}
