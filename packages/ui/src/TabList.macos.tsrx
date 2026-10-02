/** @jsxImportSource @octane-xplat/macos-renderer */
import { useContext, useEffect, useMemo, useRef, useState } from 'octane';
import type { TabListProps, TabProps, TabMenuProps } from './props';
import { cx } from './cx';

import { Icon } from './Icon.macos.tsrx';
import { Text } from './Text.macos.tsrx';
import { Popover } from './Popover.macos.tsrx';
import { Pressable } from './Pressable.macos.tsrx';
import { followHref } from './nav-href';
import { TabListContext,
	TabListProvider,
} from './nav-contexts';

export { TabListContext };
export { useTabListContext } from './nav-contexts';

const SIZE_HEIGHT: Record<string, number> = { sm: 28, md: 32, lg: 36 };

function navIcon(icon: any, size: number) {
	return typeof icon === 'string' ? <Icon name={icon} size={size} /> : icon;
}

/** TabList — tab strip providing TabListContext to Tab/TabMenu children.
 *  Native leaf: a horizontal flexbox row; `overflow` `auto`/`scroll` wraps it
 *  in a horizontal scroller and the selected tab is scrolled into view. The
 *  WAI-ARIA tablist pattern carries `tab` semantics to each stop; there's no
 *  composite-widget arrow model on pointer platforms. `role="tablist"`
 *  switches item semantics; the strip itself doesn't gain native grouping. */
export function TabList(props: TabListProps) @{
	const size = props.size ?? 'md';
	const overflow = props.overflow ?? 'auto';
	const layout = props.layout ?? 'hug';
	const hasScroll = overflow !== 'visible' && layout !== 'fill';
	const scroller = useRef<any>(null);
	const tabViews = useRef(new Map<string, any>());
	const views = tabViews.current;

	const ctx = useMemo(
		() => ({
			value: props.value,
			onChange: props.onChange,
			size,
			layout,
			pattern: props.role === 'tablist' ? ('tabs' as const) : ('nav' as const),
			// Internal: Tabs/Tab register their views so the list can scroll the
			// selected stop into view. Not part of the public context type.
			_tabViews: views,
		}),
		[props.value, props.onChange, size, layout, props.role],
	) as any;

	// Keep the selected tab visible when the value or the scroller changes.
	useEffect(() => {
		const sv = scroller.current;
		const view = views.get(props.value);
		if (!sv || !view) return;
		const vp = sv.getActualSize?.().width ?? 0;
		const offset = sv.horizontalOffset ?? 0;
		const start = view.originX ?? 0;
		const end = start + (view.getMeasuredWidth?.() ?? 0);
		if (start < offset) {
			sv.scrollToHorizontalOffset(start, true);
		} else if (vp > 0 && end > offset + vp) {
			sv.scrollToHorizontalOffset(end - vp, true);
		}
	}, [props.value]);

	const row = (
		<flexboxlayout
			className={cx('vx-tabstrip', props.isFullBleed && 'vx-tabstrip--bleed')}
			alignItems="flex-end"
		>
			{props.children}
		</flexboxlayout>
	);

	const cls = cx('vx-tablist', 'vx-tablist--' + size, layout === 'fill' && 'vx-tablist--fill', props.hasDivider && 'vx-tablist--divided', props.isFullBleed && 'vx-tablist--bleed', props.className);

	<TabListProvider value={ctx}>
		<flexboxlayout
			id={props.id}

			className={cls}
			style={props.style}
		>
			@if (hasScroll) {
				<scrollview orientation="horizontal" ref={(v: any) => { scroller.current = v; }} className="vx-tabstrip-scroll" scrollBarIndicatorVisible={false}>
					{row}
				</scrollview>
			} @else {
				row
			}
		</flexboxlayout>
	</TabListProvider>
}

/** Tab — a single stop in a TabList. Native leaf renders a Pressable;
 *  `href` activates through the deep-link/route table (`followHref`) in
 *  addition to reporting selection. */
