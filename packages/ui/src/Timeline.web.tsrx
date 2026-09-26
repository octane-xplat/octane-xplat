import type { TimelineProps } from "./props";
import { applyEscapeProps } from "./escape-props";
import { Icon } from './Icon.web.tsrx';

/** Timeline — vertical event list: dot + connector + content per item. */
export function Timeline(props: TimelineProps) @{
	<div ref={(e: any) => applyEscapeProps(e, props)} id={props.id} className={['vx-timeline', props.className]} style={props.style}>
		{props.items.map((item: any, i: number) => (
			<div key={item.key} className="vx-timeline-item">
				<div className="vx-timeline-rail" aria-hidden="true">
					<div className="vx-timeline-dot">{item.icon ? <Icon name={item.icon} /> : null}</div>
					{i < props.items.length - 1 ? <div className="vx-timeline-line" /> : null}
				</div>
				<div className="vx-timeline-body">
					{item.time != null ? <span className="vx-timeline-time">{item.time}</span> : null}
					{item.title != null ? <span className="vx-timeline-title">{item.title}</span> : null}
					{item.description != null ? <span className="vx-timeline-desc">{item.description}</span> : null}
				</div>
			</div>
		))}
	</div>
}
