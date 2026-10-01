import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'octane';
import type { TabListProps, TabProps, TabMenuProps, TabMenuOption } from './props';
import { applyEscapeProps } from './escape-props';
import { Icon } from './Icon.web.tsrx';
import { Popover } from './Popover.web.tsrx';
import { followHref } from './nav-href.web';
import { TabListContext, TabListProvider } from './nav-contexts';
import { useListFocus } from './list-focus.web.tsrx';

export { TabListContext };
export { useTabListContext } from './nav-contexts';

/** Focusable stops in the strip: every Tab and every TabMenu trigger. */
const TAB_STOP_SELECTOR = '[data-tab-value],[data-tab-menu]';
/** Fraction of the visible strip an arrow-affordance click scrolls. */
const SCROLL_PAGE_RATIO = 0.8;

const SIZE_HEIGHT: Record<string, number> = { sm: 28, md: 32, lg: 36 };

function navIcon(icon: any, size: number) {
	return typeof icon === 'string' ? <Icon name={icon} size={size} /> : icon;
}

/** TabList — tab strip providing TabListContext to Tab/TabMenu children.
 *  A `<nav>` landmark by default; `role="tablist"` switches to the WAI-ARIA
 *  tabs pattern. Owns roving-tabindex arrow navigation and horizontal
 *  overflow scrolling with edge fades + arrow affordances. */
export function TabList(props: TabListProps) @{
	const size = props.size ?? 'md';
	const overflow = props.overflow ?? 'auto';
	const hasScroll = overflow !== 'visible';
	const isTabList = props.role === 'tablist';
	const root = useRef<HTMLElement | null>(null);
	const strip = useRef<HTMLDivElement | null>(null);
	const [overflowStart, setOverflowStart] = useState(false);
	const [overflowEnd, setOverflowEnd] = useState(false);

	const { listRef, handleKeyDown, handleFocus } = useListFocus<HTMLElement>({
		itemSelector: TAB_STOP_SELECTOR,
		// Nav pattern accepts both axes per the APG tab-strip allowance; a
		// tablist reports horizontal and leaves vertical arrows to the page.
		orientation: isTabList ? 'horizontal' : 'both',
		hasRovingTabIndex: true,
	});

	const updateOverflow = useCallback(() => {
		const el = strip.current;
		if (!el) return;
		setOverflowStart(el.scrollLeft > 1);
		setOverflowEnd(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
	}, []);

	useEffect(() => {
		const el = strip.current;
		if (!el || !hasScroll) return;
		updateOverflow();
		el.addEventListener('scroll', updateOverflow, { passive: true });
		const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateOverflow) : null;
		ro?.observe(el);
		const mo = new MutationObserver(updateOverflow);
		mo.observe(el, { childList: true, subtree: true });
		return () => {
			el.removeEventListener('scroll', updateOverflow);
			ro?.disconnect();
			mo.disconnect();
		};
	}, [hasScroll, updateOverflow]);

	const revealSelected = useCallback(() => {
		const el = strip.current;
		if (!el || !hasScroll) return;
		const stop = Array.from(el.querySelectorAll<HTMLElement>('[data-tab-value]')).find(
			(n) => n.dataset.tabValue === props.value,
		);

		if (typeof stop?.scrollIntoView === 'function') {
			stop.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' as ScrollBehavior });
		}
	}, [props.value, hasScroll]);

	const revealed = useRef<string | null>(null);
	useEffect(() => {
		if (revealed.current === props.value) return;
		revealed.current = props.value;
		revealSelected();
	});

	// The selection stays visible when the strip itself resizes.
	useEffect(() => {
		const el = strip.current;
		if (!el || !hasScroll || typeof ResizeObserver === 'undefined') return;
		const ro = new ResizeObserver(revealSelected);
		ro.observe(el);
		return () => ro.disconnect();
	}, [hasScroll, revealSelected]);

	const scrollPage = useCallback((dir: -1 | 1) => {
		const el = strip.current;
		if (!el) return;
		el.scrollBy({ left: dir * el.clientWidth * SCROLL_PAGE_RATIO, behavior: 'smooth' });
	}, []);

	const ctx = useMemo(
		() => ({
			value: props.value,
			onChange: props.onChange,
			size,
			layout: props.layout ?? 'hug',
			pattern: isTabList ? ('tabs' as const) : ('nav' as const),
		}),
		[props.value, props.onChange, size, props.layout, isTabList],
	);

	const label = props.web?.['aria-label'] ?? 'Tabs';
	const fades = !hasScroll ? '' : overflowStart && overflowEnd ? 'vx-tabstrip--fade-both' : overflowStart ? 'vx-tabstrip--fade-start' : overflowEnd ? 'vx-tabstrip--fade-end' : '';
	const attachRoot = (el: HTMLElement | null) => {
		root.current = el;
		listRef.current = el;
		if (el) applyEscapeProps(el, props);
	};

	const inner = (
		<>
			<div
				ref={(el: HTMLDivElement | null) => { strip.current = el; }}
				className={['vx-tabstrip', hasScroll && 'vx-tabstrip--scroll', props.isFullBleed && 'vx-tabstrip--bleed', fades]}
				role={isTabList ? 'tablist' : undefined}
				aria-label={isTabList ? label : undefined}
				onScroll={updateOverflow}
			>
				{props.children}
			</div>
			{hasScroll && overflowStart ? (
				<button
					type="button"
					className="vx-tabscroll vx-tabscroll--start"
					aria-hidden="true"
					tabIndex={-1}
					onMouseDown={(e: any) => e.preventDefault()}
					onClick={() => scrollPage(-1)}
				>
					<Icon name="xplat-chevron-left" size={16} />
				</button>
			) : null}
			{hasScroll && overflowEnd ? (
				<button
					type="button"
					className="vx-tabscroll vx-tabscroll--end"
					aria-hidden="true"
					tabIndex={-1}
					onMouseDown={(e: any) => e.preventDefault()}
					onClick={() => scrollPage(1)}
				>
					<Icon name="xplat-chevron-right" size={16} />
				</button>
			) : null}
		</>
	);

	const cls = ['vx-tablist', 'vx-tablist--' + size, props.layout === 'fill' && 'vx-tablist--fill', props.hasDivider && 'vx-tablist--divided', props.isFullBleed && 'vx-tablist--bleed', props.className];

	<TabListProvider value={ctx}>
		@if (isTabList) {
			<div ref={attachRoot} id={props.id} className={cls} style={props.style} role="presentation" onKeyDown={handleKeyDown} onFocus={handleFocus}>{inner}</div>
		} @else {
			<nav ref={attachRoot} id={props.id} className={cls} style={props.style} role={props.role} aria-label={props.role ? undefined : label} onKeyDown={handleKeyDown} onFocus={handleFocus}>{inner}</nav>
		}
	</TabListProvider>
}

