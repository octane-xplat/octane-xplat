/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { MetadataListProps } from './props';
import { cx } from './cx';
import { applyEscapeProps } from './escape-props';
import { MetadataListProvider } from './metadata-list-context';
import { Grid } from './Grid.tsrx';
import { Pressable } from './Pressable.tsrx';
import { toChildArray } from './child-array';

/** Repeat an 'auto,*' label/value track pair (or a '*' cell for stacked
 *  items) n times for a fixed column count. */
function gridColumns(columns: 'multi' | 'single' | number, isStacked: boolean): string {
	if (columns === 'single') {
		return isStacked ? '*' : 'auto,*';
	}

	const n = columns === 'multi' ? 2 : Math.max(1, columns);
	return isStacked
		? Array.from({ length: n }, () => '*').join(',')
		: Array.from({ length: n }, () => 'auto,*').join(',');
}

/** MetadataList — labeled key/value list. 'start' labels place each item's
 *  label and value as adjacent Grid cells so label tracks align; 'top' and
 *  horizontal place one cell per item. 'multi' resolves to two equal columns
 *  on native (there is no auto-fill sizing in GridLayout); a numeric `columns`
 *  is exact. */
export function MetadataList(props: MetadataListProps) @{
	const columns = props.columns ?? 'single';
	const orientation = props.orientation ?? 'vertical';
	const isHorizontal = orientation === 'horizontal';
	const labelPosition =
		props.label?.position ??
		(isHorizontal || columns === 'multi' || (typeof columns === 'number' && columns > 1)
			? 'top'
			: 'start');

	const isStacked = labelPosition === 'top' || isHorizontal;

	const [isShowAll, setIsShowAll] = useState(false);
	const childrenArray = toChildArray(props.children);
	const effectiveMax = isHorizontal ? undefined : props.maxNumOfItems;
	const isExceedMax = effectiveMax != null && childrenArray.length > effectiveMax;
	const visibleChildren =
		isExceedMax && !isShowAll ? childrenArray.slice(0, effectiveMax) : childrenArray;

	<MetadataListProvider
		value={{ labelPosition, labelWidth: props.label?.width, orientation }}
	>
		<flexboxlayout
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={cx('vx-metadatalist', props.className)}
			style={{ flexDirection: 'column', ...props.style }}
			flexDirection="column"
		>
			{props.title != null ? (
				<flexboxlayout className="vx-metadatalist-title" style={{ marginBottom: 12 }}>
					{typeof props.title === 'string' || typeof props.title === 'number'
						? <label whiteSpace="normal" style={{ fontWeight: 600 }}>{props.title}</label>
						: props.title}
				</flexboxlayout>
			) : null}
			{isHorizontal ? (
				<flexboxlayout
					className="vx-metadatalist-list vx-metadatalist--horizontal"
					flexDirection="row"
					flexWrap="wrap"
					gap={16}
				>
					{visibleChildren}
				</flexboxlayout>
			) : (
				<Grid columns={gridColumns(columns, isStacked)} className="vx-metadatalist-list">
					{visibleChildren}
				</Grid>
			)}
			{isExceedMax ? (
				<Pressable
					className="vx-metadatalist-toggle"
					accessibilityRole="button"
					accessibilityLabel={isShowAll ? 'Show less' : 'Show more'}
					accessibilityState={{ checked: isShowAll }}
					onPress={() => setIsShowAll((prev) => !prev)}
				>
					<label className="vx-metadatalist-toggle-label" style={{ paddingTop: 8, paddingBottom: 8 }}>
						{isShowAll ? 'Show less' : 'Show more'}
					</label>
				</Pressable>
			) : null}
		</flexboxlayout>
	</MetadataListProvider>
}
