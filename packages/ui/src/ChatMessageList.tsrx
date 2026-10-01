/** @jsxImportSource @nativescript-community/octane */
import { useEffect, useMemo, useRef, useState } from 'octane';
import type { ChatMessageListProps } from './props';
import { cx } from './cx';
import { ChatListProvider, useChatLayoutContext } from './chat-context';
import { ActivityIndicator } from './ActivityIndicator.tsrx';

const renderable = (v: any) => v != null && v !== false && v !== true;

const DENSITY_GAP: Record<string, number> = { compact: 8, balanced: 16, spacious: 24 };

/** Presentational message container — density context, gap, empty state,
 *  bottom-push spacer (`align`), and older-message loading. `scrollToTopAction`
 *  fires when the layout's ScrollView reaches the top (there is no
 *  IntersectionObserver on native; the sentinel is a scroll-position test).
 *  `isStreaming` reports aria-busy where the platform honors it. */
export function ChatMessageList(props: ChatMessageListProps) @{
	const layoutContext = useChatLayoutContext();
	const innerRef = useRef<any>(null);
	const [isLoadingTop, setIsLoadingTop] = useState(false);
	const density = props.density ?? 'balanced';
	const loadingRef = useRef(false);

	// Register content element for size observation by the layout.
	useEffect(() => {
		layoutContext?.contentRef(innerRef.current);
		return () => layoutContext?.contentRef(null);
	}, [layoutContext]);

	// Scroll-to-top: the scroller's 'scroll' event replaces the web
	// sentinel's IntersectionObserver.
	useEffect(() => {
		const scroller = layoutContext?.scrollContainerRef?.current;
		const action = props.scrollToTopAction;
		if (!action || !scroller?.on) return;
		const onScroll = () => {
			if (loadingRef.current) return;
			if ((scroller.verticalOffset ?? 1) > 0) return;
			loadingRef.current = true;
			setIsLoadingTop(true);
			Promise.resolve(action()).finally(() => {
				loadingRef.current = false;
				setIsLoadingTop(false);
			});
		};
		scroller.on('scroll', onScroll);
		return () => scroller.off('scroll', onScroll);
	}, [layoutContext, props.scrollToTopAction]);

	const hasChildren =
		props.children != null &&
		props.children !== false &&
		!(Array.isArray(props.children) && props.children.length === 0);

	const contextValue = useMemo(() => ({ density }), [density]);
	const gap = props.gap ?? DENSITY_GAP[density];

	<ChatListProvider value={contextValue}>
		<flexboxlayout
			id={props.id}
			className={cx('vx-chatlist', `vx-chatlist--${density}`, props.className)}
			style={props.style}
			flexDirection="column"
			accessibilityLiveRegion={"polite" as any}
		>
			<flexboxlayout
				ref={(v: any) => { innerRef.current = v; }}
				className="vx-chatlist-inner"
				flexDirection="column"
				flexGrow={1}
				gap={gap}
			>
				{isLoadingTop ? (
					<flexboxlayout className="vx-chatlist-loading" justifyContent="center">
						<ActivityIndicator />
					</flexboxlayout>
				) : null}
				{props.align !== 'top' ? <flexboxlayout className="vx-chatlist-spacer" flexGrow={1} /> : null}
				{hasChildren ? (
					props.children
				) : renderable(props.emptyState) ? (
					<flexboxlayout className="vx-chatlist-empty" alignItems="center" justifyContent="center" flexGrow={1}>
						{props.emptyState}
					</flexboxlayout>
				) : null}
			</flexboxlayout>
		</flexboxlayout>
	</ChatListProvider>
}
