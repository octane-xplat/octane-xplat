/** @jsxImportSource @octane-xplat/macos-renderer */
import { mergeStyle } from './style-merge'
import type { TimelineProps } from './props'
import { cx } from '@octane-xplat/lib'
import { applyEscapeProps } from './escape-props'
import { Icon } from './Icon.macos.tsrx'

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
				{/* rail/dot/line metrics are CSS on web — inline equivalents
				   here (AppKit has no style layer); keep in step with
				   .vx-timeline-* */}
				<masonview
					className="vx-timeline-rail"
					style={mergeStyle(
						{ alignItems: 'center' },
						mergeStyle({ display: 'flex' }, { width: 20 }),
					)}
				>
					<masonview
						className="vx-timeline-dot"
						style={mergeStyle(
							{ display: 'flex' },
							{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#171717' },
						)}
					>
						{e.item.icon ? <Icon name={e.item.icon} /> : null}
					</masonview>
					{e.i < props.items.length - 1 ? (
						<masonview
							className="vx-timeline-line flex-1"
							style={mergeStyle(
								{ display: 'flex' },
								{ width: 1, backgroundColor: '#d4d4d4' },
							)}
						/>
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
