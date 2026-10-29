/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle, styleRecord } from '../../internal/layout/style-merge'
import { useContext } from 'octane'
import type { MetadataListItemProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { MetadataListContext } from './metadata-list-context'
import { isRenderable } from '../../internal/rendering/is-renderable'

function childContent(children: any, className: string, style?: any) @{
	if (typeof children === 'string' || typeof children === 'number') {
		return (
			<label className={className} whiteSpace="normal" style={style}>
				{children}
			</label>
		)
	}

	return (
		<masonview className={className} style={mergeStyle({ display: 'flex' }, style)}>
			{children}
		</masonview>
	)
}

/** One label/value item — macOS leaf matching the mobile structure. */
export function MetadataListItem(props: MetadataListItemProps) @{
	const ctx = useContext(MetadataListContext)
	const isStacked = (ctx?.labelPosition ?? 'start') === 'top' || ctx?.orientation === 'horizontal'

	const labelRow = (
		<masonview
			className="vx-metadatalist-label"
			style={mergeStyle(
				{ flexDirection: 'row' },
				mergeStyle(
					{ display: 'flex' },
					ctx?.labelWidth != null ? { width: ctx.labelWidth } : undefined,
				),
			)}
		>
			{isRenderable(props.icon) ? props.icon : null}
			<label className="vx-metadatalist-label-text text-sm text-muted" whiteSpace="normal">
				{props.label}
			</label>
		</masonview>
	)

	if (isStacked) {
		return (
			<masonview
				id={props.id}
				className={cx('vx-metadatalist-item', props.className)}
				style={mergeStyle(
					{ flexDirection: 'column' },
					mergeStyle(
						{ display: 'flex' },
						{ flexDirection: 'column', marginBottom: 8, ...styleRecord(props.style) },
					),
				)}
			>
				{labelRow}
				{childContent(props.children, 'vx-metadatalist-value')}
			</masonview>
		)
	}

	return (
		<>
			{labelRow}
			{childContent(props.children, 'vx-metadatalist-value', { marginBottom: 8 })}
		</>
	)
}
