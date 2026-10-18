/** @jsxImportSource @octane-xplat/macos-renderer */
import type { CardProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";

/** Card — container with optional header/footer slots. */
export function Card(props: CardProps) @{
	<masonview display="flex" ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-card', props.variant && `vx-card--${props.variant}`, props.elevation && `vx-card--elev-${props.elevation}`, props.className)} style={{...(props.style as any),padding:props.padding==null?undefined:props.padding*4,width:props.width,height:props.height,maxWidth:props.maxWidth}}>
		{props.header != null ? <masonview display="flex" className="vx-card-header">{props.header}</masonview> : null}
		<masonview display="flex" className="vx-card-body">{props.children}</masonview>
		{props.footer != null ? <masonview display="flex" className="vx-card-footer">{props.footer}</masonview> : null}
	</masonview>
}
