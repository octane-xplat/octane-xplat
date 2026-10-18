/** @jsxImportSource @nativescript-community/octane */
import type { TimelineProps } from "./props";
import { cx } from "@octane-xplat/lib";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon';

/** Timeline — vertical event list: dot + connector + content per item. */
export function Timeline(props: TimelineProps) @{
	<masonview display="flex" ref={(v: any) => applyEscapeProps(v, props)} id={props.id} className={cx('vx-timeline', props.className)} style={props.style as any}>
		@for (const e of props.items.map((item, i) => ({ item, i })); key e.item.key) {
			<masonview display="flex" className="vx-timeline-item">
				<masonview display="flex" className="vx-timeline-rail">
					<masonview display="flex" className="vx-timeline-dot">{e.item.icon ? <Icon name={e.item.icon} /> : null}</masonview>
					{e.i < props.items.length - 1 ? <masonview display="flex" className="vx-timeline-line" /> : null}
				</masonview>
				<masonview display="flex" className="vx-timeline-body">
					{e.item.time != null ? <label className="vx-timeline-time" text={e.item.time} /> : null}
					{e.item.title != null ? <label className="vx-timeline-title" text={e.item.title} /> : null}
					{e.item.description != null ? <label className="vx-timeline-desc" text={e.item.description} /> : null}
				</masonview>
			</masonview>
		}
	</masonview>
}
