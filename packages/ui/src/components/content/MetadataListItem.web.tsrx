/** @jsxImportSource @octane-xplat/jsx/dom */
import { useContext } from 'octane'
import type { MetadataListItemProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'
import { MetadataListContext } from './metadata-list-context'
import { isRenderable } from '../../internal/rendering/is-renderable'
import type { JSX } from 'octane/jsx-runtime'

/** One label/value item in a MetadataList. 'top' position (or horizontal
 *  orientation) wraps dt+dd in a single grid cell; 'start' emits dt and dd
 *  as separate grid children so label tracks align across items. */
export function MetadataListItem(props: MetadataListItemProps): JSX.Element @{
	const ctx = useContext(MetadataListContext)
	const isStacked = (ctx?.labelPosition ?? 'start') === 'top' || ctx?.orientation === 'horizontal'

	const labelContent = (
		<>
			{isRenderable(props.icon) ? <span className="vx-metadatalist-icon">{props.icon}</span> : null}
			{props.label}
		</>
	)

	if (isStacked) {
		return (
			<div
				ref={(e: any) => applyEscapeProps(e, props)}
				id={props.id}
				className={['vx-metadatalist-item', props.className]}
				style={props.style}
			>
				<dt className="vx-metadatalist-label">{labelContent}</dt>
				<dd className="vx-metadatalist-value">{props.children}</dd>
			</div>
		)
	}

	return (
		<>
			<dt
				ref={(e: any) => applyEscapeProps(e, props)}
				id={props.id}
				className={['vx-metadatalist-label', props.className]}
				style={props.style}
			>
				{labelContent}
			</dt>
			<dd className="vx-metadatalist-value">{props.children}</dd>
		</>
	)
}
