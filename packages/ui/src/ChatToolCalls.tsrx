/** @jsxImportSource @nativescript-community/octane */
import { useState } from 'octane';
import type { ChatToolCallItem, ChatToolCallStatus, ChatToolCallsProps } from './props';
import { cx } from '@octane-xplat/lib';
import { Icon } from './Icon';
import { Badge } from './Badge';
import { ActivityIndicator } from './ActivityIndicator.tsrx';
import { nativeAccessibilityRole } from './escape-props';

const STATUS_ICON: Record<ChatToolCallStatus, string | null> = {
	pending: 'xplat-clock',
	running: null,
	complete: 'xplat-check',
	error: 'xplat-error',
};

function statusAnnouncement(status: ChatToolCallStatus, errorMessage?: string): string {
	if (status === 'error' && errorMessage != null) return `Error: ${errorMessage}`;
	switch (status) {
		case 'pending': return 'Pending';
		case 'running': return 'Running';
		case 'complete': return 'Complete';
		case 'error': return 'Error';
	}
}

/** Single tool-call row — status icon, name, node chip, target, diff stats,
 *  duration, and a tappable expandable detail region. */
function CallRow(props: { call: ChatToolCallItem }) @{
	const call = props.call;
	const status = call.status ?? 'complete';
	const hasDetail = call.resultDetail != null;
	const [isDetailOpen, setIsDetailOpen] = useState(false);

	const row = (
		<masonview display="flex" className={cx('vx-chattools-row', hasDetail && 'vx-chattools-row--toggle')} flexDirection="row" alignItems="center" accessibilityRole={hasDetail ? (nativeAccessibilityRole('button') as any) : undefined} accessibilityState={hasDetail ? { expanded: isDetailOpen } as any : undefined} onTap={hasDetail ? () => setIsDetailOpen((v) => !v) : undefined}>
			<masonview display="flex" className={cx('vx-chattools-status', `vx-chattools-status--${status}`)} accessibilityLabel={statusAnnouncement(status, call.errorMessage)}>
				{status === 'running' || status === 'pending' ? (
					<ActivityIndicator />
				) : (
					<Icon name={STATUS_ICON[status] ?? 'xplat-check'} size={12} />
				)}
			</masonview>
			<label className="vx-chattools-name" text={call.name} />
			{call.node != null ? <Badge className="vx-chattools-node"><label text={call.node} /></Badge> : null}
			{call.target != null ? <label className="vx-chattools-target" text={call.target} /> : null}
			{call.additions != null || call.deletions != null || call.stats != null ? (
				<masonview display="flex" className="vx-chattools-stats" flexDirection="row">
					{call.additions != null ? <label className="vx-chattools-add" text={`+${call.additions}`} /> : null}
					{call.deletions != null ? <label className="vx-chattools-del" text={`-${call.deletions}`} /> : null}
					{call.stats}
				</masonview>
			) : null}
			{call.duration != null && status === 'complete' ? (
				<label className="vx-chattools-duration" text={call.duration} />
			) : null}
			{hasDetail ? (
				<masonview display="flex" className={cx('vx-chattools-chev', isDetailOpen && 'vx-chattools-chev--open')}>
					<Icon name="xplat-chevron-down" size={12} />
				</masonview>
			) : null}
		</masonview>
	);

	if (!hasDetail) {
		return row;
	}

	return (
		<masonview display="flex" flexDirection="column">
			{row}
			{isDetailOpen ? (
				<masonview display="flex" className="vx-chattools-detail">{call.resultDetail}</masonview>
			) : null}
		</masonview>
	);
}

/** Tool/function call list from an LLM response. A single call renders
 *  inline with no group chrome; multiple collapse behind a header showing
 *  the latest call and a count. */
export function ChatToolCalls(props: ChatToolCallsProps) @{
	const isControlled = props.isExpanded !== undefined;
	const [internalExpanded, setInternalExpanded] = useState(props.defaultIsExpanded ?? false);
	const isExpanded = isControlled ? props.isExpanded : internalExpanded;

	if (!props.calls || props.calls.length === 0) {
		return null;
	}

	const toggle = () => {
		const next = !isExpanded;
		if (!isControlled) setInternalExpanded(next);
		props.onExpandedChange?.(next);
	};

	if (props.calls.length === 1) {
		return (
			<masonview display="flex" id={props.id} className={cx('vx-chattools', props.className)} style={props.style as any} flexDirection="column">
				<CallRow call={props.calls[0]} />
			</masonview>
		);
	}

	const latest = props.calls[props.calls.length - 1];
	const latestStatus = latest.status ?? 'complete';

	<masonview display="flex" id={props.id} className={cx('vx-chattools', props.className)} style={props.style as any} flexDirection="column">
		<masonview display="flex" className="vx-chattools-header" flexDirection="row" alignItems="center" accessibilityRole={nativeAccessibilityRole('button') as any} accessibilityState={{ expanded: isExpanded } as any} onTap={toggle}>
			{isExpanded ? (
				<>
					<masonview display="flex" className="vx-chattools-status"><Icon name="xplat-wrench" size={14} /></masonview>
					<label className="vx-chattools-grouplabel" text={props.label ?? `${props.calls.length} tool calls`} />
				</>
			) : (
				<>
					<masonview display="flex" className={cx('vx-chattools-status', `vx-chattools-status--${latestStatus}`)} accessibilityLabel={statusAnnouncement(latestStatus, latest.errorMessage)}>
						{latestStatus === 'running' || latestStatus === 'pending' ? (
							<ActivityIndicator />
						) : (
							<Icon name={STATUS_ICON[latestStatus] ?? 'xplat-check'} size={12} />
						)}
					</masonview>
					<label className="vx-chattools-name" text={latest.name} />
					{latest.target != null ? <label className="vx-chattools-target" text={latest.target} /> : null}
				</>
			)}
			<masonview display="flex" className="vx-chattools-count" flexDirection="row" flexGrow={1} justifyContent="flex-end">
				{!isExpanded ? (<><Icon name="xplat-wrench" size={12} /><label text={`${props.calls.length}`} /></>) : null}
			</masonview>
			<masonview display="flex" className={cx('vx-chattools-chev', isExpanded && 'vx-chattools-chev--open')}>
				<Icon name="xplat-chevron-down" size={12} />
			</masonview>
		</masonview>
		{isExpanded ? (
			<masonview display="flex" className="vx-chattools-list" flexDirection="column">
				{props.calls.map((call) => (
					<CallRow call={call} />
				))}
			</masonview>
		) : null}
	</masonview>
}
