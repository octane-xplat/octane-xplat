import type { SwitchProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Self-drawn switch — track + thumb, identical pixels across targets.
 *  The platform widget (UISwitch/MaterialSwitch) lives in `ui/ios` +
 *  `ui/android`. Toggles on click, Space, and Enter. */
export function Switch(props: SwitchProps) @{
	const toggle = () => props.onCheckedChange?.(!(props.checked ?? false));

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		role="switch"
		aria-checked={props.checked ?? false}
		tabIndex={0}
		className={['vx-switch', props.checked ? 'vx-switch--on' : undefined, props.className]}
		style={props.style}
		onClick={toggle}
		onKeyDown={(e: any) => {
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				toggle();
			}
		}}
	>
		<div className="vx-switch-thumb" aria-hidden="true" />
	</div>
}
