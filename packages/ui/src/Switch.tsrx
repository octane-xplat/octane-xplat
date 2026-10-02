/** @jsxImportSource @nativescript-community/octane */
import type { SwitchProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from "./escape-props";
import { useFieldControlProps } from './field-context';

/** Self-drawn switch — flexbox track + thumb view, identical pixels across
 *  targets. The `.vx-switch--on` state class flips justify-content, which
 *  slides the thumb. The platform widget (UISwitch/MaterialSwitch) lives
 *  in `ui/ios` + `ui/android`. */
export function Switch(inputProps: SwitchProps) @{
	const props = useFieldControlProps(inputProps);
	const isBlocked = props.isDisabled || props.isReadOnly;

	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-switch', props.checked ? 'vx-switch--on' : undefined, props.isDisabled && 'vx-switch--disabled', props.isReadOnly && 'vx-switch--readonly', props.isLoading && 'vx-switch--loading', props.status && `vx-switch--status-${props.status.type}`, props.size && `vx-switch--size-${props.size}`, props.className)}
		style={props.style}
		accessibilityRole={nativeAccessibilityRole('switch') as any}
		accessibilityLabel={props.ariaLabel ?? props.fieldLabel ?? props.label}
		accessibilityHint={props.accessibilityHint}
		accessibilityState={nativeAccessibilityState({ checked: props.checked ?? false, disabled: props.isDisabled }) as any}
		onTap={isBlocked ? undefined : () => props.onCheckedChange?.(!(props.checked ?? false))}
	>
		<flexboxlayout className="vx-switch-thumb" />
	</flexboxlayout>
}
