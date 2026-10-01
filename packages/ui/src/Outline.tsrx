/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef, useState } from 'octane';
import type { OutlineProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { useColorScheme } from './theme/colorScheme';
import { accentColor, mutedColor, textColor } from './scheme-colors';
import { nativeColor } from './native-color';
import { findViewById } from './outline-view-tree';

const DEFAULT_LABEL = 'Table of contents';
const SPY_EDGE = 8;

/** Find the nearest enclosing scroll container (ScrollView/ListView) walking
 *  up the view tree. */
function findScroller(view: any): any {
	let node = view?.parent
	while (node) {
		if (typeof node.scrollToVerticalOffset === 'function' || node.verticalOffset !== undefined) {
			return node
		}

		node = node.parent
	}

	return null
}

/** Outline — native leaf. Per-item active bars replace the web's sliding
 *  indicator (no CSS transition on a shared indicator element). Scroll spy
 *  listens to the resolved ScrollView's 'scroll' event and activates the
 *  last heading above the offset edge; activation calls
 *  `scrollToVerticalOffset`. */
export function Outline(props: OutlineProps) @{
	const items = props.items ?? [];
	const label = props.label ?? DEFAULT_LABEL;
	const density = props.density ?? 'default';
	const offset = props.offset ?? 0;
	const hasScrollOnClick = props.hasScrollOnClick ?? true;
	const scheme = useColorScheme();

	const controlled = props.activeId !== undefined;
	const [internalActive, setInternalActive] = useState<string | undefined>(items[0]?.id);
	const activeId = controlled ? props.activeId : internalActive;
	const activeIdRef = useRef<string | undefined>(activeId);
	activeIdRef.current = activeId;

	const navRef = useRef<any>(null);
	const navigating = useRef<string | undefined>(undefined);
	const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

	const setActive = (id: string) => {
		if (!controlled) setInternalActive(id);
		props.onActiveIdChange?.(id);
	};

	const containerView = () =>
		props.scrollContainerRef?.current ?? findScroller(navRef.current);

	// Scroll spy — uncontrolled only. The scroller emits 'scroll' (NS
	// ScrollView) with scrollOffset; ListView lacks it, so polling-less
	// listeners only attach when the event exists.
	useEffect(() => {
		if (controlled || items.length === 0) return;
		const scroller = containerView();
		if (!scroller?.on) return;
		const spy = () => {
			const scrollY = Number(scroller.verticalOffset ?? scroller.scrollOffset?.vertical ?? 0);
			const edge = scrollY + offset + SPY_EDGE;
			let current = items[0]?.id;
			for (const item of items) {
				const heading = findViewById(scroller, item.id);
				const top = heading ? (heading.getLocationRelativeTo?.(scroller)?.y ?? 0) + scrollY : null;
				if (top != null && top <= edge) current = item.id;
			}

			if (current && current !== activeIdRef.current) setActive(current);
		};

		scroller.on('scroll', spy);
		spy();
		return () => scroller.off?.('scroll', spy);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [controlled, items, offset]);

	const settle = (id: string) => {
		if (settleTimer.current !== undefined) clearTimeout(settleTimer.current);
		settleTimer.current = setTimeout(() => {
			if (navigating.current === id) {
				navigating.current = undefined;
				props.onNavigateEnd?.(id);
			}
		}, 150);
	};

	const activate = (id: string) => {
		setActive(id);
		navigating.current = id;
		props.onNavigateStart?.(id);
		const scroller = containerView();
		const heading = scroller ? findViewById(scroller, id) : null;
		if (hasScrollOnClick && scroller && heading) {
			const scrollY = Number(scroller.verticalOffset ?? 0);
			const rel = heading.getLocationRelativeTo?.(scroller);
			const top = rel ? rel.y + scrollY - offset : scrollY;
			try {
				scroller.scrollToVerticalOffset?.(Math.max(0, top), true);
			} catch {
				scroller.scrollToVerticalOffset?.(Math.max(0, top), false);
			}
		}

		settle(id);
	};

	<flexboxlayout
		ref={(v: any) => {
			navRef.current = v;
			applyEscapeProps(v, props);
		}}
		id={props.id}
		className={cx('vx-outline', `vx-outline--${density}`, props.className)}
		style={{ flexDirection: 'column', ...props.style }}
		flexDirection="column"
		accessible={true}
		accessibilityRole={nativeAccessibilityRole('none') as any}
		accessibilityLabel={label}
	>
		{items.map((item) => {
			const isActive = item.id === activeId;
			return (
				<flexboxlayout
					key={item.id}
					className={cx('vx-outline-item', isActive && 'vx-outline-item--active')}
					flexDirection="row"
					alignItems="center"
					style={{
						paddingLeft: 8 + (item.level - 1) * 12,
						paddingTop: density === 'compact' ? 4 : 8,
						paddingBottom: density === 'compact' ? 4 : 8,
					}}
					accessible={true}
					accessibilityRole={nativeAccessibilityRole('button') as any}
					accessibilityLabel={item.label}
					accessibilityState={nativeAccessibilityState({ selected: isActive }) as any}
					onTap={() => activate(item.id)}
				>
					<flexboxlayout
						className="vx-outline-item-bar"
						style={{
							width: 2,
							height: 16,
							borderRadius: 1,
							backgroundColor: isActive ? nativeColor(accentColor(scheme)) : nativeColor('transparent'),
							marginRight: 8,
						}}
					/>
					<label
						className="vx-outline-item-label"
						whiteSpace="normal"
						style={{ fontSize: 13, color: nativeColor(isActive ? textColor(scheme) : mutedColor(scheme)) }}
					>
						{item.label}
					</label>
				</flexboxlayout>
			);
		})}
	</flexboxlayout>
}
