/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../internal/layout/style-merge'
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'octane'
import { bindChatKeyboard } from './chat-keyboard'
import type { ChatKeyboardBinding } from './chat-keyboard-types'
import { checkChatPanelHeight } from './chat-keyboard-types'
import { KeyboardAvoidanceContext } from '../internal/keyboard/keyboard-avoidance-context'
import { ConsumedInsetsContext } from '../components/layout/inset-consumption'
import { useSafeAreaInsets } from '../components/layout/safeAreaInsets'
import type { ChatLayoutProps } from '../props'
import { cx } from '@octane-xplat/lib'
import { useChatStreamScroll } from './useChatStreamScroll.tsrx'
import { useChatNewMessages } from './useChatNewMessages.tsrx'
import { ChatLayoutScrollButton } from './ChatLayoutScrollButton.tsrx'
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

/** Page-style chat shell on native: a scrollview for the message area with
 *  the composer dock overlaid at the bottom (grid overlay — both children
 *  share grid cell 1/1 so the dock floats instead of taking a row), plus
 *  the scroll-to-bottom pill. The frosted-glass
 *  blur strip is a DOM capability; on native the dock is a plain overlay
 *  (style it via .vx-chatlayout-dockpad). `scrollRef` is populated with the
 *  layout's scrollview — there is no external page scroller on native. */
export function ChatLayout(props: ChatLayoutProps) @{
	const scrollViewRef = useRef<any>(null)
	const [root, setRoot] = useState<any>(null)
	const [viewport, setViewport] = useState<any>(null)
	const [dock, setDock] = useState<any>(null)
	const [dockPad, setDockPad] = useState<any>(null)
	const [content, setContent] = useState<any>(null)
	const attachRoot = useCallback((view: any) => setRoot(view), [])
	const attachDock = useCallback((view: any) => setDock(view), [])
	const attachDockPad = useCallback((view: any) => setDockPad(view), [])
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

	const safe = useContext(ConsumedInsetsContext)
	const homeInset = Math.max(0, useSafeAreaInsets().bottom - safe.bottom)
	const ancestor = useContext(KeyboardAvoidanceContext)
	checkChatPanelHeight(props.bottomPanelHeight)
	const options = useRef({
		keyboardFollow: props.keyboardFollow,
		bottomPanelHeight: props.bottomPanelHeight,
		safeBottom: safe.bottom,
		homeInset,
		ancestorWindow: ancestor.window,
		ancestorBottom: ancestor.bottom,
	})

	options.current = {
		keyboardFollow: props.keyboardFollow,
		bottomPanelHeight: props.bottomPanelHeight,
		safeBottom: safe.bottom,
		homeInset,
		ancestorWindow: ancestor.window,
		ancestorBottom: ancestor.bottom,
	}

	const binding = useRef<ChatKeyboardBinding | null>(null)
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
	}, [
		props.keyboardFollow,
		props.bottomPanelHeight,
		safe.bottom,
		homeInset,
		ancestor.window,
		ancestor.bottom,
	])

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
		<masonview
			id={props.id}
			ref={attachRoot}
			className={cx('vx-chatlayout', `vx-chatlayout--${density}`, props.className)}
			style={mergeStyle({ display: 'grid', flexGrow: 1 }, props.style)}
		>
			<scrollview
				ref={attachViewport}
				className="vx-chatlayout-scroll"
				orientation="vertical"
				style={{ gridRow: '1', gridColumn: '1' }}
			>
				<masonview
					ref={attachContent}
					className={cx('vx-chatlayout-messages', `vx-chatlayout-messages--${density}`)}
					style={{ display: 'flex', flexDirection: 'column' }}
				>
					{showEmpty && props.emptyState != null ? (
						<masonview
							className="vx-chatlayout-empty"
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexGrow: 1,
							}}
						>
							{props.emptyState}
						</masonview>
					) : (
						props.children
					)}
				</masonview>
			</scrollview>
			<masonview
				ref={attachDock}
				className="vx-chatlayout-dock"
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignSelf: 'end',
					gridRow: '1',
					gridColumn: '1',
				}}
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
				<masonview
					ref={attachDockPad}
					className={cx('vx-chatlayout-dockpad', `vx-chatlayout-dockpad--${density}`)}
					style={{ display: 'flex' }}
				>
					<masonview className="vx-chatlayout-dockinner" style={{ display: 'flex' }}>
						{props.composer}
					</masonview>
				</masonview>
			</masonview>
		</masonview>
	</ChatLayoutProvider>
}