export function Tab(props: TabProps) @{
	const ctx = useContext(TabListContext);
	if (ctx == null) {
		throw new Error('Tab must be used within a TabList.');
	}

	const isSelected = ctx.value === props.value;
	const isDisabled = props.isDisabled === true;
	const displayIcon = isSelected && props.selectedIcon != null ? props.selectedIcon : props.icon;
	const showLabel = !props.isLabelHidden && props.label !== '';

	const select = () => {
		if (isDisabled) return;
		props.onPress?.();
		if (props.href && ctx.pattern === 'nav') {
			followHref(props.href);
		}

		ctx.onChange(props.value);
	};

	<Pressable
		id={props.id}
		ref={(v: any) => { if (v) (ctx as any)._tabViews?.set(props.value, v); else (ctx as any)._tabViews?.delete(props.value); }}
		className={cx('vx-tab', isSelected && 'vx-tab--selected', ctx.layout === 'fill' && 'vx-tab--fill', props.className)}
		style={{ height: SIZE_HEIGHT[ctx.size], ...props.style }}
		disabled={isDisabled}
		accessibilityRole={isDisabled ? 'none' : (ctx.pattern === 'tabs' ? 'tab' : 'button')}
		accessibilityLabel={props.isLabelHidden ? props.label : undefined}
		accessibilityState={{ disabled: isDisabled, selected: isSelected }}
		onPress={select}
	>
		<flexboxlayout className="vx-tab-content" flexDirection="column" justifyContent="flex-end" alignItems="center">
			<flexboxlayout flexDirection="row" alignItems="center" justifyContent="center" gap={8}>
				{displayIcon != null ? navIcon(displayIcon, ctx.size === 'lg' ? 18 : ctx.size === 'sm' ? 14 : 16) : null}
				{showLabel ? <Text className="vx-tab-label">{props.label}</Text> : null}
				{props.endContent != null ? props.endContent : null}
			</flexboxlayout>
			<flexboxlayout className={cx('vx-tab-indicator', isSelected && 'vx-tab-indicator--on')} />
		</flexboxlayout>
	</Pressable>
}

/** TabMenu — overflow trigger inside a TabList. Native leaf opens the
 *  shared anchored Popover with menuitemradio-style rows. */
export function TabMenu(props: TabMenuProps) @{
	const ctx = useContext(TabListContext);
	if (ctx == null) {
		throw new Error('TabMenu must be used within a TabList.');
	}

	const anchor = useRef<any>(null);
	const [open, setOpen] = useState(false);
	const selected = props.options.find((o) => o.value === ctx.value);
	const triggerLabel = selected?.label ?? props.label;

	const pick = (value: string) => {
		ctx.onChange(value);
		setOpen(false);
	};

	<>
		<Pressable
			ref={(v: any) => { anchor.current = v; }}
			id={props.id}
			className={cx('vx-tab vx-tabmenu-trigger', selected && 'vx-tab--selected', props.className)}
			style={{ height: SIZE_HEIGHT[ctx.size], ...props.style }}
			accessibilityLabel={triggerLabel}
			accessibilityHint={props.label}
			onPress={() => setOpen(!open)}
		>
			<flexboxlayout className="vx-tab-content" flexDirection="column" justifyContent="flex-end" alignItems="center">
				<flexboxlayout flexDirection="row" alignItems="center" justifyContent="center" gap={4}>
					<Text className="vx-tab-label">{triggerLabel}</Text>
					<Icon name={open ? 'xplat-chevron-up' : 'xplat-chevron-down'} size={16} />
				</flexboxlayout>
				<flexboxlayout className={cx('vx-tab-indicator', selected && 'vx-tab-indicator--on')} />
			</flexboxlayout>
		</Pressable>
		<Popover anchor={anchor} open={open} placement="bottom" onDismiss={() => setOpen(false)} className="vx-tabmenu-pop">
			<flexboxlayout flexDirection="column" className="vx-tabmenu">
				<Text className="vx-tabmenu-heading">{props.label}</Text>
				@for (const option of props.options; key option.value) {
					<Pressable
						className={cx('vx-tabmenu-item', ctx.value === option.value && 'vx-tabmenu-item--selected')}
						accessibilityState={{ selected: ctx.value === option.value }}
						onPress={() => pick(option.value)}
					>
						<flexboxlayout flexDirection="row" alignItems="center" gap={8}>
							{option.icon != null ? navIcon(option.icon, 16) : null}
							<Text className="vx-tabmenu-itemcontent">{option.label}</Text>
							{ctx.value === option.value ? <Icon name="xplat-check" size={16} /> : null}
						</flexboxlayout>
					</Pressable>
				}
			</flexboxlayout>
		</Popover>
	</>
}
