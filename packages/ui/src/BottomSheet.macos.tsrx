/** @jsxImportSource @octane-xplat/macos-renderer */
import { useContext, useEffect, useMemo, useRef } from 'octane'
import type { BottomSheetProps, BottomSheetSwitcherProps } from './props'
import {
	BottomSheetSwitcherContext,
	BottomSheetSwitcherProvider,
	type BottomSheetRegistration,
	type BottomSheetSwitcherHandle,
} from './bottom-sheet-context'

import { createStore } from './store'
import { useStore } from './useStore.macos.tsrx'
import { cx } from './cx'

/** macOS coverage: the sheet renders inline when open — the AppKit target
 *  has no shared in-window layer service yet (same coverage class as the
 *  old Sheet leaf). Gestures/scrim are N/A inline. */
export function BottomSheet(props: BottomSheetProps) @{
	const switcher = useContext(BottomSheetSwitcherContext as any);

	useEffect(() => {
		if (props.sheetId == null || !switcher) return;
		const spec: BottomSheetRegistration = { sheetId: props.sheetId, props };
		switcher.register(spec);
		return () => switcher.unregister(spec.sheetId);
	}, [switcher, props.sheetId, props]);

	@if (props.sheetId == null && props.isOpen) {
		<flexboxlayout
			flexDirection="column"
			className={cx('vx-sheet', 'vx-bottom-sheet', props.className)}
			style={props.style}
		>
			{props.children}
		</flexboxlayout>
	}
}

export function BottomSheetSwitcher(props: BottomSheetSwitcherProps) @{
	const specs = useMemo(() => createStore(new Map<string, BottomSheetRegistration>()), []);
	const onChange = useRef<any>(null);
	onChange.current = props.onActiveSheetChange;
	const handle: BottomSheetSwitcherHandle = useMemo(() => ({
		register(spec) {
			const next = new Map(specs.get());
			next.set(spec.sheetId, spec);
			specs.set(next);
		},
		unregister(sheetId) {
			const next = new Map(specs.get());
			if (next.delete(sheetId)) specs.set(next);
		},
		requestDismiss() { onChange.current?.(null) },
		activeSheet() { return props.activeSheet ?? null },
	}), []);

	const registry = useStore(specs);
	const active = props.activeSheet != null ? registry.get(props.activeSheet) : undefined;

	<BottomSheetSwitcherProvider value={handle}>
		{props.children}
		{active != null && (
			<flexboxlayout flexDirection="column" className={cx('vx-sheet', 'vx-bottom-sheet')}>
				{active.props.children}
			</flexboxlayout>
		)}
	</BottomSheetSwitcherProvider>
}
