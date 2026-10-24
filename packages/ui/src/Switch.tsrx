/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import { useState, useContext } from 'octane';
import type { SwitchProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from "./escape-props";
import { FieldContext, useFieldControlProps } from './field-context';

/** Self-drawn switch — flexbox track + thumb view, identical pixels across
 *  targets. The `.vx-switch--on` state class flips justify-content, which
 *  slides the thumb. The platform widget (UISwitch/MaterialSwitch) lives
 *  in `ui/ios` + `ui/android`. */
function SwitchControl(inputProps: SwitchProps) @{
	const props = useFieldControlProps(inputProps);
	const [internal, setInternal] = useState(props.defaultChecked ?? false);
	const checked = props.checked ?? internal;
	const isBlocked = props.isDisabled || props.isReadOnly;
	const toggle = () => {
		if (props.checked === undefined) setInternal(!checked);
		props.onCheckedChange?.(!checked);
	};

	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} testID={props.testID ?? ''} className={cx('vx-switch', checked ? 'vx-switch--on' : undefined, props.isDisabled && 'vx-switch--disabled', props.isReadOnly && 'vx-switch--readonly', props.isLoading && 'vx-switch--loading', props.status && `vx-switch--status-${props.status.type}`, props.size && `vx-switch--size-${props.size}`, props.className)} style={mergeStyle({display: "flex"}, props.style)} accessibilityRole={nativeAccessibilityRole('switch')} accessibilityLabel={props.ariaLabel ?? props.fieldLabel ?? props.label} accessibilityHint={props.accessibilityHint} accessibilityState={nativeAccessibilityState({ checked, disabled: props.isDisabled })} onTap={isBlocked ? undefined : toggle}>
		<masonview className="vx-switch-thumb" style={{display: "flex"}}/>
	</masonview>
}

/** Standalone Switch renders its own field chrome — the label column beside
 *  the track (tapping the row toggles) and a detached status line below.
 *  Inside a FormField the field owns that chrome. */
export function Switch(inputProps: SwitchProps) @{
	const props = useFieldControlProps(inputProps);
	const inField = useContext(FieldContext) != null;
	const needsChrome = !inField && (props.label != null || props.description != null || props.status != null);
	const [internal, setInternal] = useState(props.defaultChecked ?? false);
	const checked = props.checked ?? internal;
	const isBlocked = props.isDisabled || props.isReadOnly;
	// One owner for the state: the wrapped control is driven as controlled so
	// a tap on the track and a tap on the label stay in sync.
	const setChecked = (next: boolean) => {
		if (props.checked === undefined) setInternal(next);
		props.onCheckedChange?.(next);
	};
	@if (needsChrome) {
		<masonview style={{display: "flex", flexDirection: "column"}}>
			<masonview style={{display: "flex", flexDirection: "row", alignItems: "center", gap: 8}}>
				<SwitchControl {...inputProps} checked={checked} onCheckedChange={setChecked} />
				{props.label != null || props.description != null ? (
					<masonview style={{display: "flex", flexDirection: "column", flexGrow: 1}} onTap={isBlocked ? undefined : () => setChecked(!checked)}>
						{props.label != null ? <label className="vx-field-label" text={props.label} /> : null}
						{props.description != null ? <label className="vx-field-description" text={props.description} /> : null}
					</masonview>
				) : null}
			</masonview>
			{props.status?.message != null ? <masonview className={cx('vx-field-status', `vx-field-status--${props.status.type}`, 'vx-field-status--detached')}><label text={props.status.message} /></masonview> : null}
		</masonview>
	} @else {
		<SwitchControl {...inputProps} />
	}
}
