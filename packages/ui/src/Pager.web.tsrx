import { useEffect, useRef } from 'octane';
import type { PagerProps } from './props';
import { applyWebProps } from './platformProps.web';
import { layoutChildProps } from './layout-child.web';

/** Paged horizontal container — web leaf: a mandatory scroll-snap row, one
 *  page per item at 100% host width. `onPageChange` fires on the settled
 *  snap page (a scroll-idle debounce reads scrollLeft after the snap lands),
 *  matching the native widget's selected-index event. Programmatic `page`
 *  writes are tracked in `current` so their own scroll never echoes back
 *  through `onPageChange` — same contract as the muted property echo on
 *  native. No indicator — compose dots from Row + View outside. */
export function Pager(props: PagerProps) @{
	const host = useRef<HTMLElement | null>(null);
	const latest = useRef(props);
	// The page the leaf believes it is on: seeded by `page`/`defaultPage`,
	// updated by controlled writes and settled swipes. A scroll that lands
	// on `current` is programmatic — the settle never reports it.
	const current = useRef(props.page ?? props.defaultPage ?? 0);
	const settle = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		latest.current = props;
	});

	useEffect(() => {
		const el = host.current;
		if (!el) return;
		const onScroll = () => {
			if (settle.current !== null) clearTimeout(settle.current);
			settle.current = setTimeout(() => {
				settle.current = null;
				const el2 = host.current;
				if (!el2 || el2.clientWidth === 0) return;
				const max = Math.max(latest.current.items.length - 1, 0);
				const next = Math.max(0, Math.min(max, Math.round(el2.scrollLeft / el2.clientWidth)));
				if (next !== current.current) {
					current.current = next;
					latest.current.onPageChange?.(next);
				}
			}, 90);
		};

		el.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			el.removeEventListener('scroll', onScroll);
			if (settle.current !== null) clearTimeout(settle.current);
		};
	}, []);

	// Mount: jump (no animation) to the starting page — an initial position
	// is not a scroll. Runs after the scroll listener attaches so the write
	// still flows through the tracked-index path.
	useEffect(() => {
		const el = host.current;
		if (!el || current.current <= 0) return;
		el.scrollLeft = current.current * el.clientWidth;
	}, []);

	// Controlled writes scroll smoothly. Skipped when the page already
	// matches `current` — a user swipe that the parent echoes back unchanged
	// must not scroll again.
	useEffect(() => {
		const el = host.current;
		if (!el || props.page === undefined || props.page === current.current) return;
		current.current = props.page;
		el.scrollTo({ left: props.page * el.clientWidth, behavior: 'smooth' });
	}, [props.page]);

	@if (props.items.length > 0) {
		<div
			ref={(el: any) => {
				host.current = el;
				applyWebProps(el, props.web);
			}}
			id={props.id}
			className={['vx-pager', props.className]}
			{...layoutChildProps(props)}
			role={props.accessibilityRole ?? 'group'}
			aria-roledescription="carousel"
			aria-label={props.accessibilityLabel}
			aria-hidden={props.accessible === false ? true : undefined}
			aria-description={props.accessibilityHint}
			aria-valuetext={props.accessibilityValue}
			aria-disabled={props.accessibilityState?.disabled}
			aria-selected={props.accessibilityState?.selected}
			aria-checked={props.accessibilityState?.checked}
			aria-live={props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
		>
			@for (const item of props.items; index i; key i) {
				<div
					className="vx-pager-page"
					role="group"
					aria-roledescription="slide"
					aria-label={`${i + 1} of ${props.items.length}`}
				>
					{props.renderItem(item, i)}
				</div>
			}
		</div>
	} @else {
		<>{props.renderEmpty?.()}</>
	}
}
