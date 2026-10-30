/** @jsxImportSource @octane-xplat/jsx/dom */
import type { SelectorOptionProps } from '../../props'
import { applyWebProps } from '../../internal/platform/platformProps.web'
import type { JSX } from 'octane/jsx-runtime'

/** `SelectorOption` — the styled option row used inside `renderOption`/
 *  `renderValue` results (Astryx part): icon lane, label, description. */
export function SelectorOption(props: SelectorOptionProps): JSX.Element @{
	<span
		ref={(e: any) => applyWebProps(e, props.web)}
		id={props.id}
		className={[
			'vx-selectoroption',
			props.isDisabled && 'vx-selectoroption--disabled',
			props.className,
		]}
		style={props.style}
	>
		{props.icon != null ? (
			<span className="vx-selectoroption-icon" aria-hidden="true">
				{props.icon}
			</span>
		) : null}
		<span className="vx-selectoroption-text">
			{props.label != null ? <span className="vx-selectoroption-label">{props.label}</span> : null}
			{props.description != null ? (
				<span className="vx-selectoroption-description">{props.description}</span>
			) : null}
		</span>
	</span>
}
