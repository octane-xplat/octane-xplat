/** @jsxImportSource @nativescript-community/octane */
import { chatMessageKey, markChatRow } from './chat-scroll-state'
import { chatHost } from './chat-scroll-host'
import { mergeStyle } from './style-merge'
import { useEffect, useMemo, useRef, useState } from 'octane';
import type { ChatMessageData, ChatMessageListProps } from './props';
import { cx } from '@octane-xplat/lib';
import { ChatListProvider, useChatLayoutContext } from './chat-context';
import { ActivityIndicator } from './ActivityIndicator.tsrx';
import { ChatMessage as ChatMessageView } from './ChatMessage.tsrx';
import { ChatMessageBubble } from './ChatMessageBubble.tsrx';

const renderable = (v: any) => v != null && v !== false && v !== true;

const DENSITY_GAP: Record<string, number> = { compact: 8, balanced: 16, spacious: 24 };

function DefaultMessageRender(props: { message: ChatMessageData }) @{
	<ChatMessageView
		sender={props.message.sender}
		avatar={props.message.avatar}
		name={props.message.name}
	>
		<ChatMessageBubble>{props.message.content}</ChatMessageBubble>
	</ChatMessageView>
}

/** Presentational message container — density context, gap, empty state,
 *  bottom-push spacer (`align`), and older-message loading. `scrollToTopAction`
 *  fires when the layout's ScrollView reaches the top (there is no
 *  IntersectionObserver on native; the sentinel is a scroll-position test).
 *  `isStreaming` reports aria-busy where the platform honors it.
 *
 *  Provide either `children` for full JSX control or `messages` + `renderMessage`
 *  for a data-driven list. */
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
		const scroller = chatHost.scroll(layoutContext?.scrollContainerRef?.current);
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
	const hasMessages = Array.isArray(props.messages) && props.messages.length > 0;

	const contextValue = useMemo(() => ({ density }), [density]);
	const gap = props.gap ?? DENSITY_GAP[density];

	<ChatListProvider value={contextValue}>
		<masonview id={props.id} className={cx('vx-chatlist', `vx-chatlist--${density}`, props.className)} style={mergeStyle({flexDirection: "column"}, mergeStyle({display: "flex"}, props.style as any))} accessibilityLiveRegion={"polite" as any}>
			<masonview ref={(v: any) => { innerRef.current = v; }} className="vx-chatlist-inner" style={mergeStyle({flexDirection: "column", flexGrow: 1, gap: gap}, {display: "flex"})}>
				{isLoadingTop ? (
					<masonview className="vx-chatlist-loading" style={mergeStyle({justifyContent: "center"}, {display: "flex"})}>
						<ActivityIndicator />
					</masonview>
				) : null}
				{props.align !== 'top' ? <masonview className="vx-chatlist-spacer" style={mergeStyle({flexGrow: 1}, {display: "flex"})}/> : null}
				{hasMessages ? (
					props.messages!.map((m) => (
						<masonview key={chatMessageKey(m)} ref={markChatRow} className="vx-chatlist-message" style={{ display: "flex", flexDirection: "column" }}>
							{props.renderMessage ? props.renderMessage(m) : <DefaultMessageRender message={m} />}
						</masonview>
					))
				) : hasChildren ? (
					props.children
				) : renderable(props.emptyState) ? (
					<masonview className="vx-chatlist-empty" style={mergeStyle({alignItems: "center", justifyContent: "center", flexGrow: 1}, {display: "flex"})}>
						{props.emptyState}
					</masonview>
				) : null}
			</masonview>
		</masonview>
	</ChatListProvider>
}
