/** @jsxImportSource @nativescript-community/octane */
import type { ProgressGroupProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Meter } from './Meter';

/** ProgressGroup — stacked labeled Meter rows. */
export function ProgressGroup(props: ProgressGroupProps) @{
	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-progressgroup', props.className)} style={props.style}>
		@for (const item of props.items; key item.key) {
			<flexboxlayout className="vx-progressgroup-row">
				<Meter value={item.value} max={item.max} accessibilityLabel={item.label} />
				{item.label != null ? <label className="vx-progressgroup-label" text={item.label} /> : null}
			</flexboxlayout>
		}
	</flexboxlayout>
}
