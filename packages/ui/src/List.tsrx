/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useMemo } from 'octane'
import { refList } from './ref-list'
import type { ListProps } from './props';
import { cx } from '@octane-xplat/lib';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { toChildArray, mapChildren } from './child-array';
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
				? <masonview className={cx('vx-list-marker', 'vx-list-marker--disc')} style={{display: "flex"}}><masonview className="vx-list-marker-dot" style={{display: "flex"}}/></masonview>
				: listStyle === 'circle'
					? <masonview className={cx('vx-list-marker', 'vx-list-marker--circle')} style={{display: "flex"}}><masonview className="vx-list-marker-circle" style={{display: "flex"}}/></masonview>
					: null;

	const forwardedRef = useMemo(() => refList((v: any) => { if (v) { applyEscapeProps(v, props); } }, props.ref), [props.ref, props.ios, props.android, props.web]);

	<ListProvider value={contextValue}>
		<masonview id={props.id} ref={forwardedRef} className={cx('vx-list', `vx-list--density-${density}`, props.hasDividers && 'vx-list--dividers', props.className)} style={mergeStyle({display: "flex"}, props.style)} accessible={props.accessible} accessibilityLabel={props.accessibilityLabel} accessibilityRole={nativeAccessibilityRole(props.accessibilityRole)} accessibilityHint={props.accessibilityHint} accessibilityValue={props.accessibilityValue} accessibilityState={nativeAccessibilityState(props.accessibilityState)} accessibilityLiveRegion={props.accessibilityLiveRegion}>
			{props.header != null ? <masonview className="vx-list-header" style={{display: "flex"}}>{props.header}</masonview> : null}
			{mapChildren(items, (child: any, index: number) => (
				<masonview className={cx('vx-list-row', props.hasDividers && index < items.length - 1 && 'vx-list-row--divider')} style={mergeStyle({flexDirection: "row", alignItems: "stretch"}, {display: "flex"})}>
					{markerFor(index)}
					<masonview style={mergeStyle({flexGrow: 1}, mergeStyle({display: "flex"}, { minWidth: 0 }))}>{child}</masonview>
				</masonview>
			))}
		</masonview>
	</ListProvider>
}
