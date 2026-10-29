/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useState } from 'octane'
import type { MetadataListProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { MetadataListProvider } from './metadata-list-context'
import { Grid } from '../layout/Grid.tsrx'
import { Pressable } from '../actions/Pressable'
import { toChildArray } from '../../internal/rendering/child-array'

/** Repeat an 'auto,*' label/value track pair (or a '*' cell for stacked
 *  items) n times for a fixed column count. */
function gridColumns(columns: 'multi' | 'single' | number, isStacked: boolean): string {
	if (columns === 'single') {
		return isStacked ? '*' : 'auto,*'
	}

	const n = columns === 'multi' ? 2 : Math.max(1, columns)
	return isStacked
		? Array.from({ length: n }, () => '*').join(',')
		: Array.from({ length: n }, () => 'auto,*').join(',')
}

/** MetadataList — labeled key/value list. 'start' labels place each item's
 *  label and value as adjacent Grid cells so label tracks align; 'top' and
 *  horizontal place one cell per item. 'multi' resolves to two equal columns
 *  on native (there is no auto-fill sizing in GridLayout); a numeric `columns`
 *  is exact. */
export function MetadataList(props: MetadataListProps) @{
	const columns = props.columns ?? 'single'
	const orientation = props.orientation ?? 'vertical'
	const isHorizontal = orientation === 'horizontal'
	const labelPosition =
		props.label?.position ??
		(isHorizontal || columns === 'multi' || (typeof columns === 'number' && columns > 1)
			? 'top'
			: 'start')

	const isStacked = labelPosition === 'top' || isHorizontal

	const [isShowAll, setIsShowAll] = useState(false)
	const childrenArray = typeof props.children === 'function' ? [] : toChildArray(props.children)
	const effectiveMax = isHorizontal ? undefined : props.maxNumOfItems
	const isExceedMax = effectiveMax != null && childrenArray.length > effectiveMax
	const visibleChildren =
		isExceedMax && !isShowAll ? childrenArray.slice(0, effectiveMax) : childrenArray

	<MetadataListProvider value={{ labelPosition, labelWidth: props.label?.width, orientation }}>
		<masonview
			ref={(v: any) => applyEscapeProps(v, props)}
			id={props.id}
			className={cx('vx-metadatalist', props.className)}
			style={mergeStyle({ display: 'flex' }, { ...styleRecord(props.style) })}
		>
			{props.title != null ? (
				<masonview
					className="vx-metadatalist-title"
					style={mergeStyle({ display: 'flex' }, { marginBottom: 12 })}
				>
					{typeof props.title === 'string' || typeof props.title === 'number' ? (
						<label whiteSpace="normal" style={{ fontWeight: 600 }}>
							{props.title}
						</label>
					) : (
						props.title
					)}
				</masonview>
			) : null}
			{isHorizontal ? (
				<masonview
					className="vx-metadatalist-list vx-metadatalist--horizontal"
					style={mergeStyle(
						{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
						{ display: 'flex' },
					)}
				>
					{childrenArray.length ? visibleChildren : props.children}
				</masonview>
			) : (
				<Grid columns={gridColumns(columns, isStacked)} className="vx-metadatalist-list">
					{childrenArray.length ? visibleChildren : props.children}
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
					<label
						className="vx-metadatalist-toggle-label"
						style={{ paddingTop: 8, paddingBottom: 8 }}
					>
						{isShowAll ? 'Show less' : 'Show more'}
					</label>
				</Pressable>
			) : null}
		</masonview>
	</MetadataListProvider>
}
