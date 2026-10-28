/** @jsxImportSource @octane-xplat/jsx/dom */
import { useCallback, useEffect, useMemo, useRef, useState } from 'octane'
import { bindChatKeyboard } from './chat-keyboard'
import { checkChatPanelHeight } from './chat-keyboard-types'
import type { ChatKeyboardBinding } from './chat-keyboard-types'
import type { ChatLayoutProps } from './props'
import { useChatStreamScroll } from './useChatStreamScroll.web.tsrx'
import { useChatNewMessages } from './useChatNewMessages.web.tsrx'
import { ChatLayoutScrollButton } from './ChatLayoutScrollButton.web.tsrx'
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

/** Page-style chat shell: message area in the scroll flow, composer docked
 *  at the bottom behind a blur strip, scroll-to-bottom pill above it. The
 *  root is a flex column and — without `scrollRef` — the scroll container,
 *  with the dock sticky in flow. With an external scroll container the dock
 *  is position:fixed. Auto-scroll + new-message flagging come from
 *  useChatStreamScroll/useChatNewMessages, exposed to the list through the
 *  layout context. */
export function ChatLayout(props: ChatLayoutProps) @{
	const rootRef = useRef<HTMLDivElement | null>(null)
	const [root, setRoot] = useState<HTMLDivElement | null>(null)
	const [dock, setDock] = useState<HTMLDivElement | null>(null)
	const [dockPad, setDockPad] = useState<HTMLDivElement | null>(null)
	const [content, setContent] = useState<HTMLDivElement | null>(null)
	const attachRoot = useCallback((view: HTMLDivElement | null) => {
		rootRef.current = view
		setRoot(view)
	}, [])

	const attachDock = useCallback((view: HTMLDivElement | null) => setDock(view), [])
	const attachDockPad = useCallback((view: HTMLDivElement | null) => setDockPad(view), [])
	const attachContent = useCallback((view: HTMLDivElement | null) => setContent(view), [])
	checkChatPanelHeight(props.bottomPanelHeight)
	const options = useRef({
		keyboardFollow: props.keyboardFollow,
		bottomPanelHeight: props.bottomPanelHeight,
		external: !!props.scrollRef,
	})

	options.current = {
		keyboardFollow: props.keyboardFollow,
		bottomPanelHeight: props.bottomPanelHeight,
		external: !!props.scrollRef,
	}

	const binding = useRef<ChatKeyboardBinding | null>(null)
	const viewport = (props.scrollRef?.current as HTMLElement | null | undefined) ?? root
	useEffect(() => {
		if (!root || !viewport || !dock || !dockPad || !content) {
			return
		}

		const own = bindChatKeyboard(root, viewport, dock, dockPad, content, () => options.current)
		binding.current = own
		return () => {
			binding.current = null
			own()
		}
	}, [root, viewport, dock, dockPad, content])

	useEffect(() => {
		binding.current?.update()
	}, [props.keyboardFollow, props.bottomPanelHeight, !!props.scrollRef])

	const scrollContainerRef = props.scrollRef ?? rootRef
	const isSelfScrolling = !props.scrollRef
	const followLatest = props.followLatest ?? true

	const scroll = useChatStreamScroll({ scrollRef: scrollContainerRef, followLatest })
	const newMsgs = useChatNewMessages({
		isLocked: scroll.isLocked,
		scrollRef: scrollContainerRef,
		onResize: scroll.scrollIfLocked,
	})

	const defaultScrollButton = (
		<ChatLayoutScrollButton
			isVisible={scroll.isScrolledUp || newMsgs.hasNewMessages}
			label={newMsgs.hasNewMessages ? 'New messages' : undefined}
			onPress={() => {
				newMsgs.dismiss()
				scroll.scrollToBottom()
			}}
		/>
	)

	const layoutContext = useMemo(
		() => ({ scrollContainerRef, contentRef: newMsgs.contentRef }),
		[scrollContainerRef, newMsgs.contentRef],
	)

	const density = props.density ?? 'balanced'
	const showEmpty = !hasVisibleContent(props.children)

	<ChatLayoutProvider value={layoutContext}>
		<div
			id={props.id}
			ref={attachRoot}
			className={[
				'vx-chatlayout',
				`vx-chatlayout--${density}`,
				isSelfScrolling ? 'vx-chatlayout--selfscroll' : 'vx-chatlayout--external',
				props.className,
			]}
			style={props.style}
		>
			<div
				ref={attachContent}
				className={['vx-chatlayout-messages', `vx-chatlayout-messages--${density}`]}
			>
				{showEmpty && props.emptyState != null ? (
					<div className="vx-chatlayout-empty">{props.emptyState}</div>
				) : (
					props.children
				)}
			</div>
			<div
				ref={attachDock}
				className={[
					'vx-chatlayout-dock',
					isSelfScrolling ? 'vx-chatlayout-dock--sticky' : 'vx-chatlayout-dock--fixed',
				]}
			>
				{props.scrollButton === undefined ? defaultScrollButton : props.scrollButton}
				<div className={['vx-chatlayout-blur', `vx-chatlayout-blur--${density}`]} />
				<div
					ref={attachDockPad}
					className={['vx-chatlayout-dockpad', `vx-chatlayout-dockpad--${density}`]}
				>
					<div className="vx-chatlayout-dockinner">{props.composer}</div>
				</div>
			</div>
		</div>
	</ChatLayoutProvider>
}
