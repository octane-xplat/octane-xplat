/** @jsxImportSource @nativescript-community/octane */
import { DropdownMenu } from './DropdownMenu';
import type { BreadcrumbProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Breadcrumb — ancestor trail. Every item with `onSelect` renders as a
 *  tappable link; the last item is conventionally the current page. */
export function Breadcrumb(props: BreadcrumbProps) @{
	const sep = props.separator ?? '/';
	const limit = Math.max(2, props.maxVisibleItems ?? props.items.length);
	const overflow = props.items.length > limit ? props.items.slice(1, props.items.length - limit + 1) : [];
	const visible = overflow.length ? [props.items[0], ...props.items.slice(props.items.length - limit + 1)] : props.items;


	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		className={cx('vx-breadcrumb', props.className)}
		style={props.style}
	>
		@for (const e of visible.map((item, i) => ({ item, i })); key e.i) {
			<flexboxlayout className="vx-breadcrumb-item">
				{e.i === 1 && (overflow.length > 0 || props.overflowMenu) && <DropdownMenu trigger={<label text="…" />} accessibilityLabel={props.overflowLabel ?? 'More ancestors'} items={overflow.map((item, index) => ({ key: `ancestor-${index}`, label: item.label, onSelect: item.onSelect, isDisabled: !item.onSelect }))}>{props.overflowMenu}</DropdownMenu>}
				{e.i > 0 ? <label className="vx-breadcrumb-sep" text={sep} /> : null}
				{e.item.onSelect
					? <label className="vx-breadcrumb-link" text={e.item.label} onTap={e.item.onSelect} />
					: <label className="vx-breadcrumb-text" text={e.item.label} />}
			</flexboxlayout>
		}
	</flexboxlayout>
}
