import { Text } from '@octane-xplat/ui'
import { ChatComposer, ChatLayout, ChatMessageList } from '@octane-xplat/ui/chat'
import type { ChatMessageData } from '@octane-xplat/ui/chat'

// 1. Give each message a stable ID so the list can retain its reading position.
export const initialMessages: ChatMessageData[] = [
  { id: 'started', sender: 'system', content: <Text>Conversation started</Text> },
  { id: 'welcome', sender: 'assistant', content: <Text>Welcome to your trip chat.</Text> },
]

// 2. Let the app own sending and loading history; its load function updates the list.
export function Conversation({
  messages,
  send,
  loadOlder,
}: {
  messages: ChatMessageData[]
  send: (text: string) => void
  loadOlder: () => Promise<void>
}) {
  // 3. Dock the composer and follow new content while the reader is at the end.
  return (
    <ChatLayout
      followLatest
      keyboardFollow="when-at-end"
      composer={<ChatComposer onSend={send} />}
    >
      {/* 4. Request older messages when the reader reaches the top. */}
      <ChatMessageList messages={messages} scrollToTopAction={loadOlder} />
    </ChatLayout>
  )
}
