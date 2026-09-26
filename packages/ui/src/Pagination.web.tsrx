import type { PaginationProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Pagination — ‹ › plus a windowed run of page buttons around `page`
 *  (first, last, `siblingCount` each side, … for gaps). */
export function Pagination(props: PaginationProps) @{
	const sibling = props.siblingCount ?? 1;
	const count = Math.max(0, props.pageCount);
	const current = Math.min(Math.max(1, props.page), Math.max(1, count));

	const pages: (number | '…')[] = [];
	for (let p = 1; p <= count; p++) {
		if (p === 1 || p === count || Math.abs(p - current) <= sibling) {
			pages.push(p);
		} else if (pages[pages.length - 1] !== '…') {
			pages.push('…');
		}
	}

	const go = (p: number) => {
		if (props.disabled || p < 1 || p > count || p === current) return;
		props.onPageChange?.(p);
	};

	<nav
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-pagination', props.disabled ? 'vx-pagination--disabled' : undefined, props.className]}
		style={props.style}
		aria-label={props.accessibilityLabel ?? 'Pagination'}
	>
		<span className="vx-page-btn" role="button" aria-disabled={current <= 1 || props.disabled || undefined} tabIndex={0} onClick={() => go(current - 1)}>‹</span>
		{pages.map((p: number | '…', i: number) => (
			p === '…'
				? <span key={'e' + i} className="vx-page-ellipsis">…</span>
				: <span
					key={p}
					className={['vx-page-btn', p === current ? 'vx-page-btn--on' : undefined]}
					role="button"
					aria-current={p === current ? 'page' : undefined}
					tabIndex={0}
					onClick={() => go(p)}
					onKeyDown={(e: any) => { if (e.key === 'Enter') go(p); }}
				>
					{p}
				</span>
		))}
		<span className="vx-page-btn" role="button" aria-disabled={current >= count || props.disabled || undefined} tabIndex={0} onClick={() => go(current + 1)}>›</span>
	</nav>
}
