import { chatHost } from './chat-scroll-host'
import { isChatRow } from './chat-scroll-state'

/** @internal Data wrappers and custom ChatMessage children share row identity. */
export function chatMessageRows(host: object): object[] {
	if (isChatRow(host)) {
		return [host]
	}
	return chatHost.children(host).flatMap(chatMessageRows)
}
