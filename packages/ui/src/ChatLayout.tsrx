/** @jsxImportSource @nativescript-community/octane */
import { useMemo, useRef } from 'octane';
import type { ChatLayoutProps } from './props';
import { cx } from './cx';
import { useChatStreamScroll } from './useChatStreamScroll.tsrx';
import { useChatNewMessages } from './useChatNewMessages.tsrx';
import { ChatLayoutScrollButton } from './ChatLayoutScrollButton.tsrx';
import { ChatLayoutProvider } from './chat-context';

const hasVisibleContent = (children: any): boolean => {
	if (children == null || children === false || children === true) return false;
	if (Array.isArray(children)) return children.some(hasVisibleContent);
	return true;
};

/** Page-style chat shell on native: a ScrollView for the message area with
 *  the composer dock overlaid at the bottom (grid overlay — NS has no
 *  sticky positioning), plus the scroll-to-bottom pill. The frosted-glass
 *  blur strip is a DOM capability; on native the dock is a plain overlay
 *  (style it via .vx-chatlayout-dockpad). `scrollRef` is populated with the
 *  layout's ScrollView — there is no external page scroller on native. */
export function ChatLayout(props: ChatLayoutProps) @{
	const scrollViewRef = useRef<any>(null);
	const dockRef = useRef<any>(null);
	const contentWrapRef = useRef<any>(null);

	// Expose the scroller through the caller's scrollRef (in/out handle).
	const scrollContainerRef = props.scrollRef ?? scrollViewRef;

	const scroll = useChatStreamScroll({ scrollRef: scrollContainerRef });
	const newMsgs = useChatNewMessages({
		isLocked: scroll.isLocked,
		onResize: scroll.scrollIfLocked,
	});

	const layoutContext = useMemo(
		() => ({ scrollContainerRef, contentRef: newMsgs.contentRef }),
		[scrollContainerRef, newMsgs.contentRef],
	);

	const density = props.density ?? 'balanced';
	const showEmpty = !hasVisibleContent(props.children);

	// Keep the last message above the dock overlay: the dock's measured
	// height becomes bottom padding on the scroll content.
	const syncDockInset = () => {
		const dock = dockRef.current;
		const content = contentWrapRef.current;
		if (!dock || !content) return;
		const h = dock.getActualSize?.().height ?? 0;
		if (h > 0 && content.style?.paddingBottom !== h) {
			content.style = { ...content.style, paddingBottom: h };
		}
	};

	<ChatLayoutProvider value={layoutContext}>
		<gridlayout
			id={props.id}
			className={cx('vx-chatlayout', `vx-chatlayout--${density}`, props.className)}
			style={props.style}
			flexGrow={1}
		>
			<scrollview
				ref={(v: any) => {
					scrollViewRef.current = v;
					if (props.scrollRef) props.scrollRef.current = v;
				}}
				className="vx-chatlayout-scroll"
				orientation="vertical"
			>
				<flexboxlayout
					ref={(v: any) => { contentWrapRef.current = v; }}
					className={cx('vx-chatlayout-messages', `vx-chatlayout-messages--${density}`)}
					flexDirection="column"
					onLayoutChanged={syncDockInset}
				>
					{showEmpty && props.emptyState != null ? (
						<flexboxlayout className="vx-chatlayout-empty" alignItems="center" justifyContent="center" flexGrow={1}>
							{props.emptyState}
						</flexboxlayout>
					) : (
						props.children
					)}
				</flexboxlayout>
			</scrollview>
			<flexboxlayout
				ref={(v: any) => {
					dockRef.current = v;
					v?.on?.('layoutChanged', syncDockInset);
				}}
				className="vx-chatlayout-dock"
				flexDirection="column"
				verticalAlignment="bottom"
			>
				{props.scrollButton === undefined ? (
					<ChatLayoutScrollButton
						isVisible={scroll.isScrolledUp || newMsgs.hasNewMessages}
						label={newMsgs.hasNewMessages ? 'New messages' : undefined}
						onPress={() => {
							newMsgs.dismiss();
							scroll.scrollToBottom();
						}}
					/>
				) : (
					props.scrollButton
				)}
				<flexboxlayout className={cx('vx-chatlayout-dockpad', `vx-chatlayout-dockpad--${density}`)}>
					<flexboxlayout className="vx-chatlayout-dockinner">{props.composer}</flexboxlayout>
				</flexboxlayout>
			</flexboxlayout>
		</gridlayout>
	</ChatLayoutProvider>
}