/** Tab — a single stop in a TabList. Renders as a button, or as an anchor
 *  when `href` is set under the nav pattern. */
export function Tab(props: TabProps) @{
	const ctx = useContext(TabListContext);
	if (ctx == null) {
		throw new Error('Tab must be used within a TabList.');
	}

	const isSelected = ctx.value === props.value;
	const isTabs = ctx.pattern === 'tabs';
	const isLink = props.href != null && !isTabs;
	const isDisabled = props.isDisabled === true;
	const displayIcon = isSelected && props.selectedIcon != null ? props.selectedIcon : props.icon;
	const showLabel = !props.isLabelHidden && props.label !== '';

	const select = (e: any) => {
		if (isDisabled) {
			e?.preventDefault?.();
			return;
		}

		props.onPress?.();
		if (e?.defaultPrevented) return;
		ctx.onChange(props.value);
	};

	const shared: any = {
		id: props.id,
		'data-tab-value': props.value,
		className: ['vx-tab', isSelected && 'vx-tab--selected', ctx.layout === 'fill' && 'vx-tab--fill', props.className],
		style: { height: SIZE_HEIGHT[ctx.size], ...props.style },
		tabIndex: isDisabled ? -1 : isSelected ? 0 : -1,
		'aria-label': props.isLabelHidden ? props.label : undefined,
		'aria-disabled': isDisabled || undefined,
		...(isTabs
			? { role: 'tab', 'aria-selected': isSelected, 'aria-controls': props.panelId }
			: { 'aria-current': isSelected ? 'true' : undefined }),
	};

	const content = (
		<>
			<span className="vx-tab-hover" aria-hidden="true" />
			{displayIcon != null ? <span className="vx-tab-icon">{navIcon(displayIcon, ctx.size === 'lg' ? 18 : ctx.size === 'sm' ? 14 : 16)}</span> : null}
			{showLabel ? (
				<span className="vx-tab-labelwrap">
					<span className="vx-tab-label">{props.label}</span>
					<span className="vx-tab-labelsizer" aria-hidden="true">{props.label}</span>
				</span>
			) : null}
			{props.endContent != null ? <span className="vx-tab-end">{props.endContent}</span> : null}
			<span className={['vx-tab-indicator', isSelected && 'vx-tab-indicator--on']} aria-hidden="true" />
		</>
	);

	const LinkEl: any = isDisabled ? 'a' : props.as ?? 'a';

	@if (isLink) {
		<LinkEl
			{...shared}
			href={isDisabled ? undefined : props.href}
			onClick={select}
			ref={(el: any) => applyEscapeProps(el, props)}
		>
			{content}
		</LinkEl>
	} @else {
		<button
			{...shared}
			type="button"
			onClick={select}
			ref={(el: any) => applyEscapeProps(el, props)}
		>
			{content}
		</button>
	}
}

