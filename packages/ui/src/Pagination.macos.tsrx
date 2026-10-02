/** @jsxImportSource @octane-xplat/macos-renderer */
import type { PaginationProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Pagination — ‹ › plus a windowed run of page buttons around `page`
 *  (first, last, `siblingCount` each side, … for gaps). */
export function Pagination(props: PaginationProps) @{
	const sibling = props.siblingCount ?? 1;
	const count = Math.max(0, props.pageCount);
	const current = Math.min(Math.max(1, props.page), Math.max(1, count));

	const pages: { key: string; page: number | null }[] = [];
	let lastEllipsis = false;
	for (let p = 1; p <= count; p++) {
		if (p === 1 || p === count || Math.abs(p - current) <= sibling) {
			pages.push({ key: String(p), page: p });
			lastEllipsis = false;
		} else if (!lastEllipsis) {
			pages.push({ key: 'e' + p, page: null });
			lastEllipsis = true;
		}
	}

	const go = (p: number) => {
		if (props.disabled || p < 1 || p > count || p === current) return;
		props.onPageChange?.(p);
	};

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		alignItems="center"
		className={cx('vx-pagination', props.disabled && 'vx-pagination--disabled', props.className)}
		style={props.style}
	>
		<flexboxlayout className="vx-page-btn" justifyContent="center" alignItems="center" style={{ width: 28, height: 28, borderWidth: 1, borderColor: '#eaeaea', borderRadius: 4 }} onTap={() => go(current - 1)}><label text="‹" /></flexboxlayout>
		@for (const e of pages; key e.key) {
			<>{e.page == null
				? <label className="vx-page-ellipsis" text="…" />
				: <flexboxlayout
					className={cx('vx-page-btn', e.page === current && 'vx-page-btn--on')}
					justifyContent="center"
					alignItems="center"
					style={{ width: 28, height: 28, borderWidth: 1, borderColor: '#eaeaea', borderRadius: 4, ...(e.page === current ? { backgroundColor: '#171717', borderColor: '#171717', color: '#fafafa' } : {}) }}
					onTap={() => go(e.page!)}
				>
					<label text={String(e.page)} />
				</flexboxlayout>}</>
		}
		<flexboxlayout className="vx-page-btn" justifyContent="center" alignItems="center" style={{ width: 28, height: 28, borderWidth: 1, borderColor: '#eaeaea', borderRadius: 4 }} onTap={() => go(current + 1)}><label text="›" /></flexboxlayout>
	</flexboxlayout>
}
