/** @jsxImportSource @nativescript-community/octane */
import type { ListProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { toChildArray } from './child-array';
import { ListProvider } from './list-context';

/** List — a vertical content list (not virtualized; that's VirtualList).
 *  Native has no list element or CSS counters: the leaf renders a column
 *  and wraps each child in a row carrying the marker (dot / outline /
 *  number) and the divider, so `listStyle`/`hasDividers`/`start` produce
 *  the same visuals as web. Each `ListItem` still reads density from the
 *  context. */
export function List(props: ListProps) @{
	const listStyle = props.listStyle ?? 'none';
	const density = props.density ?? 'balanced';
	const items = toChildArray(props.children);
	const start = props.start ?? 1;
	const contextValue = { density, hasDividers: props.hasDividers === true, listStyle, edgeCompensation: props.edgeCompensation, start };
	const markerFor = (index: number) =>
		listStyle === 'decimal'
			? <label className={cx('vx-list-marker', 'vx-list-marker--number')} text={`${start + index}.`} />
			: listStyle === 'disc'
				? <flexboxlayout className={cx('vx-list-marker', 'vx-list-marker--disc')}><flexboxlayout className="vx-list-marker-dot" /></flexboxlayout>
				: listStyle === 'circle'
					? <flexboxlayout className={cx('vx-list-marker', 'vx-list-marker--circle')}><flexboxlayout className="vx-list-marker-circle" /></flexboxlayout>
					: null;

	<ListProvider value={contextValue}>
		<flexboxlayout
			id={props.id}
			ref={(v: any) => { if (v) { applyEscapeProps(v, props); props.bind?.(v); } }}
			flexDirection="column"
			className={cx('vx-list', `vx-list--density-${density}`, props.hasDividers && 'vx-list--dividers', props.className)}
			style={props.style}
			accessible={props.accessible}
			accessibilityLabel={props.accessibilityLabel}
			accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
			accessibilityHint={props.accessibilityHint}
			accessibilityValue={props.accessibilityValue}
			accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
			accessibilityLiveRegion={props.accessibilityLiveRegion as any}
		>
			{props.header != null ? <flexboxlayout className="vx-list-header">{props.header}</flexboxlayout> : null}
			{items.map((child: any, index: number) => (
				<flexboxlayout
					className={cx('vx-list-row', props.hasDividers && index < items.length - 1 && 'vx-list-row--divider')}
					flexDirection="row"
					alignItems="stretch"
				>
					{markerFor(index)}
					<flexboxlayout flexGrow={1} style={{ minWidth: 0 }}>{child}</flexboxlayout>
				</flexboxlayout>
			))}
		</flexboxlayout>
	</ListProvider>
}
