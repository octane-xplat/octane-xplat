/** @jsxImportSource @xplat/macos/renderer */
import { useState } from 'octane';
import type { MetadataListProps } from './props';
import { cx } from './cx';
import { MetadataListProvider } from './metadata-list-context';
import { Grid } from './Grid.macos.tsrx';
import { Pressable } from './Pressable.macos.tsrx';
import { toChildArray } from './child-array';

function gridColumns(columns: 'multi' | 'single' | number, isStacked: boolean): string {
	if (columns === 'single') {
		return isStacked ? '*' : 'auto,*';
	}

	const n = columns === 'multi' ? 2 : Math.max(1, columns);
	return isStacked
		? Array.from({ length: n }, () => '*').join(',')
		: Array.from({ length: n }, () => 'auto,*').join(',');
}

/** MetadataList — macOS leaf, same structure as the mobile leaf on the
 *  AppKit host. */
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
			id={props.id}
			className={cx('vx-metadatalist', props.className)}
			style={{ flexDirection: 'column', ...props.style }}
			flexDirection="column"
		>
			{props.title != null ? (
				<flexboxlayout style={{ marginBottom: 12 }}>
					{typeof props.title === 'string' || typeof props.title === 'number'
						? <label whiteSpace="normal" style={{ fontWeight: 600 }}>{props.title}</label>
						: props.title}
				</flexboxlayout>
			) : null}
			{isHorizontal ? (
				<flexboxlayout className="flex-row" flexDirection="row" gap={16}>
					{visibleChildren}
				</flexboxlayout>
			) : (
				<Grid columns={gridColumns(columns, isStacked)} className="vx-metadatalist-list">
					{visibleChildren}
				</Grid>
			)}
			{isExceedMax ? (
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={isShowAll ? 'Show less' : 'Show more'}
					onPress={() => setIsShowAll((prev) => !prev)}
				>
					<label className="text-sm" style={{ paddingTop: 8, paddingBottom: 8, color: '#2563eb' }}>
						{isShowAll ? 'Show less' : 'Show more'}
					</label>
				</Pressable>
			) : null}
		</flexboxlayout>
	</MetadataListProvider>
}
