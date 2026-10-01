import type { SwitchProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Self-drawn switch — track + thumb, identical pixels across targets.
 *  The platform widget (UISwitch/MaterialSwitch) lives in `ui/ios` +
 *  `ui/android`. Toggles on click, Space, and Enter. */
export function Switch(props: SwitchProps) @{
	const isBlocked = props.isDisabled || props.isReadOnly;
	const toggle = () => {
		if (!isBlocked) props.onCheckedChange?.(!(props.checked ?? false));
	};

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		role="switch"
		aria-checked={props.checked ?? false}
		aria-disabled={props.isDisabled || undefined}
		aria-readonly={props.isReadOnly || undefined}
		aria-busy={props.isLoading || undefined}
		aria-required={props.isRequired && !props.isOptional || undefined}
		aria-invalid={props.status?.type === 'error' || undefined}
		aria-label={props.label}
		tabIndex={props.isDisabled ? undefined : 0}
		className={['vx-switch', props.checked ? 'vx-switch--on' : undefined, props.isDisabled ? 'vx-switch--disabled' : undefined, props.isReadOnly ? 'vx-switch--readonly' : undefined, props.isLoading ? 'vx-switch--loading' : undefined, props.status ? `vx-switch--status-${props.status.type}` : undefined, props.size ? `vx-switch--size-${props.size}` : undefined, props.className]}
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
