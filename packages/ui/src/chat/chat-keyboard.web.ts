import { chatHost } from './chat-scroll-host'
import { chatAtEnd, chatScrollControl } from './chat-scroll-state'
import { checkChatPanelHeight } from './chat-keyboard-types'
import type { ChatKeyboardBinding, ChatKeyboardOptions } from './chat-keyboard-types'

/** Browser keyboard space stays neutral. Dock growth still coordinates range/follow. */
export function bindChatKeyboard(
	_root: any,
	viewport: HTMLElement,
	dock: HTMLElement,
	_dockPad: HTMLElement,
	content: HTMLElement,
	options: () => ChatKeyboardOptions,
): ChatKeyboardBinding {
	let active = true,
		timer: ReturnType<typeof setTimeout> | undefined
	let baseline = content.style.paddingBottom
	const number = () =>
		Number.parseFloat(content.ownerDocument.defaultView!.getComputedStyle(content).paddingBottom) ||
		0
	let baselineValue = number(),
		last: string | undefined
	const padding = {
		set(extra: number) {
			if (last !== undefined && content.style.paddingBottom !== last) {
				baseline = content.style.paddingBottom
				baselineValue = number()
			}
			const next = extra === 0 ? baseline : `${baselineValue + extra}px`
			if (content.style.paddingBottom !== next) {
				content.style.paddingBottom = next
			}
			last = next
		},
		release() {
			if (last !== undefined && content.style.paddingBottom === last) {
				content.style.paddingBottom = baseline
			}
		},
	}

	let lastHeight = -1,
		lastExternal: boolean | undefined
	const apply = () => {
		if (!active) {
			return
		}
		checkChatPanelHeight(options().bottomPanelHeight)
		const height = chatHost.height(dock)
		if (height === lastHeight && options().external === lastExternal) {
			return
		}
		const follow =
			chatScrollControl(viewport)?.isFollowing() ??
			chatAtEnd(viewport.scrollTop, viewport.scrollHeight - viewport.clientHeight)
		padding.set(options().external ? height : 0)
		lastHeight = height
		lastExternal = options().external
		if (timer !== undefined) {
			clearTimeout(timer)
		}
		timer = setTimeout(() => {
			timer = undefined
			if (active && follow && (chatScrollControl(viewport)?.isFollowing() ?? follow)) {
				chatScrollControl(viewport)?.jumpToEnd()
			}
		}, 0)
	}
	const off = chatHost.observeLayout(dock, apply)
	apply()
	return Object.assign(
		() => {
			if (!active) {
				return
			}
			active = false
			off()
			if (timer !== undefined) {
				clearTimeout(timer)
			}
			padding.release()
		},
		{ update: apply },
	)
}
