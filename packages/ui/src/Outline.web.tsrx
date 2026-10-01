import { useEffect, useRef, useState } from 'octane';
import type { OutlineItem, OutlineProps } from './props';
import { applyEscapeProps } from './escape-props';

const DEFAULT_LABEL = 'Table of contents';
const SPY_EDGE = 8;
const SETTLE_MS = 120;

function isScrollable(el: HTMLElement): boolean {
	const style = getComputedStyle(el);
	return /(auto|scroll)/.test(style.overflowY) && el.scrollHeight > el.clientHeight;
}

/** The scroll ancestor for spy + activation: explicit ref, else the nearest
 *  scrollable ancestor of the nav, else the document element. */
function resolveScrollContainer(navEl: HTMLElement | null, ref?: { current?: any }): Element | Document {
	if (ref?.current) return ref.current;
	let node = navEl?.parentElement ?? null;
	while (node) {
		if (isScrollable(node)) return node;
		node = node.parentElement;
	}

	return document.documentElement;
}

function headingEl(container: Element | Document, id: string): HTMLElement | null {
	if (container instanceof Document) {
		return container.getElementById(id);
	}

	const escaped = (globalThis as any).CSS?.escape ? CSS.escape(id) : id.replace(/"/g, '\\"');
	return container.querySelector(`[id="${escaped}"]`) as HTMLElement | null;
}

function headingTop(container: Element | Document, el: HTMLElement): number {
	if (container instanceof Document || container === document.documentElement) {
		return el.getBoundingClientRect().top + window.scrollY;
	}

	const ce = container as HTMLElement;
	return el.getBoundingClientRect().top - ce.getBoundingClientRect().top + ce.scrollTop;
}

function scrollTopOf(container: Element | Document): number {
	return container instanceof Document || container === document.documentElement
		? window.scrollY
		: (container as HTMLElement).scrollTop;
}

function scrollToTop(container: Element | Document, top: number, smooth: boolean) {
	const opts = { top, behavior: (smooth ? 'smooth' : 'auto') as ScrollBehavior };
	if (container instanceof Document || container === document.documentElement) {
		window.scrollTo(opts);
	} else {
		(container as HTMLElement).scrollTo(opts);
	}
}

/** Outline — table-of-contents nav with scroll-spy, a sliding active
 *  indicator, roving-tabindex keyboard nav, and smooth-scroll activation.
 *  `activeId`/`onActiveIdChange` give controlled mode (scroll-spy disabled);
 *  uncontrolled mode spies the scroll container for the last heading above
 *  the offset edge. */
export function Outline(props: OutlineProps) @{
	const items = props.items ?? [];
	const label = props.label ?? DEFAULT_LABEL;
	const density = props.density ?? 'default';
	const offset = props.offset ?? 0;
	const hasScrollOnClick = props.hasScrollOnClick ?? true;

	const controlled = props.activeId !== undefined;
	const [internalActive, setInternalActive] = useState<string | undefined>(items[0]?.id);
	const activeId = controlled ? props.activeId : internalActive;

	const navRef = useRef<HTMLElement | null>(null);
	const itemEls = useRef(new Map<string, HTMLElement>());
	const [indicator, setIndicator] = useState<{ top: number; height: number } | null>(null);
	const [focusId, setFocusId] = useState<string | undefined>(items[0]?.id);
	const settleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const navigating = useRef<string | undefined>(undefined);

	const setActive = (id: string) => {
		if (!controlled) setInternalActive(id);
		props.onActiveIdChange?.(id);
	};

	const container = () => resolveScrollContainer(navRef.current, props.scrollContainerRef);

	// Scroll spy — uncontrolled only.
	useEffect(() => {
		if (controlled || items.length === 0) return;
		const c = container();
		const target: any = c instanceof Document || c === document.documentElement ? window : c;
		const spy = () => {
			const tops = items
				.map((item) => {
					const el = headingEl(c, item.id);
					return el ? { id: item.id, top: headingTop(c, el) } : null;
				})
				.filter(Boolean) as { id: string; top: number }[];

			const edge = scrollTopOf(c) + offset + SPY_EDGE;
			let current = tops[0]?.id;
			for (const t of tops) {
				if (t.top <= edge) current = t.id;
				else break;
			}

			if (current && current !== activeIdRef.current) setActive(current);
		};

		target.addEventListener('scroll', spy, { passive: true });
		spy();
		return () => target.removeEventListener('scroll', spy);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [controlled, items, offset]);

	const activeIdRef = useRef<string | undefined>(activeId);
	activeIdRef.current = activeId;

	// Sliding indicator geometry from the active item's measured box.
	useEffect(() => {
		const el = activeId ? itemEls.current.get(activeId) : undefined;
		const host = navRef.current;
		if (!el || !host) {
			setIndicator(null);
			return;
		}

		setIndicator({ top: el.offsetTop, height: el.offsetHeight });
	}, [activeId, items, density]);

	const settle = () => {
		if (navigating.current != null) {
			props.onNavigateEnd?.(navigating.current);
			navigating.current = undefined;
		}
	};

	const activate = (id: string) => {
		const item = items.find((i) => i.id === id);
		if (!item) return;
		setFocusId(id);
		setActive(id);
		navigating.current = id;
		props.onNavigateStart?.(id);
		if (hasScrollOnClick) {
			const c = container();
			const target = headingEl(c, id);
			if (target) {
				scrollToTop(c, headingTop(c, target) - offset, true);
				if (typeof history !== 'undefined' && history.replaceState) {
					history.replaceState(null, '', `#${id}`);
				}
			}
		}

		// Scroll settles when the scroll event goes quiet — a manual wheel
		// interruption still fires onNavigateEnd once its own scroll ends.
		const c = container();
		const scrollTarget: any = c instanceof Document || c === document.documentElement ? window : c;
		const onScroll = () => {
			if (settleTimer.current !== undefined) clearTimeout(settleTimer.current);
			settleTimer.current = setTimeout(() => {
				scrollTarget.removeEventListener('scroll', onScroll);
				settle();
			}, SETTLE_MS);
		};

		scrollTarget.addEventListener('scroll', onScroll, { passive: true });
		onScroll();
	};

	const onKeyDown = (e: any) => {
		const idx = items.findIndex((i) => i.id === focusId);
		const move = (next: number) => {
			const item = items[Math.max(0, Math.min(items.length - 1, next))];
			if (!item) return;
			setFocusId(item.id);
			itemEls.current.get(item.id)?.focus();
		};

		switch (e.key) {
			case 'ArrowDown':
				e.preventDefault();
				move(idx + 1);
				break;
			case 'ArrowUp':
				e.preventDefault();
				move(idx - 1);
				break;
			case 'Home':
				e.preventDefault();
				move(0);
				break;
			case 'End':
				e.preventDefault();
				move(items.length - 1);
				break;
			case 'Enter':
			case ' ':
				e.preventDefault();
				if (focusId) activate(focusId);
				break;
		}
	};

	<nav
		ref={(e: any) => {
			navRef.current = e;
			applyEscapeProps(e, props);
		}}
		id={props.id}
		className={['vx-outline', `vx-outline--${density}`, props.className]}
		style={props.style}
		aria-label={label}
		role="navigation"
	>
		<div className="vx-outline-track" role="list" onKeyDown={onKeyDown}>
			{indicator ? (
				<span
					className="vx-outline-indicator"
					aria-hidden="true"
					style={{ transform: `translateY(${indicator.top}px)`, height: indicator.height }}
				/>
			) : null}
			{items.map((item) => {
				const isActive = item.id === activeId;
				return (
					<button
						key={item.id}
						ref={(e: any) => {
							if (e) itemEls.current.set(item.id, e);
							else itemEls.current.delete(item.id);
						}}
						type="button"
						role="listitem"
						className={['vx-outline-item', isActive && 'vx-outline-item--active']}
						style={{ paddingInlineStart: 8 + (item.level - 1) * 12 }}
						tabIndex={item.id === focusId ? 0 : -1}
						aria-current={isActive ? 'location' : undefined}
						onClick={() => activate(item.id)}
						onFocus={() => setFocusId(item.id)}
					>
						{item.label}
					</button>
				);
			})}
		</div>
	</nav>
}
