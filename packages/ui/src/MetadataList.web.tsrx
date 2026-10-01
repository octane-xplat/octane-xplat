import { useId, useState } from 'octane';
import type { MetadataListProps } from './props';
import { applyEscapeProps } from './escape-props';
import { MetadataListProvider } from './metadata-list-context';
import { toChildArray } from './child-array';

/** MetadataList — a definition list of labeled key/value items.
 *  'start' labels render dt/dd as direct grid children so all labels share
 *  one auto-sized track; 'top' labels stack per item. 'multi' auto-fills
 *  minmax(280px,1fr) columns; a numeric `columns` gives fixed tracks.
 *  Horizontal orientation ignores `columns`, `label`, and `maxNumOfItems`. */
export function MetadataList(props: MetadataListProps) @{
	const columns = props.columns ?? 'single';
	const orientation = props.orientation ?? 'vertical';
	const isHorizontal = orientation === 'horizontal';
	// Default label position: 'top' for multi-column and horizontal layouts,
	// 'start' for single-column — the upstream contract.
	const labelPosition =
		props.label?.position ??
		(isHorizontal || columns === 'multi' || (typeof columns === 'number' && columns > 1)
			? 'top'
			: 'start');

	const isStacked = labelPosition === 'top' || isHorizontal;

	const [isShowAll, setIsShowAll] = useState(false);
	const contentId = useId();

	const childrenArray = toChildArray(props.children);
	const effectiveMax = isHorizontal ? undefined : props.maxNumOfItems;
	const isExceedMax = effectiveMax != null && childrenArray.length > effectiveMax;
	const visibleChildren =
		isExceedMax && !isShowAll ? childrenArray.slice(0, effectiveMax) : childrenArray;

	let gridTemplateColumns: string | undefined;
	if (!isHorizontal) {
		if (typeof columns === 'number' && columns > 1) {
			gridTemplateColumns = isStacked
				? `repeat(${columns}, 1fr)`
				: `repeat(${columns}, auto minmax(0, 1fr))`;
		} else if (!isStacked && props.label?.width != null) {
			const width =
				typeof props.label.width === 'number' ? `${props.label.width}px` : props.label.width;

			gridTemplateColumns = `${width} minmax(0, 1fr)`;
		}
	}

	const listClass = isHorizontal
		? 'vx-metadatalist--horizontal'
		: isStacked
			? columns === 'single' || columns === 1
				? 'vx-metadatalist--stacked-single'
				: 'vx-metadatalist--stacked-multi'
			: columns === 'single' || columns === 1
				? 'vx-metadatalist--single'
				: 'vx-metadatalist--multi';

	<MetadataListProvider
		value={{ labelPosition, labelWidth: props.label?.width, orientation }}
	>
		<div
			ref={(e: any) => applyEscapeProps(e, props)}
			id={props.id}
			className={['vx-metadatalist', props.className]}
			style={props.style}
		>
			{props.title != null ? <div className="vx-metadatalist-title">{props.title}</div> : null}
			<dl
				id={contentId}
				className={['vx-metadatalist-list', listClass]}
				style={gridTemplateColumns ? { gridTemplateColumns } : undefined}
			>
				{visibleChildren}
			</dl>
			{isExceedMax ? (
				<button
					type="button"
					className="vx-metadatalist-toggle"
					aria-controls={contentId}
					aria-expanded={isShowAll}
					onClick={() => setIsShowAll((prev) => !prev)}
				>
					{isShowAll ? 'Show less' : 'Show more'}
				</button>
			) : null}
		</div>
	</MetadataListProvider>
}
