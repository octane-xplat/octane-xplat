import { useMemo, useRef } from 'octane';
import type { ChatLayoutProps } from './props';
import { useChatStreamScroll } from './useChatStreamScroll.web.tsrx';
import { useChatNewMessages } from './useChatNewMessages.web.tsrx';
import { ChatLayoutScrollButton } from './ChatLayoutScrollButton.web.tsrx';
import { ChatLayoutProvider } from './chat-context';

const hasVisibleContent = (children: any): boolean => {
	if (children == null || children === false || children === true) return false;
	if (Array.isArray(children)) return children.some(hasVisibleContent);
	return true;
};

/** Page-style chat shell: message area in the scroll flow, composer docked
 *  at the bottom behind a blur strip, scroll-to-bottom pill above it. The
 *  root is a flex column and — without `scrollRef` — the scroll container,
 *  with the dock sticky in flow. With an external scroll container the dock
 *  is position:fixed. Auto-scroll + new-message flagging come from
 *  useChatStreamScroll/useChatNewMessages, exposed to the list through the
 *  layout context. */
export function ChatLayout(props: ChatLayoutProps) @{
	const rootRef = useRef<HTMLDivElement | null>(null);
	const scrollContainerRef = props.scrollRef ?? rootRef;
	const isSelfScrolling = !props.scrollRef;

	const scroll = useChatStreamScroll({ scrollRef: scrollContainerRef });
	const newMsgs = useChatNewMessages({
		isLocked: scroll.isLocked,
		onResize: scroll.scrollIfLocked,
	});

	const defaultScrollButton = (
		<ChatLayoutScrollButton
			isVisible={scroll.isScrolledUp || newMsgs.hasNewMessages}
			label={newMsgs.hasNewMessages ? 'New messages' : undefined}
			onPress={() => {
				newMsgs.dismiss();
				scroll.scrollToBottom();
			}}
		/>
	);

	const layoutContext = useMemo(
		() => ({ scrollContainerRef, contentRef: newMsgs.contentRef }),
		[scrollContainerRef, newMsgs.contentRef],
	);

	const density = props.density ?? 'balanced';
	const showEmpty = !hasVisibleContent(props.children);

	<ChatLayoutProvider value={layoutContext}>
		<div
			id={props.id}
			ref={rootRef}
			className={[
				'vx-chatlayout',
				`vx-chatlayout--${density}`,
				isSelfScrolling ? 'vx-chatlayout--selfscroll' : 'vx-chatlayout--external',
				props.className,
			]}
			style={props.style}
		>
			<div className={['vx-chatlayout-messages', `vx-chatlayout-messages--${density}`]}>
				{showEmpty && props.emptyState != null ? (
					<div className="vx-chatlayout-empty">{props.emptyState}</div>
				) : (
					props.children
				)}
			</div>
			<div
				className={[
					'vx-chatlayout-dock',
					isSelfScrolling ? 'vx-chatlayout-dock--sticky' : 'vx-chatlayout-dock--fixed',
				]}
			>
				{props.scrollButton === undefined ? defaultScrollButton : props.scrollButton}
				<div className={['vx-chatlayout-blur', `vx-chatlayout-blur--${density}`]} />
				<div className={['vx-chatlayout-dockpad', `vx-chatlayout-dockpad--${density}`]}>
					<div className="vx-chatlayout-dockinner">{props.composer}</div>
				</div>
			</div>
		</div>
	</ChatLayoutProvider>
}
