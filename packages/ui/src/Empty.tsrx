/** @jsxImportSource @nativescript-community/octane */
import { mergeStyle } from './style-merge'
import type { EmptyProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon';

/** Empty — empty-state block: icon + title + description + actions. */
export function Empty(props: EmptyProps) @{
	<masonview ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-empty', props.className)} style={mergeStyle({display: "flex"}, props.style)}>
		{props.icon ? <Icon name={props.icon} className="vx-empty-icon" /> : null}
		{props.title != null ? <label className="vx-empty-title" text={props.title} /> : null}
		{props.description != null ? <label className="vx-empty-desc" text={props.description} /> : null}
		{props.children}
	</masonview>
}
