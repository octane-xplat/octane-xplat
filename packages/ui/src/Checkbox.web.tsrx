import type { CheckboxProps } from "./props";
import { applyEscapeProps } from "./escape-props";

/** Self-drawn checkbox — box + ✓ glyph, identical layout across targets.
 *  Toggles on click, Space, and Enter. The platform look (if wanted) is an
 *  app's own choice — there is no OS checkbox widget in the subpaths. */
export function Checkbox(props: CheckboxProps) @{
	const toggle = () => props.onCheckedChange?.(!(props.checked ?? false));

	<div
		ref={(e: any) => applyEscapeProps(e, props)}
		id={props.id}
		role="checkbox"
		aria-checked={props.checked ?? false}
		aria-disabled={props.disabled ?? undefined}
		aria-label={props.accessibilityLabel}
		tabIndex={props.disabled ? undefined : 0}
		className={['vx-checkbox-row', props.checked ? 'vx-checkbox--on' : undefined, props.disabled ? 'vx-checkbox--disabled' : undefined, props.className]}
		style={props.style}
		onClick={props.disabled ? undefined : toggle}
		onKeyDown={(e: any) => {
			if (props.disabled) return;
			if (e.key === ' ' || e.key === 'Enter') {
				e.preventDefault();
				toggle();
			}
		}}
	>
		<div className="vx-checkbox" aria-hidden="true">
			{props.checked ? <span className="vx-checkbox-check">✓</span> : null}
		</div>
		{props.label != null ? <span className="vx-checkbox-label">{props.label}</span> : null}
	</div>
}
