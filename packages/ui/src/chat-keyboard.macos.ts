import { chatHost } from './chat-scroll-host'
import { chatAtEnd, chatScrollControl } from './chat-scroll-state'
import { checkChatPanelHeight } from './chat-keyboard-types'
import type { ChatKeyboardBinding, ChatKeyboardOptions } from './chat-keyboard-types'

/** AppKit has neutral software-keyboard space. The in-flow dock owns its range. */
export function bindChatKeyboard(
	_root: any,
	viewport: any,
	dock: any,
	_dockPad: any,
	content: any,
	options: () => ChatKeyboardOptions,
): ChatKeyboardBinding {
	const scroll = chatHost.scroll(viewport)
	let active = true,
		timer: ReturnType<typeof setTimeout> | undefined
	const apply = () => {
		if (!active) {
			return
		}
		checkChatPanelHeight(options().bottomPanelHeight)
		if (timer !== undefined) {
			clearTimeout(timer)
		}
		const follow =
			chatScrollControl(viewport)?.isFollowing() ??
			chatAtEnd(scroll.verticalOffset, scroll.scrollableHeight)
		timer = setTimeout(() => {
			timer = undefined
			if (active && follow && (chatScrollControl(viewport)?.isFollowing() ?? follow)) {
				chatScrollControl(viewport)?.jumpToEnd()
			}
		}, 0)
	}
	const a = chatHost.observeLayout(dock, apply, true),
		b = chatHost.observeLayout(content, apply)
	apply()
	return Object.assign(
		() => {
			if (!active) {
				return
			}
			active = false
			a()
			b()
			if (timer !== undefined) {
				clearTimeout(timer)
			}
		},
		{ update: apply },
	)
}
