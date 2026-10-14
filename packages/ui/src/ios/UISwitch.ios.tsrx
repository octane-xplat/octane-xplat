/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useRef } from 'octane';
import type { UISwitchProps } from "../props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from "../escape-props";
import { useFieldControlProps } from '../field-context';

/** UISwitch — the platform widget (UIKit UISwitch via NativeScript `switch`).
 *  OS chrome is the point here; the self-drawn shared `Switch` lives in the
 *  root export. A bare widget: `label`/`description` are spoken, not drawn —
 *  visible field chrome belongs to `Field`. `isDisabled` maps to `isEnabled`;
 *  `isReadOnly` blocks toggling (interaction off, change reverted) while
 *  keeping the enabled appearance. */
export function UISwitch(inputProps: UISwitchProps) @{
	const props = useFieldControlProps(inputProps);
	const el = useRef<any>(null);
	// Last confirmed value for the `isReadOnly` revert — `checked` when
	// controlled, the widget's own state otherwise.
	const lastChecked = useRef(props.checked ?? props.defaultChecked ?? false);
	// Uncontrolled widgets own their checked state — seed it once; a bound
	// `checked` write would fight the user's next toggle on re-render.
	useEffect(() => {
		if (el.current && props.checked === undefined && props.defaultChecked !== undefined) {
			el.current.checked = props.defaultChecked;
		}
	}, []);

	<switch
		ref={(v: any) => { el.current = v; applyEscapeProps(v, props); }}
		id={props.id}
		testID={props.testID ?? ''}
		className={cx(props.className)}
		style={props.style}
		checked={props.checked}
		isEnabled={!props.isDisabled}
		isUserInteractionEnabled={!props.isReadOnly}
		accessibilityRole={nativeAccessibilityRole('switch') as any}
		accessibilityLabel={props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled }) as any}
		onCheckedChange={(e: any) => {
			// VoiceOver activation can still fire on a non-interactive view —
			// revert so `isReadOnly` means the value truly cannot change.
			if (props.isReadOnly) {
				const expected = props.checked ?? lastChecked.current;
				if (e.value !== expected) e.object.checked = expected;
				return;
			}

			lastChecked.current = e.value;
			props.onCheckedChange?.(e.value);
		}}
	/>
}