/** TabMenu — overflow trigger inside a TabList; opens a menu of extra tab
 *  options. The selected option's label becomes the trigger text. */
export function TabMenu(props: TabMenuProps) @{
	const ctx = useContext(TabListContext);
	if (ctx == null) {
		throw new Error('TabMenu must be used within a TabList.');
	}

	const anchor = useRef<any>(null);
	const [open, setOpen] = useState(false);
	const selected = props.options.find((o) => o.value === ctx.value);
	const triggerLabel = selected?.label ?? props.label;

	const menu = useListFocus<HTMLDivElement>({ itemSelector: '[role="menuitemradio"]', orientation: 'vertical', hasRovingTabIndex: true, onEscape: () => setOpen(false) });

	const pick = (value: string) => {
		ctx.onChange(value);
		setOpen(false);
	};

	<>
		<button
			ref={(el: any) => { anchor.current = el; applyEscapeProps(el, props); }}
			id={props.id}
			type="button"
			className={['vx-tab vx-tabmenu-trigger', selected && 'vx-tab--selected', props.className]}
			style={{ height: SIZE_HEIGHT[ctx.size], ...props.style }}
			data-tab-menu=""
			tabIndex={selected ? 0 : -1}
			aria-haspopup="menu"
			aria-expanded={open}
			onClick={() => setOpen(!open)}
		>
			<span className="vx-tab-hover" aria-hidden="true" />
			<span className="vx-tab-labelwrap">
				<span className="vx-tab-label">{triggerLabel}</span>
				<span className="vx-tab-labelsizer" aria-hidden="true">{triggerLabel}</span>
			</span>
			<span className={['vx-tabmenu-chevron', open && 'vx-tabmenu-chevron--open']} aria-hidden="true">
				<Icon name="xplat-chevron-down" size={16} />
			</span>
			{selected ? <span className="vx-tab-indicator vx-tab-indicator--on" aria-hidden="true" /> : null}
		</button>
		<Popover anchor={anchor} open={open} placement="bottom" onDismiss={() => setOpen(false)} className="vx-tabmenu-pop">
			<div
				ref={(el: HTMLDivElement | null) => { menu.listRef.current = el; }}
				className="vx-tabmenu"
				role="menu"
				aria-label={props.label}
				onKeyDown={menu.handleKeyDown}
				onFocus={menu.handleFocus}
			>
				<div className="vx-tabmenu-heading" role="presentation">{props.label}</div>
				@for (const option of props.options; key option.value) {
					<div
						className={['vx-tabmenu-item', ctx.value === option.value && 'vx-tabmenu-item--selected']}
						role="menuitemradio"
						tabIndex={-1}
						aria-checked={ctx.value === option.value}
						onClick={() => pick(option.value)}
						onKeyDown={(e: KeyboardEvent) => {
							if (e.key === 'Enter' || e.key === ' ') {
								e.preventDefault();
								pick(option.value);
							}
						}}
					>
						<span className="vx-tabmenu-itemcontent">
							{option.icon != null ? navIcon(option.icon, 16) : null}
							{option.label}
						</span>
						{ctx.value === option.value ? <Icon name="xplat-check" size={16} /> : null}
					</div>
				}
			</div>
		</Popover>
	</>
}
