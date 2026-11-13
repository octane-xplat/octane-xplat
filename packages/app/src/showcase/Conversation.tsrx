/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import { Button, HStack, Text, View } from '@octane-xplat/ui'
import {
  ChatComposer,
  ChatComposerInput,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
  ChatMessageMetadata,
  ChatTokenizedText,
} from '@octane-xplat/ui/chat'

import { storage } from '@octane-xplat/platform'

type Message = {
  id: string
  sender: 'user' | 'assistant'
  text: string
  delivery: 'sent' | 'sending' | 'failed'
}

const COPY = [
  'The prototype is ready for another look.',
  'I tested the narrow layout. The composer stays within reach.',
  'Can we keep the original draft when a send fails?',
  'Yes. Failed messages can be retried without creating a second copy.',
  'The accessibility review is in the project notes.',
  'Let’s ship the small details as carefully as the big ones.',
]

function history(start: number, count: number): Message[] {
  return Array.from({ length: count }, (_, i) => ({
    id: 'history-' + (start + i),
    sender: (start + i) % 3 === 0 ? 'user' : 'assistant',
    text: COPY[(start + i) % COPY.length],
    delivery: 'sent',
  }))
}

const MENTIONS = [
  { id: 'ada', label: 'Ada' },
  { id: 'noor', label: 'Noor' },
]

const triggers = [
  {
    character: '@',
    searchSource: {
      search: (query: string) =>
        MENTIONS.filter((p) => p.label.toLowerCase().includes(query.toLowerCase())),
    },
    onSelect: (person: { id: string; label: string }) => ({
      value: '@' + person.label + ':' + person.id,
      label: person.label,
      variant: 'info' as const,
    }),
  },
]

const tokens = MENTIONS.map((p) => ({
  value: '@' + p.label + ':' + p.id,
  label: p.label,
  variant: 'info' as const,
}))

export function Conversation() @{
  const [messages, setMessages] = useState<Message[]>(() => history(40, 18))
  const [older, setOlder] = useState(40)
  const [failNext, setFailNext] = useState(false)
  const [draft, setDraft] = useState(() => storage.getString('showcase-chat-draft') ?? '')
  const [notice, setNotice] = useState('Try @Ada. Reject a send, then retry it.')
  const sequence = useRef(0)
  const owner = useRef(true)
  const loadingHistory = useRef(false)

  useEffect(() => {
    owner.current = true
    return () => {
      owner.current = false
    }
  }, [])

  useEffect(() => {
    storage.setString('showcase-chat-draft', draft)
  }, [draft])

  async function deliver(id: string, reject: boolean) {
    setMessages((items) =>
      items.map((item) => (item.id === id ? { ...item, delivery: 'sending' } : item)),
    )

    await new Promise((resolve) => setTimeout(resolve, 850))
    if (!owner.current) {
      return
    }

    setMessages((items) =>
      items.map((item) =>
        item.id === id ? { ...item, delivery: reject ? 'failed' : 'sent' } : item,
      ),
    )

    setNotice(
      reject
        ? 'Delivery failed. Your message is still here. Retry sends the same message.'
        : 'Message delivered in this local conversation.',
    )
  }

  const send = (text: string) => {
    if (!text.trim()) {
      return
    }

    const id = 'sent-' + ++sequence.current

    setMessages((items) => [...items, { id, sender: 'user', text, delivery: 'sending' }])
    setDraft('')
    void deliver(id, failNext)
    setFailNext(false)
  }

  const loadOlder = async () => {
    if (older === 0 || loadingHistory.current) {
      return
    }

    loadingHistory.current = true
    await new Promise((resolve) => setTimeout(resolve, 350))
    loadingHistory.current = false
    if (!owner.current) {
      return
    }

    const next = Math.max(0, older - 20)

    setMessages((items) => [...history(next, older - next), ...items])
    setOlder(next)
  }

  <View className="sc-column">
    <View className="sc-intro sc-column">
      <Text className="sc-eyebrow">03 / CONVERSATION</Text>
      <Text className="sc-title">Keep the conversation in place.</Text>
      <Text className="sc-lede">
        Read back, receive a new message, and retry a failed send. The composer and your draft stay
        within reach.
      </Text>
    </View>
    <View className="sc-scenario sc-column">
      <HStack className="sc-actions">
        <Button
          label={failNext ? 'Next send will fail' : 'Fail next send'}
          variant={failNext ? 'primary' : 'secondary'}
          onPress={() => setFailNext(!failNext)}
        />
        <Button
          label="Receive a message"
          variant="secondary"
          onPress={() => {
            setMessages((items) => [
              ...items,
              {
                id: 'incoming-' + ++sequence.current,
                sender: 'assistant',
                text: 'Noor: I left a new note on the launch brief. No rush—finish reading first.',
                delivery: 'sent',
              },
            ])

            setNotice('New message received. If you are reading earlier messages, keep your place.')
          }}
        />
      </HStack>
      <Text className="sc-muted">
        Scroll up before receiving a message. Scroll to the top to load older history. Switch
        experiences with an unfinished draft.
      </Text>
    </View>
    <View className="sc-chat-frame">
      <ChatLayout
        keyboardFollow="when-at-end"
        composer={
          <ChatComposer
            value={draft}
            onChange={setDraft}
            onSend={send}
            placeholder="Message the launch team…"
            input={<ChatComposerInput triggers={triggers} />}
          />
        }
      >
        <ChatMessageList
          id="showcase-conversation"
          align="bottom"
          density="compact"
          scrollToTopAction={loadOlder}
        >
          @if (older > 0) {
            <Button
              label="Load older messages"
              variant="secondary"
              pressAction={loadOlder}
            />
          }
          @for (const message of messages; key message.id) {
            <ChatMessage sender={message.sender} id={message.id}>
              <ChatMessageBubble variant={message.sender === 'user' ? 'filled' : 'ghost'}>
                <ChatTokenizedText tokens={tokens} children={message.text} />
              </ChatMessageBubble>
              <ChatMessageMetadata
                timestamp={
                  message.delivery === 'sending'
                    ? 'Sending…'
                    : message.delivery === 'failed'
                      ? 'Not delivered'
                      : message.sender === 'user'
                        ? 'You · delivered'
                        : 'Launch team'
                }
              />
              @if (message.delivery === 'failed') {
                <Button
                  label="Retry message"
                  variant="secondary"
                  size="sm"
                  pressAction={() => deliver(message.id, false)}
                />
              }
            </ChatMessage>
          }
        </ChatMessageList>
      </ChatLayout>
    </View>
    <Text id="conversation-status" className="sc-status" accessibilityLiveRegion="polite">
      {notice}
    </Text>
    <Text className="sc-footnote">
      Seeded conversation · controlled delivery simulation · real composer, mentions, scroll
      ownership, and local draft storage
    </Text>
  </View>
}
