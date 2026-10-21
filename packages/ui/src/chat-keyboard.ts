import { keyboardBottomOverlap } from '@octane-xplat/platform/keyboard-geometry'
import { leaseKeyboardProperty } from '@octane-xplat/platform/keyboard-property'
import { observeKeyboardViewport } from '@octane-xplat/platform/keyboard-viewport'
import type { KeyboardWindowState } from '@octane-xplat/platform/keyboard-state'
import { unknownKeyboardState } from '@octane-xplat/platform/keyboard-state'
import { leaseNativePaddingBottom } from './native-padding'
import { subscribeKeyboardState, keyboardHostDisplacement } from './keyboard-inset'
import { chatHost } from './chat-scroll-host'
import { chatAtEnd, chatScrollControl, leaseChatViewportMotion } from './chat-scroll-state'
import { checkChatPanelHeight } from './chat-keyboard-types'
import type { ChatKeyboardBinding, ChatKeyboardOptions } from './chat-keyboard-types'

/** @internal Movement/range are imperative; existing stream hooks own follow intent. */
export function bindChatKeyboard(
	root: any,
	viewport: any,
	dock: any,
	content: any,
	options: () => ChatKeyboardOptions,
): ChatKeyboardBinding {
	const scroll = chatHost.scroll(viewport)
	const translation = leaseKeyboardProperty(
		() => Number(dock.translateY) || 0,
		(value) => {
			dock.translateY = value
		},
	)
	const padding = leaseNativePaddingBottom(content)
	const viewportLease = observeKeyboardViewport(root)
	const motion = leaseChatViewportMotion(viewport)
	let active = true,
		writing = false,
		followTransition = false
	let state: KeyboardWindowState = unknownKeyboardState(),
		key: object | undefined
	let initialized = false,
		lastViewportHeight = 0,
		wasVisible = false
	let transition = '',
		lastOffset = scroll?.verticalOffset ?? 0,
		lastMax = scroll?.scrollableHeight ?? 0
	let lastDockHeight = 0,
		lastPadding = -1
	let timer: ReturnType<typeof setTimeout> | undefined
	let queuedKeyboard = false,
		queuedGrowth = false
	const readEnd = () => chatAtEnd(lastOffset, lastMax)
	const settle = () => {
		timer = undefined
		if (!active) {
			return
		}
		const policy = options().keyboardFollow ?? 'when-at-end'
		const control = chatScrollControl(viewport)
		const follow =
			(queuedKeyboard && (policy === 'always' || (policy === 'when-at-end' && followTransition))) ||
			(queuedGrowth && (control?.isFollowing() ?? readEnd()))
		queuedKeyboard = queuedGrowth = false
		if (follow) {
			writing = true
			try {
				if (control) {
					control.jumpToEnd()
				} else {
					scroll?.scrollToVerticalOffset?.(scroll.scrollableHeight ?? 0, false)
				}
			} finally {
				writing = false
			}
		}
		lastOffset = scroll?.verticalOffset ?? 0
		lastMax = scroll?.scrollableHeight ?? 0
	}
	const queue = (keyboard: boolean, growth: boolean) => {
		if (!active) {
			return
		}
		queuedKeyboard ||= keyboard
		queuedGrowth ||= growth
		if (timer === undefined) {
			timer = setTimeout(settle, 0)
		}
	}
	const apply = (keyboard = false) => {
		if (!active || writing || dock.isLayoutValid === false) {
			return
		}
		if (!initialized) {
			lastOffset = scroll?.verticalOffset ?? 0
			lastMax = scroll?.scrollableHeight ?? 0
			lastViewportHeight = chatHost.height(viewport)
			initialized = true
		}
		const current = options(),
			panel = checkChatPanelHeight(current.bottomPanelHeight)
		const target = state.targetFrame
		const signature = `${state.motion?.transitionId ?? 0}:${target?.x}:${target?.y}:${target?.height}:${target ? '' : state.inset}`
		const visible =
			state.inset > 0 ||
			keyboardBottomOverlap(state.windowRect, state.currentFrame ?? state.targetFrame) > 0
		if (signature !== transition) {
			followTransition = (current.keyboardFollow ?? 'when-at-end') === 'always' || readEnd()
			transition = signature
		}
		const viewportHeight = chatHost.height(viewport)
		keyboard =
			(visible || wasVisible) && (keyboard || Math.abs(viewportHeight - lastViewportHeight) > 0.5)
		lastViewportHeight = viewportHeight
		wasVisible = visible
		motion.set(!!state.motion && !['idle', 'end'].includes(state.motion.phase))
		const measured = state.bindingFrame ? { ...state, currentFrame: state.bindingFrame } : state
		viewportLease.update()
		const overlap = keyboardHostDisplacement(dock, measured, translation.offset)
		const inherited = current.ancestorWindow === key ? (current.ancestorBottom ?? 0) : 0
		const extent = keyboardBottomOverlap(
			state.windowRect,
			measured.currentFrame ?? measured.targetFrame,
		)
		const available = Math.max(
			0,
			Math.max(state.inset, extent, overlap) -
				Math.max(0, current.safeBottom ?? 0) -
				Math.max(0, inherited),
		)
		const lift = Math.max(0, Math.min(overlap, available) - panel)
		const height = chatHost.height(dock)
		const nextPadding = height + lift
		const growth = Math.abs(height - lastDockHeight) > 0.5
		writing = true
		try {
			translation.set(-lift)
			padding.set(nextPadding)
		} finally {
			writing = false
		}
		if (keyboard || growth || Math.abs(nextPadding - lastPadding) > 0.5) {
			queue(keyboard, growth)
		}
		lastDockHeight = height
		lastPadding = nextPadding
	}
	const onScroll = () => {
		if (!active || writing) {
			return
		}
		const offset = scroll?.verticalOffset ?? 0,
			max = scroll?.scrollableHeight ?? 0
		if (offset < lastOffset - 0.5 && !chatAtEnd(offset, max, 1)) {
			followTransition = false
		}
		if (Math.abs(offset - lastOffset) > 0.5) {
			lastOffset = offset
			lastMax = max
		}
	}
	const releases: (() => void)[] = []
	const release = () => {
		if (!active) {
			return
		}
		active = false
		if (timer !== undefined) {
			clearTimeout(timer)
		}
		const errors: unknown[] = []
		for (const off of [
			...releases.reverse(),
			translation.release,
			padding.release,
			viewportLease.release,
			() => motion.release(),
		]) {
			try {
				off()
			} catch (error) {
				errors.push(error)
			}
		}
		if (errors.length) {
			throw new AggregateError(errors, 'Chat viewport cleanup failed')
		}
	}
	try {
		scroll?.on?.('scroll', onScroll)
		releases.push(() => scroll?.off?.('scroll', onScroll))
		releases.push(chatHost.observeLayout(dock, () => apply(), true))
		releases.push(
			chatHost.observeLayout(content, () => {
				apply()
				queue(false, false)
			}),
		)

		releases.push(
			subscribeKeyboardState((next, window) => {
				const changed = state !== next || key !== window
				if (key !== window) {
					transition = ''
					initialized = false
				}
				state = next
				key = window
				apply(changed)
			}, root),
		)
	} catch (error) {
		release()
		throw error
	}
	return Object.assign(release, { update: () => apply() })
}
