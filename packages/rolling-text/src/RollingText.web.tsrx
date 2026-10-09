import type { RollingTextProps } from './props'
import { useRollingText } from './use-rolling.tsrx'
import { layoutChildProps } from './layout-child.web'
import { applyWebProps } from './platformProps.web'

// One complete current value for the accessibility tree while the visual
// cells stay aria-hidden — no outgoing/incoming duplicates.
const SR_ONLY: Record<string, string> = {
	position: 'absolute',
	width: '1px',
	height: '1px',
	padding: '0',
	margin: '-1px',
	overflow: 'hidden',
	clipPath: 'inset(50%)',
	whiteSpace: 'nowrap',
	border: '0',
}

/** Single-line label whose text rolls per unit when `value` changes. */
export function RollingText(props: RollingTextProps) @{
	const roll = useRollingText(props)
	const layout = layoutChildProps(props, { display: 'inline-block', ...props.style })

	<span
		id={props.id}
		data-testid={props.testID}
		ref={(el: any) => applyWebProps(el, props.web)}
		className={['vx-rolling-text', props.className]}
		{...layout}
	>
		<span
			aria-hidden="true"
			ref={roll.attachRow}
			style={{ display: 'inline-flex', overflow: 'hidden', whiteSpace: 'nowrap', verticalAlign: 'top' }}
		>
			@for (const cell of roll.cells; key cell.id) {
				<span ref={roll.attachCell(cell.id)} style={{ display: 'inline-block', whiteSpace: 'pre' }}>
					{cell.unit}
				</span>
			}
		</span>
		<span
			className="vx-rolling-text-value"
			aria-live={!props.accessibilityLiveRegion || props.accessibilityLiveRegion === 'none' ? 'off' : props.accessibilityLiveRegion}
			style={SR_ONLY}
		>
			{roll.label}
		</span>
	</span>
}
