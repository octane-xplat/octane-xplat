/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { SelectorOptionProps } from '../../props'
import { applyEscapeProps } from '../overlays/escape-props'

/** `SelectorOption` — the styled option row used inside `renderOption`/
 *  `renderValue` results (Astryx part): icon lane, label, description. */
export function SelectorOption(props: SelectorOptionProps) @{
	<masonview
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		className={['vx-selectoroption', props.className]}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		{props.icon != null ? (
			<masonview className="vx-selectoroption-icon" style={{ display: 'flex' }}>
				{props.icon}
			</masonview>
		) : null}
		<masonview
			className="vx-selectoroption-text"
			style={{ display: 'flex', flexDirection: 'column' }}
		>
			{props.label != null ? (
				<label className="vx-selectoroption-label" text={props.label} />
			) : null}
			{props.description != null ? (
				<label className="vx-selectoroption-description" text={props.description} />
			) : null}
		</masonview>
	</masonview>
}
