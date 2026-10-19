/** @jsxImportSource @octane-xplat/macos-renderer */
import { useCallback, useEffect, useMemo, useRef, useState } from 'octane'
import { bindChatKeyboard } from './chat-keyboard'
import type { ChatKeyboardBinding } from './chat-keyboard-types'
import { checkChatPanelHeight } from './chat-keyboard-types'
import type { ChatLayoutProps } from './props'
import { cx } from '@octane-xplat/lib'
import { useChatStreamScroll } from './useChatStreamScroll'
import { useChatNewMessages } from './useChatNewMessages'
import { ChatLayoutScrollButton } from './ChatLayoutScrollButton'
import { ChatLayoutProvider } from './chat-context'

const hasVisibleContent = (children: any): boolean => {
	if (children == null || children === false || children === true) {
		return false
	}

	if (Array.isArray(children)) {
		return children.some(hasVisibleContent)
	}

	return true
}

/** AppKit conversation: a shrinking scroll viewport and an in-flow bottom dock.
 * Native desktop keyboard space stays neutral; the viewport owns composer range. */
export function ChatLayout(props: ChatLayoutProps) @{
	const scrollViewRef = useRef<any>(null)
	const [root, setRoot] = useState<any>(null)
	const [viewport, setViewport] = useState<any>(null)
	const [dock, setDock] = useState<any>(null)
	const [content, setContent] = useState<any>(null)
	const attachRoot = useCallback((view: any) => setRoot(view), [])
	const attachDock = useCallback((view: any) => setDock(view), [])
	const attachContent = useCallback((view: any) => setContent(view), [])
	const attachViewport = useCallback(
		(view: any) => {
			scrollViewRef.current = view
			if (props.scrollRef) {
				props.scrollRef.current = view
			}

			setViewport(view)
		},
		[props.scrollRef],
	)

	checkChatPanelHeight(props.bottomPanelHeight)
	const options = useRef({
		keyboardFollow: props.keyboardFollow,
		bottomPanelHeight: props.bottomPanelHeight,
	})

	options.current = {
		keyboardFollow: props.keyboardFollow,
		bottomPanelHeight: props.bottomPanelHeight,
	}

	const binding = useRef<ChatKeyboardBinding | null>(null)
	useEffect(() => {
		if (!root || !viewport || !dock || !content) {
			return
		}

		const own = bindChatKeyboard(root, viewport, dock, content, () => options.current)
		binding.current = own
		return () => {
			binding.current = null
			own()
		}
	}, [root, viewport, dock, content])

	useEffect(() => {
		binding.current?.update()
	}, [props.keyboardFollow, props.bottomPanelHeight])

	// Expose the scroller through the caller's scrollRef (in/out handle).
	const scrollContainerRef = props.scrollRef ?? scrollViewRef
	const followLatest = props.followLatest ?? true

	const scroll = useChatStreamScroll({ scrollRef: scrollContainerRef, followLatest })
	const newMsgs = useChatNewMessages({
		isLocked: scroll.isLocked,
		scrollRef: scrollContainerRef,
		onResize: scroll.scrollIfLocked,
	})

	const layoutContext = useMemo(
		() => ({ scrollContainerRef, contentRef: newMsgs.contentRef }),
		[scrollContainerRef, newMsgs.contentRef],
	)

	const density = props.density ?? 'balanced'
	const showEmpty = !hasVisibleContent(props.children)

	<ChatLayoutProvider value={layoutContext}>
		<flexboxlayout
			id={props.id}
			ref={attachRoot}
			className={cx('vx-chatlayout', `vx-chatlayout--${density}`, props.className)}
			style={props.style}
			flexDirection="column"
		>
			<scrollview
				ref={attachViewport}
				className="vx-chatlayout-scroll"
				orientation="vertical"
				flexGrow={1}
				flexShrink={1}
			>
				<flexboxlayout
					ref={attachContent}
					className={cx('vx-chatlayout-messages', `vx-chatlayout-messages--${density}`)}
					flexDirection="column"
				>
					{showEmpty && props.emptyState != null ? (
						<flexboxlayout
							className="vx-chatlayout-empty"
							alignItems="center"
							justifyContent="center"
							flexGrow={1}
						>
							{props.emptyState}
						</flexboxlayout>
					) : (
						props.children
					)}
				</flexboxlayout>
			</scrollview>
			<flexboxlayout
				ref={attachDock}
				className="vx-chatlayout-dock"
				flexDirection="column"
				flexShrink={0}
			>
				{props.scrollButton === undefined ? (
					<ChatLayoutScrollButton
						isVisible={scroll.isScrolledUp || newMsgs.hasNewMessages}
						label={newMsgs.hasNewMessages ? 'New messages' : undefined}
						onPress={() => {
							newMsgs.dismiss()
							scroll.scrollToBottom()
						}}
					/>
				) : (
					props.scrollButton
				)}
				<flexboxlayout className={cx('vx-chatlayout-dockpad', `vx-chatlayout-dockpad--${density}`)}>
					<flexboxlayout className="vx-chatlayout-dockinner">{props.composer}</flexboxlayout>
				</flexboxlayout>
			</flexboxlayout>
		</flexboxlayout>
	</ChatLayoutProvider>
}
