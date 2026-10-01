/** @jsxImportSource @xplat/macos/renderer */
import type { CardProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";

/** Card — container with optional header/footer slots. */
export function Card(props: CardProps) @{
	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-card', props.variant && `vx-card--${props.variant}`, props.elevation && `vx-card--elev-${props.elevation}`, props.className)} style={{...props.style,padding:props.padding==null?undefined:props.padding*4,width:props.width,height:props.height,maxWidth:props.maxWidth}}>
		{props.header != null ? <flexboxlayout className="vx-card-header">{props.header}</flexboxlayout> : null}
		<flexboxlayout className="vx-card-body">{props.children}</flexboxlayout>
		{props.footer != null ? <flexboxlayout className="vx-card-footer">{props.footer}</flexboxlayout> : null}
	</flexboxlayout>
}
