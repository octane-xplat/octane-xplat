import { useId, useState } from 'octane';
import type { ChatToolCallItem, ChatToolCallStatus, ChatToolCallsProps } from './props';
import { Icon } from './Icon.web.tsrx';
import { Badge } from './Badge.web.tsrx';
import { ActivityIndicator } from './ActivityIndicator.web.tsrx';

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

/** Single tool-call row — status icon, name, optional node chip, target,
 *  diff stats, duration, and an expandable detail region. */
function CallRow(props: { call: ChatToolCallItem; hasClippedFocusRing?: boolean }) @{
	const call = props.call;
	const status = call.status ?? 'complete';
	const hasDetail = call.resultDetail != null;
	const [isDetailOpen, setIsDetailOpen] = useState(false);
	const detailId = useId();
	const toggleDetail = hasDetail ? () => setIsDetailOpen((v) => !v) : undefined;

	const row = (
		<div
			className={['vx-chattools-row', hasDetail ? 'vx-chattools-row--toggle' : undefined]}
			role={hasDetail ? 'button' : undefined}
			tabIndex={hasDetail ? 0 : undefined}
			aria-expanded={hasDetail ? isDetailOpen : undefined}
			aria-controls={hasDetail && isDetailOpen ? detailId : undefined}
			onClick={toggleDetail}
			onKeyDown={hasDetail ? (e: any) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					toggleDetail?.();
				}
			} : undefined}
		>
			<span
				className={['vx-chattools-status', `vx-chattools-status--${status}`]}
				title={status === 'error' ? call.errorMessage : undefined}
				aria-label={statusAnnouncement(status, call.errorMessage)}
			>
				{status === 'running' || status === 'pending' ? (
					<ActivityIndicator />
				) : (
					<Icon name={STATUS_ICON[status] ?? 'xplat-check'} size={12} />
				)}
			</span>
			<span className="vx-chattools-name">{call.name}</span>
			{call.node != null ? <Badge className="vx-chattools-node">{call.node}</Badge> : null}
			{call.target != null ? <span className="vx-chattools-target">{call.target}</span> : null}
			{call.additions != null || call.deletions != null || call.stats != null ? (
				<span className="vx-chattools-stats">
					{call.additions != null ? <span className="vx-chattools-add">+{call.additions}</span> : null}
					{call.deletions != null ? <span className="vx-chattools-del">-{call.deletions}</span> : null}
					{call.stats}
				</span>
			) : null}
			{call.duration != null && status === 'complete' ? (
				<span className="vx-chattools-duration">{call.duration}</span>
			) : null}
			{hasDetail ? (
				<span className={['vx-chattools-chev', isDetailOpen ? 'vx-chattools-chev--open' : undefined]}>
					<Icon name="xplat-chevron-down" size={12} />
				</span>
			) : null}
		</div>
	);

	if (!hasDetail) {
		return row;
	}

	return (
		<div>
			{row}
			{isDetailOpen ? (
				<div id={detailId} className="vx-chattools-detail">{call.resultDetail}</div>
			) : null}
		</div>
	);
}

/** Tool/function call list from an LLM response. A single call renders
 *  inline with no group chrome; multiple collapse behind a header showing
 *  the latest call and a count. */
export function ChatToolCalls(props: ChatToolCallsProps) @{
	const isControlled = props.isExpanded !== undefined;
	const [internalExpanded, setInternalExpanded] = useState(props.defaultIsExpanded ?? false);
	const isExpanded = isControlled ? props.isExpanded : internalExpanded;
	const contentId = useId();

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
			<div id={props.id} className={['vx-chattools', props.className]} style={props.style}>
				<CallRow call={props.calls[0]} />
			</div>
		);
	}

	const latest = props.calls[props.calls.length - 1];
	const latestStatus = latest.status ?? 'complete';

	<div id={props.id} className={['vx-chattools', props.className]} style={props.style}>
		<div
			className="vx-chattools-header"
			role="button"
			tabIndex={0}
			aria-expanded={isExpanded}
			aria-controls={contentId}
			onClick={toggle}
			onKeyDown={(e: any) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					toggle();
				}
			}}
		>
			{isExpanded ? (
				<>
					<span className="vx-chattools-status"><Icon name="xplat-wrench" size={14} /></span>
					<span className="vx-chattools-grouplabel">{props.label ?? `${props.calls.length} tool calls`}</span>
				</>
			) : (
				<>
					<span
						className={['vx-chattools-status', `vx-chattools-status--${latestStatus}`]}
						aria-label={statusAnnouncement(latestStatus, latest.errorMessage)}
					>
						{latestStatus === 'running' || latestStatus === 'pending' ? (
							<ActivityIndicator />
						) : (
							<Icon name={STATUS_ICON[latestStatus] ?? 'xplat-check'} size={12} />
						)}
					</span>
					<span className="vx-chattools-name">{latest.name}</span>
					{latest.target != null ? <span className="vx-chattools-target">{latest.target}</span> : null}
				</>
			)}
			<span className="vx-chattools-count">
				{!isExpanded ? (<><Icon name="xplat-wrench" size={12} />{props.calls.length}</>) : null}
			</span>
			<span className={['vx-chattools-chev', isExpanded ? 'vx-chattools-chev--open' : undefined]}>
				<Icon name="xplat-chevron-down" size={12} />
			</span>
		</div>
		<div
			id={contentId}
			className={['vx-chattools-body', isExpanded ? 'vx-chattools-body--open' : undefined]}
			{...(isExpanded ? {} : { inert: true })}
		>
			<div className="vx-chattools-list">
				{props.calls.map((call) => (
					<CallRow key={call.key ?? call.name} call={call} hasClippedFocusRing />
				))}
			</div>
		</div>
	</div>
}
