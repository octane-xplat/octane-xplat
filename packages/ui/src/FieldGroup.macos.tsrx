/** @jsxImportSource @octane-xplat/macos-renderer */
import type { FieldGroupProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";

/** FieldGroup — labeled group of related fields. */
export function FieldGroup(props: FieldGroupProps) @{
	<masonview display="flex" ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-fieldgroup', props.className)} style={props.style} accessibilityRole="group" accessibilityLabel={props.label}>
		{props.label != null ? <label className="vx-fieldgroup-label" text={props.label} /> : null}
		{props.children}
	</masonview>
}
