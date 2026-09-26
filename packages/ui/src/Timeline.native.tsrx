/** @jsxImportSource @nativescript-community/octane */
import type { TimelineProps } from "./props";
import { cx } from "./cx";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.native.tsrx';

/** Timeline — vertical event list: dot + connector + content per item. */
export function Timeline(props: TimelineProps) @{
	<flexboxlayout ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-timeline', props.className)} style={props.style}>
		@for (const e of props.items.map((item, i) => ({ item, i })); key e.item.key) {
			<flexboxlayout className="vx-timeline-item">
				<flexboxlayout className="vx-timeline-rail">
					<flexboxlayout className="vx-timeline-dot">{e.item.icon ? <Icon name={e.item.icon} /> : null}</flexboxlayout>
					{e.i < props.items.length - 1 ? <flexboxlayout className="vx-timeline-line" /> : null}
				</flexboxlayout>
				<flexboxlayout className="vx-timeline-body">
					{e.item.time != null ? <label className="vx-timeline-time" text={e.item.time} /> : null}
					{e.item.title != null ? <label className="vx-timeline-title" text={e.item.title} /> : null}
					{e.item.description != null ? <label className="vx-timeline-desc" text={e.item.description} /> : null}
				</flexboxlayout>
			</flexboxlayout>
		}
	</flexboxlayout>
}
