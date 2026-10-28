/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from './style-merge'
import { useState } from 'octane'
import type { ChatToolCallItem, ChatToolCallStatus, ChatToolCallsProps } from './props'
import { cx } from '@octane-xplat/lib'
import { Icon } from './Icon'
import { Badge } from './Badge'
import { ActivityIndicator } from './ActivityIndicator.tsrx'
import { nativeAccessibilityRole, nativeAccessibilityState } from './escape-props'

const STATUS_ICON: Record<ChatToolCallStatus, string | null> = {
	pending: 'xplat-clock',
	running: null,
	complete: 'xplat-check',
	error: 'xplat-error',
}

function statusAnnouncement(status: ChatToolCallStatus, errorMessage?: string): string {
	if (status === 'error' && errorMessage != null) {
		return `Error: ${errorMessage}`
	}

	switch (status) {
		case 'pending':
			return 'Pending'
		case 'running':
			return 'Running'
		case 'complete':
			return 'Complete'
		case 'error':
			return 'Error'
	}
}

/** Single tool-call row — status icon, name, node chip, target, diff stats,
 *  duration, and a tappable expandable detail region. */
function CallRow(props: { call: ChatToolCallItem }) @{
	const call = props.call
	const status = call.status ?? 'complete'
	const hasDetail = call.resultDetail != null
	const [isDetailOpen, setIsDetailOpen] = useState(false)

	const row = (
		<masonview
			className={cx('vx-chattools-row', hasDetail && 'vx-chattools-row--toggle')}
			accessibilityRole={hasDetail ? nativeAccessibilityRole('button') : undefined}
			accessibilityState={
				hasDetail ? nativeAccessibilityState({ expanded: isDetailOpen }) : undefined
			}
			onTap={hasDetail ? () => setIsDetailOpen((v) => !v) : undefined}
			style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
		>
			<masonview
				className={cx('vx-chattools-status', `vx-chattools-status--${status}`)}
				accessibilityLabel={statusAnnouncement(status, call.errorMessage)}
				style={{ display: 'flex' }}
			>
				{status === 'running' || status === 'pending' ? (
					<ActivityIndicator />
				) : (
					<Icon name={STATUS_ICON[status] ?? 'xplat-check'} size={12} />
				)}
			</masonview>
			<label className="vx-chattools-name" text={call.name} />
			{call.node != null ? (
				<Badge className="vx-chattools-node">
					<label text={call.node} />
				</Badge>
			) : null}
			{call.target != null ? <label className="vx-chattools-target" text={call.target} /> : null}
			{call.additions != null || call.deletions != null || call.stats != null ? (
				<masonview
					className="vx-chattools-stats"
					style={mergeStyle({ flexDirection: 'row' }, { display: 'flex' })}
				>
					{call.additions != null ? (
						<label className="vx-chattools-add" text={`+${call.additions}`} />
					) : null}
					{call.deletions != null ? (
						<label className="vx-chattools-del" text={`-${call.deletions}`} />
					) : null}
					{call.stats}
				</masonview>
			) : null}
			{call.duration != null && status === 'complete' ? (
				<label className="vx-chattools-duration" text={call.duration} />
			) : null}
			{hasDetail ? (
				<masonview
					className={cx('vx-chattools-chev', isDetailOpen && 'vx-chattools-chev--open')}
					style={{ display: 'flex' }}
				>
					<Icon name="xplat-chevron-down" size={12} />
				</masonview>
			) : null}
		</masonview>
	)

	if (!hasDetail) {
		return row
	}

	return (
		<masonview style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}>
			{row}
			{isDetailOpen ? (
				<masonview className="vx-chattools-detail" style={{ display: 'flex' }}>
					{call.resultDetail}
				</masonview>
			) : null}
		</masonview>
	)
}

/** Tool/function call list from an LLM response. A single call renders
 *  inline with no group chrome; multiple collapse behind a header showing
 *  the latest call and a count. */
export function ChatToolCalls(props: ChatToolCallsProps) @{
	const isControlled = props.isExpanded !== undefined
	const [internalExpanded, setInternalExpanded] = useState(props.defaultIsExpanded ?? false)
	const isExpanded = isControlled ? props.isExpanded : internalExpanded

	if (!props.calls || props.calls.length === 0) {
		return null
	}

	const toggle = () => {
		const next = !isExpanded
		if (!isControlled) {
			setInternalExpanded(next)
		}

		props.onExpandedChange?.(next)
	}

	if (props.calls.length === 1) {
		return (
			<masonview
				id={props.id}
				className={cx('vx-chattools', props.className)}
				style={mergeStyle({ display: 'flex' }, props.style)}
			>
				<CallRow call={props.calls[0]} />
			</masonview>
		)
	}

	const latest = props.calls[props.calls.length - 1]
	const latestStatus = latest.status ?? 'complete'

	<masonview
		id={props.id}
		className={cx('vx-chattools', props.className)}
		style={mergeStyle({ display: 'flex' }, props.style)}
	>
		<masonview
			className="vx-chattools-header"
			accessibilityRole={nativeAccessibilityRole('button')}
			accessibilityState={nativeAccessibilityState({ expanded: isExpanded })}
			onTap={toggle}
			style={mergeStyle({ flexDirection: 'row', alignItems: 'center' }, { display: 'flex' })}
		>
			{isExpanded ? (
				<>
					<masonview className="vx-chattools-status" style={{ display: 'flex' }}>
						<Icon name="xplat-wrench" size={14} />
					</masonview>
					<label
						className="vx-chattools-grouplabel"
						text={props.label ?? `${props.calls.length} tool calls`}
					/>
				</>
			) : (
				<>
					<masonview
						className={cx('vx-chattools-status', `vx-chattools-status--${latestStatus}`)}
						accessibilityLabel={statusAnnouncement(latestStatus, latest.errorMessage)}
						style={{ display: 'flex' }}
					>
						{latestStatus === 'running' || latestStatus === 'pending' ? (
							<ActivityIndicator />
						) : (
							<Icon name={STATUS_ICON[latestStatus] ?? 'xplat-check'} size={12} />
						)}
					</masonview>
					<label className="vx-chattools-name" text={latest.name} />
					{latest.target != null ? (
						<label className="vx-chattools-target" text={latest.target} />
					) : null}
				</>
			)}
			<masonview
				className="vx-chattools-count"
				style={mergeStyle(
					{ flexDirection: 'row', flexGrow: 1, justifyContent: 'flex-end' },
					{ display: 'flex' },
				)}
			>
				{!isExpanded ? (
					<>
						<Icon name="xplat-wrench" size={12} />
						<label text={`${props.calls.length}`} />
					</>
				) : null}
			</masonview>
			<masonview
				className={cx('vx-chattools-chev', isExpanded && 'vx-chattools-chev--open')}
				style={{ display: 'flex' }}
			>
				<Icon name="xplat-chevron-down" size={12} />
			</masonview>
		</masonview>
		{isExpanded ? (
			<masonview
				className="vx-chattools-list"
				style={mergeStyle({ flexDirection: 'column' }, { display: 'flex' })}
			>
				{props.calls.map((call) => (
					<CallRow call={call} />
				))}
			</masonview>
		) : null}
	</masonview>
}
