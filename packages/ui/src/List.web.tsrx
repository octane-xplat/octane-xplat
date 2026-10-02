import { useMemo, useId } from 'octane';
import { refList } from './ref-list'
import type { ListProps } from './props';
import { applyEscapeProps } from './escape-props';
import { applyWebProps } from './platformProps.web';
import { ListProvider } from './list-context';

/** List — a vertical content list (not virtualized; that's VirtualList).
 *  Semantic `ul`/`ol` (`role="list"` restores the semantics `list-style:
 *  none` drops in WebKit), markers custom-rendered by ListItem, density +
 *  dividers + edge compensation flow through context. */
export function List(props: ListProps) @{
	const listStyle = props.listStyle ?? 'none';
	const density = props.density ?? 'balanced';
	const isOrdered = listStyle === 'decimal';
	const Tag: any = isOrdered ? 'ol' : 'ul';
	const headerId = useId();
	const start = props.start ?? 1;
	const contextValue = { density, hasDividers: props.hasDividers === true, listStyle, edgeCompensation: props.edgeCompensation, start };
	const listClass = [
		'vx-list',
		`vx-list--density-${density}`,
		listStyle !== 'none' ? `vx-list--${listStyle}` : undefined,
		props.hasDividers ? 'vx-list--dividers' : undefined,
		props.edgeCompensation === 'inline' ? 'vx-list--edge-inline' : undefined,
		props.className,
	];

	const forwardedRef = useMemo(() => refList((e: any) => { if (e) { applyEscapeProps(e, props); applyWebProps(e, props.web); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	const list = (
		<Tag
			id={props.id}
			ref={forwardedRef}
			className={listClass}
			style={{
				...(isOrdered ? { counterReset: `vx-list ${start - 1}` } : {}),
				...props.style,
			}}
			start={isOrdered && start !== 1 ? start : undefined}
			role="list"
			data-testid={props['data-testid']}
			aria-labelledby={props.header != null ? headerId : undefined}
			aria-label={props.accessibilityLabel}
			aria-hidden={props.accessible === false ? true : undefined}
		>
			{props.children}
		</Tag>
	);

	@if (props.header != null) {
		<div className="vx-list-wrap">
			<div id={headerId} className="vx-list-header">{props.header}</div>
			<ListProvider value={contextValue}>{list}</ListProvider>
		</div>
	} @else {
		<ListProvider value={contextValue}>{list}</ListProvider>
	}
}
