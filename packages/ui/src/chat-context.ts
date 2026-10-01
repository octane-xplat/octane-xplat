import { createContext, useContext } from 'octane'
import type {
	ChatComposerContextValue,
	ChatLayoutContextValue,
	ChatListContextValue,
	ChatMessageContextValue,
} from './props'

/** Per-message context: sender + density for bubbles and metadata. */
export const ChatMessageContext: any = createContext<ChatMessageContextValue | null>(null)
export const ChatMessageProvider: any = ChatMessageContext

/** Per-list context: density default for messages. */
export const ChatListContext: any = createContext<ChatListContextValue | null>(null)
export const ChatListProvider: any = ChatListContext

/** Composer shell → slots context (value, submit, input control seam). */
export const ChatComposerContext: any = createContext<ChatComposerContextValue | null>(null)
export const ChatComposerProvider: any = ChatComposerContext

/** Layout → message list context: scroll container + content refs. */
export const ChatLayoutContext: any = createContext<ChatLayoutContextValue | null>(null)
export const ChatLayoutProvider: any = ChatLayoutContext

export function useChatMessageContext(): ChatMessageContextValue | null {
	return useContext(ChatMessageContext)
}

export function useChatListContext(): ChatListContextValue | null {
	return useContext(ChatListContext)
}

export function useChatComposerContext(): ChatComposerContextValue | null {
	return useContext(ChatComposerContext)
}

export function useChatLayoutContext(): ChatLayoutContextValue | null {
	return useContext(ChatLayoutContext)
}
