import type { BreadcrumbProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Breadcrumb — ancestor trail. Every item with `onSelect` renders as a
 *  pressable link; the last item is conventionally the current page. */
export function Breadcrumb(props: BreadcrumbProps) @{
	const sep = props.separator ?? '/';

	<nav
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-breadcrumb', props.className]}
		style={props.style}
		aria-label={props.accessibilityLabel ?? 'Breadcrumb'}
	>
		{props.items.map((item: any, i: number) => (
			<span key={i} className="vx-breadcrumb-item">
				{i > 0 ? <span className="vx-breadcrumb-sep" aria-hidden="true">{sep}</span> : null}
				{item.onSelect
					? <span className="vx-breadcrumb-link" role="link" tabIndex={0} onClick={item.onSelect} onKeyDown={(e: any) => { if (e.key === 'Enter') item.onSelect?.(); }}>{item.label}</span>
					: <span className="vx-breadcrumb-text" aria-current={i === props.items.length - 1 ? 'page' : undefined}>{item.label}</span>}
			</span>
		))}
	</nav>
}
