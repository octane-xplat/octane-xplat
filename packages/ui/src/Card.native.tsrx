/** @jsxImportSource @nativescript-community/octane */
import type { CardProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Card — container with optional header/footer slots. */
export function Card(props: CardProps) @{
	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-card', props.className)} style={props.style}>
		{props.header != null ? <flexboxlayout className="vx-card-header">{props.header}</flexboxlayout> : null}
		<flexboxlayout className="vx-card-body">{props.children}</flexboxlayout>
		{props.footer != null ? <flexboxlayout className="vx-card-footer">{props.footer}</flexboxlayout> : null}
	</flexboxlayout>
}
