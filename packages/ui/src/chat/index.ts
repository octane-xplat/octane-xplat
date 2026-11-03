// @octane-xplat/ui/chat — chat messages, composer drafts/tokens, tool-call
// display, conversation scrolling, and dictation UI. General scrolling and
// field components stay at the package root.
export { ChatLayout } from './ChatLayout.tsrx'
export { ChatLayoutScrollButton } from './ChatLayoutScrollButton.tsrx'
export { ChatMessageList } from './ChatMessageList.tsrx'
export { ChatMessage } from './ChatMessage.tsrx'
export { ChatMessageBubble } from './ChatMessageBubble.tsrx'
export { ChatMessageMetadata } from './ChatMessageMetadata.tsrx'
export { ChatSystemMessage } from './ChatSystemMessage.tsrx'
export { ChatToolCalls } from './ChatToolCalls.tsrx'
export { ChatTokenizedText } from './ChatTokenizedText.tsrx'
export { ChatComposer } from './ChatComposer.tsrx'
export { ChatComposerInput, ChatComposerTokenElement } from './ChatComposerInput.tsrx'
export { ChatComposerDrawer } from './ChatComposerDrawer.tsrx'
export { ChatSendButton } from './ChatSendButton.tsrx'
export { ChatDictationButton } from './ChatDictationButton.tsrx'
export { useChatStreamScroll } from './useChatStreamScroll.tsrx'
export { useChatNewMessages } from './useChatNewMessages.tsrx'
export { useChatPasteAsToken } from './useChatPasteAsToken.tsrx'
export { useChatComposerTokens } from './useChatComposerTokens.tsrx'
export { useSpeechRecognition } from '../components/media/useSpeechRecognition.tsrx'
export { useChatDictation } from './useChatDictation.tsrx'
export { useChatLayoutContext, useChatComposerContext } from './chat-context.tsrx'
export { defineChatComposerTrigger } from './chat-trigger'
export {
  serializeChatComposerToken,
  deserializeChatComposerToken,
  serializeChatComposerDraft,
  deserializeChatComposerDraft,
  createChatComposerDraft,
} from './chat-draft'

export type {
  ChatComposerContextValue,
  ChatComposerDensity,
  ChatComposerDraft,
  ChatComposerDraftData,
  ChatComposerDrawerProps,
  ChatComposerFile,
  ChatComposerInputControl,
  ChatComposerInputHandle,
  ChatComposerInputProps,
  ChatComposerKeyEvent,
  ChatComposerPasteEvent,
  ChatComposerProps,
  ChatComposerSearchSource,
  ChatComposerStatus,
  ChatComposerToken,
  ChatComposerTokenBadge,
  ChatComposerTokenBadgeData,
  ChatComposerTokenCustom,
  ChatComposerTokenCustomData,
  ChatComposerTokenData,
  ChatComposerTokenElementProps,
  ChatComposerTokenVariant,
  ChatComposerTrigger,
  ChatComposerTriggerItem,
  ChatDensity,
  ChatDictationButtonProps,
  ChatLayoutContextValue,
  ChatLayoutProps,
  ChatLayoutScrollButtonProps,
  ChatListContextValue,
  ChatMessageData,
  ChatMessageBubbleProps,
  ChatMessageBubbleVariant,
  ChatMessageContextValue,
  ChatMessageListProps,
  ChatMessageMetadataProps,
  ChatMessageProps,
  ChatMessageSender,
  ChatMessageStatus,
  ChatScrollToBottomOptions,
  ChatSendButtonProps,
  ChatSystemMessageProps,
  ChatSystemMessageVariant,
  ChatTokenizedTextProps,
  ChatToolCallItem,
  ChatToolCallStatus,
  ChatToolCallsProps,
  TokenPortal,
  UseChatComposerTokensOptions,
  UseChatComposerTokensReturn,
  UseChatDictationOptions,
  UseChatDictationReturn,
  UseChatNewMessagesOptions,
  UseChatNewMessagesReturn,
  UseChatPasteAsTokenOptions,
  UseChatPasteAsTokenReturn,
  UseChatStreamScrollOptions,
  UseChatStreamScrollReturn,
  UseSpeechRecognitionOptions,
  UseSpeechRecognitionReturn,
} from '../props'
