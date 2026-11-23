import { useState } from 'octane'
import { Button, VStack } from '@octane-xplat/ui'
import {
  ChatComposer,
  ChatComposerInput,
  defineChatComposerTrigger,
  deserializeChatComposerDraft,
  serializeChatComposerDraft,
} from '@octane-xplat/ui/chat'
import type { ChatComposerDraft, ChatComposerDraftData } from '@octane-xplat/ui/chat'

// 1. Find people by name and turn a selection into a token with a stable value.
const people = [{ id: 'u1', label: 'Ada Lovelace' }]
const mention = defineChatComposerTrigger({
  character: '@',
  searchSource: {
    search: (query: string) =>
      people.filter((person) => person.label.toLowerCase().includes(query.toLowerCase())),
  },
  onSelect: (person) => ({ value: `@${person.label}:${person.id}`, label: person.label }),
})

export function DraftWithMentions({ send }: { send: (text: string) => void }) {
  // 2. Own the draft and a JSON-ready copy. This copy lasts only while mounted;
  // an app can persist it using its own storage and validate it when loading.
  const [draft, setDraft] = useState<ChatComposerDraft>({ text: '', tokens: [] })
  const [saved, setSaved] = useState<ChatComposerDraftData | null>(null)

  // 3. Connect the trigger and provide actions to save and restore the draft.
  return (
    <VStack gap={2}>
      <ChatComposer
        draft={draft}
        onDraftChange={setDraft}
        onSend={send}
        input={<ChatComposerInput triggers={[mention]} />}
      />
      <Button label="Save draft" onPress={() => setSaved(serializeChatComposerDraft(draft))} />
      <Button
        label="Restore draft"
        isDisabled={!saved}
        onPress={() => {
          if (saved) {
            setDraft(deserializeChatComposerDraft(saved))
          }
        }}
      />
    </VStack>
  )
}
