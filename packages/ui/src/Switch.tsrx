/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { SwitchProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from "./escape-props";
import { useFieldControlProps } from './field-context';

/** Self-drawn switch — flexbox track + thumb view, identical pixels across
 *  targets. The `.vx-switch--on` state class flips justify-content, which
 *  slides the thumb. The platform widget (UISwitch/MaterialSwitch) lives
 *  in `ui/ios` + `ui/android`. */
export function Switch(inputProps: SwitchProps) @{
	const props = useFieldControlProps(inputProps);
	const [internal, setInternal] = useState(props.defaultChecked ?? false);
	const checked = props.checked ?? internal;
	const isBlocked = props.isDisabled || props.isReadOnly;
	const toggle = () => {
		if (props.checked === undefined) setInternal(!checked);
		props.onCheckedChange?.(!checked);
	};

	<masonview display="flex" ref={(v: any) => applyEscapeProps(v, props)} id={props.id} testID={props.testID ?? ''} className={cx('vx-switch', checked ? 'vx-switch--on' : undefined, props.isDisabled && 'vx-switch--disabled', props.isReadOnly && 'vx-switch--readonly', props.isLoading && 'vx-switch--loading', props.status && `vx-switch--status-${props.status.type}`, props.size && `vx-switch--size-${props.size}`, props.className)} style={props.style as any} accessibilityRole={nativeAccessibilityRole('switch') as any} accessibilityLabel={props.ariaLabel ?? props.fieldLabel ?? props.label} accessibilityHint={props.accessibilityHint} accessibilityState={nativeAccessibilityState({ checked, disabled: props.isDisabled }) as any} onTap={isBlocked ? undefined : toggle}>
		<masonview display="flex" className="vx-switch-thumb" />
	</masonview>
}
