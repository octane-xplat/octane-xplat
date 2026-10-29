/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../internal/layout/style-merge'
import type { TimelineProps } from '../../props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from '../overlays/escape-props'
import { Icon } from '../media/Icon'

/** Timeline — vertical event list: dot + connector + content per item. */
export function Timeline(props: TimelineProps) @{
	<masonview
		ref={(v: any) => applyEscapeProps(v, props)}
		id={props.id}
		className={cx('vx-timeline', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		@for (const e of props.items.map((item, i) => ({ item, i })); key e.item.key) {
			<masonview className="vx-timeline-item" style={{ display: 'flex' }}>
				<masonview className="vx-timeline-rail" style={{ display: 'flex' }}>
					<masonview className="vx-timeline-dot" style={{ display: 'flex' }}>
						{e.item.icon ? <Icon name={e.item.icon} /> : null}
					</masonview>
					{e.i < props.items.length - 1 ? (
						<masonview className="vx-timeline-line" style={{ display: 'flex' }} />
					) : null}
				</masonview>
				<masonview className="vx-timeline-body" style={{ display: 'flex' }}>
					{e.item.time != null ? (
						<label className="vx-timeline-time" text={e.item.time} />
					) : null}
					{e.item.title != null ? (
						<label className="vx-timeline-title" text={e.item.title} />
					) : null}
					{e.item.description != null ? (
						<label className="vx-timeline-desc" text={e.item.description} />
					) : null}
				</masonview>
			</masonview>
		}
	</masonview>
}
