/** @jsxImportSource @nativescript-community/octane */
import type { FieldGroupProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** FieldGroup — labeled group of related fields. */
export function FieldGroup(props: FieldGroupProps) @{
	<flexboxlayout
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-fieldgroup', props.className)}
		style={props.style}
	>
		{props.label != null ? <label className="vx-fieldgroup-label" text={props.label} /> : null}
		{props.children}
	</flexboxlayout>
}
