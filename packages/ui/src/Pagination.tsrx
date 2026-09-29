/** @jsxImportSource @nativescript-community/octane */
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
		className={cx('vx-pagination', props.disabled && 'vx-pagination--disabled', props.className)}
		style={props.style}
	>
		<flexboxlayout className="vx-page-btn" onTap={() => go(current - 1)}><label text="‹" /></flexboxlayout>
		@for (const e of pages; key e.key) {
			@if (e.page == null) {
				<label className="vx-page-ellipsis" text="…" />
			} @else {
				<flexboxlayout className={cx('vx-page-btn', e.page === current && 'vx-page-btn--on')} onTap={() => go(e.page!)}>
					<label text={String(e.page)} />
				</flexboxlayout>
			}
		}
		<flexboxlayout className="vx-page-btn" onTap={() => go(current + 1)}><label text="›" /></flexboxlayout>
	</flexboxlayout>
}
