/** @jsxImportSource @nativescript-community/octane */
import type { EmptyProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.native.tsrx';

/** Empty — empty-state block: icon + title + description + actions. */
export function Empty(props: EmptyProps) @{
	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-empty', props.className)} style={props.style}>
		{props.icon ? <Icon name={props.icon} className="vx-empty-icon" /> : null}
		{props.title != null ? <label className="vx-empty-title" text={props.title} /> : null}
		{props.description != null ? <label className="vx-empty-desc" text={props.description} /> : null}
		{props.children}
	</flexboxlayout>
}
