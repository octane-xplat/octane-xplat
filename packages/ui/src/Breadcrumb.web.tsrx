import { DropdownMenu } from './DropdownMenu.web.tsrx';
import type { BreadcrumbProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Breadcrumb — ancestor trail. Every item with `onSelect` renders as a
 *  pressable link; the last item is conventionally the current page. */
export function Breadcrumb(props: BreadcrumbProps) @{
	const sep = props.separator ?? '/';
	const limit = Math.max(2, props.maxVisibleItems ?? props.items.length);
	const overflow = props.items.length > limit ? props.items.slice(1, props.items.length - limit + 1) : [];
	const visible = overflow.length ? [props.items[0], ...props.items.slice(props.items.length - limit + 1)] : props.items;


	<nav
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-breadcrumb', props.className]}
		style={props.style}
		aria-label={props.accessibilityLabel ?? 'Breadcrumb'}
	>
		{visible.map((item: any, i: number) => (
			<span key={i} className="vx-breadcrumb-item">
				{i === 1 && (overflow.length > 0 || props.overflowMenu) && <DropdownMenu trigger="…" accessibilityLabel={props.overflowLabel ?? 'More ancestors'} items={overflow.map((item, index) => ({ key: `ancestor-${index}`, label: item.label, onSelect: item.onSelect, isDisabled: !item.onSelect }))}>{props.overflowMenu}</DropdownMenu>}
				{i > 0 ? <span className="vx-breadcrumb-sep" aria-hidden="true">{sep}</span> : null}
				{item.onSelect
					? <span className="vx-breadcrumb-link" role="link" tabIndex={0} onClick={item.onSelect} onKeyDown={(e: any) => { if (e.key === 'Enter') item.onSelect?.(); }}>{item.label}</span>
					: <span className="vx-breadcrumb-text" aria-current={i === visible.length - 1 ? 'page' : undefined}>{item.label}</span>}
			</span>
		))}
	</nav>
}
