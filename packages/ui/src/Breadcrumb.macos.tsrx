/** @jsxImportSource @xplat/macos/renderer */
import type { BreadcrumbProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Breadcrumb — ancestor trail. Every item with `onSelect` renders as a
 *  tappable link; the last item is conventionally the current page. */
export function Breadcrumb(props: BreadcrumbProps) @{
	const sep = props.separator ?? '/';

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		flexDirection="row"
		className={cx('vx-breadcrumb', props.className)}
		style={props.style}
	>
		@for (const e of props.items.map((item, i) => ({ item, i })); key e.i) {
			<flexboxlayout className="vx-breadcrumb-item">
				{e.i > 0 ? <label className="vx-breadcrumb-sep" text={sep} /> : null}
				{e.item.onSelect
					? <label className="vx-breadcrumb-link" text={e.item.label} onTap={e.item.onSelect} />
					: <label className="vx-breadcrumb-text" text={e.item.label} />}
			</flexboxlayout>
		}
	</flexboxlayout>
}
