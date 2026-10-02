import { useEffect, useRef, useState, useMemo } from 'octane';
import type { ChatMessageListProps } from './props';
import { ChatListProvider, useChatLayoutContext } from './chat-context';
import { ActivityIndicator } from './ActivityIndicator.web.tsrx';

const renderable = (v: any) => v != null && v !== false && v !== true;

const DENSITY_GAP: Record<string, number> = { compact: 8, balanced: 16, spacious: 24 };

/** Presentational message container — density context, gap, empty state,
 *  a bottom-push spacer (`align`), an infinite-scroll sentinel
 *  (`scrollToTopAction`), and role="log" live-region semantics.
 *  Auto-scroll + the scroll-to-bottom button belong to ChatLayout /
 *  useChatStreamScroll. */
export function ChatMessageList(props: ChatMessageListProps) @{
	const layoutContext = useChatLayoutContext();
	const sentinelRef = useRef<HTMLDivElement | null>(null);
	const innerRef = useRef<HTMLDivElement | null>(null);
	const [isLoadingTop, setIsLoadingTop] = useState(false);
	const density = props.density ?? 'balanced';
	const actionRef = useRef(props.scrollToTopAction);
	actionRef.current = props.scrollToTopAction;

	// Register the inner content element so the layout observes its size.
	useEffect(() => {
		layoutContext?.contentRef(innerRef.current);
		return () => layoutContext?.contentRef(null);
	}, [layoutContext]);

	// Sentinel → scrollToTopAction (older-history load).
	useEffect(() => {
		const action = props.scrollToTopAction;
		const sentinel = sentinelRef.current;
		if (!action || !sentinel) return;
		const observer = new IntersectionObserver(
			(entries) => {
				if (!entries[0]?.isIntersecting) return;
				setIsLoadingTop(true);
				Promise.resolve(actionRef.current?.()).finally(() => setIsLoadingTop(false));
			},
			{ root: layoutContext?.scrollContainerRef?.current ?? null, threshold: 0 },
		);

		observer.observe(sentinel);
		return () => observer.disconnect();
	}, [props.scrollToTopAction != null, layoutContext]);

	const hasChildren =
		props.children != null &&
		props.children !== false &&
		!(Array.isArray(props.children) && props.children.length === 0);

	const contextValue = useMemo(() => ({ density }), [density]);
	const gap = props.gap ?? DENSITY_GAP[density];

	<ChatListProvider value={contextValue}>
		<div
			id={props.id}
			role="log"
			aria-live="polite"
			aria-busy={props.isStreaming || undefined}
			tabIndex={0}
			className={['vx-chatlist', `vx-chatlist--${density}`, props.className]}
			style={props.style}
		>
			<div
				ref={innerRef}
				className="vx-chatlist-inner"
				style={{ gap: `${gap}px` }}
			>
				{props.scrollToTopAction ? <div ref={sentinelRef} aria-hidden="true" /> : null}
				{isLoadingTop ? (
					<div className="vx-chatlist-loading"><ActivityIndicator /></div>
				) : null}
				{props.align !== 'top' ? <div className="vx-chatlist-spacer" aria-hidden="true" /> : null}
				{hasChildren ? (
					props.children
				) : renderable(props.emptyState) ? (
					<div className="vx-chatlist-empty">{props.emptyState}</div>
				) : null}
			</div>
		</div>
	</ChatListProvider>
}
