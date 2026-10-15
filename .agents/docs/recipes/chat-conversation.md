# Build a chat conversation

ID: chat-conversation
Targets: web, ios, android, macos
Related APIs: ChatLayout, ChatMessageList, ChatMessage, ChatMessageBubble, ChatComposer, ChatComposerInput, ChatComposerTrigger, ChatComposerToken, useChatStreamScroll, useChatNewMessages, useChatPasteAsToken, useChatDictation

## Starting point

The app already renders screens with `@octane-xplat/ui`. This recipe covers a
conversation with a docked composer, sender-aware messages, optional trigger
menus and token chips, streaming scroll behavior, and older-message loading.
The Chat family supplies presentation and input behavior; the app owns message
storage, network requests, and upload handling.

## Requirements

- Compose a message list and composer in one scroll-aware layout.
- Keep submitted text and inserted tokens serialized as a string the app can
  send or persist.
- Keep streaming output in view while the user is at the bottom, and make new
  messages discoverable after the user scrolls away.
- Load older history without firing duplicate requests while one is pending.
- Report target-specific limits for file input, speech recognition, and rich
  token editing.

## Compose triggers and tokens

Give each trigger a synchronous or asynchronous search source. Selection can
insert a token object whose `value` is the stable serialized text saved by the
app. Reuse that token value when displaying a submitted message.

Use the structured draft API to preserve both text and tokens across saves or
network round-trips. `serializeChatComposerDraft` turns a draft into JSON;
`deserializeChatComposerDraft` restores it, optionally recovering custom-token
renderers from a lookup:

```tsrx
import { useState } from 'octane'
import { View } from '@octane-xplat/ui'
import { ChatComposer, ChatComposerInput, ChatTokenizedText } from '@octane-xplat/ui/chat'

const people = [{ id: 'u1', label: 'Ada Lovelace' }]
const mention = {
	character: '@',
	searchSource: {
		search: (query: string) =>
			people
				.filter((person) => person.label.toLowerCase().includes(query.toLowerCase()))
				.map((person) => ({ id: person.id, label: person.label })),
	},
	onSelect: (person: { id: string; label: string }) => ({
		value: `@${person.label}:${person.id}`,
		label: person.label,
		variant: 'info' as const,
	}),
}

export function ChatExample() @{
	const [message, setMessage] = useState('')
	const send = (value: string) => setMessage(value)
	<View>
		<ChatComposer onSubmit={send} input={<ChatComposerInput triggers={[mention]} />} />
		<ChatTokenizedText tokens={[{ value: '@Ada Lovelace:u1', label: 'Ada Lovelace' }]}>
			{message}
		</ChatTokenizedText>
	</View>
}
```

Save and restore the whole draft, not just the serialized string, so tokens stay
editable:

```tsx
import {
	ChatComposer,
	ChatComposerInput,
	serializeChatComposerDraft,
	deserializeChatComposerDraft,
	type ChatComposerDraft,
} from '@octane-xplat/ui/chat'
import { useState } from 'octane'

export function DraftExample() {
	const [draft, setDraft] = useState<ChatComposerDraft>({ text: '', tokens: [] })
	const save = () => localStorage.setItem('draft', JSON.stringify(serializeChatComposerDraft(draft)))
	const load = () => {
		const raw = localStorage.getItem('draft')
		if (raw) setDraft(deserializeChatComposerDraft(JSON.parse(raw)))
	}

	return (
		<ChatComposer draft={draft} onDraftChange={setDraft} onSend={() => save()}>
			<ChatComposerInput />
		</ChatComposer>
	)
}
```

`ChatLayout` owns the stream-scroll and new-message hooks. Use `followLatest`
to keep the viewport locked to new content (default true), or set it to false
so the reader stays where they are until they explicitly scroll back down. Put
`scrollToTopAction` on `ChatMessageList` to load older messages; the list shows
pending state and waits for the returned promise before accepting another
top-load request.

Separate send/cancel actions from draft state: `ChatComposer` accepts `onSend`
for submitting and `onCancel` for stopping. The older `onSubmit`/`onStop` names
remain as migration aliases.

You can also drive the message list with data instead of JSX. Pass `messages`
as `ChatMessageData[]` and a custom `renderMessage` if you need a different layout:

```tsx
import { Text } from '@octane-xplat/ui'
import {
	ChatLayout,
	ChatMessageList,
	ChatComposer,
	type ChatMessageData,
} from '@octane-xplat/ui/chat'

const messages: ChatMessageData[] = [
	{ sender: 'system', content: <Text>Conversation started</Text> },
	{ sender: 'assistant', content: <Text>Welcome to your trip chat.</Text> },
]

// loadOlder belongs to your app and updates its message collection.
export function Conversation({ loadOlder }: { loadOlder: () => Promise<void> }) {
	return (
		<ChatLayout
			followLatest
			composer={<ChatComposer onSend={(text) => console.log(text)} onCancel={() => {}} />}
		>
			<ChatMessageList messages={messages} scrollToTopAction={loadOlder} />
		</ChatLayout>
	)
}
```

## Acceptance criteria

- AC1: A developer can render user/assistant rows, sender names, bubbles,
  metadata, an empty state, and a docked composer; sending trims and submits a
  non-empty value then clears the composer.
- AC2: Trigger search supports sync or async sources and selection inserts
  text or a token; token values serialize consistently for submit and display.
  Drafts serialize to JSON and round-trip through `serializeChatComposerDraft`
  / `deserializeChatComposerDraft`.
- AC3: Scroll follows content growth while locked at the bottom, exposes a
  return-to-bottom action when unlocked, and reports new messages until
  dismissed; `followLatest` controls the initial follow state.
- AC4: A top-load callback shows pending state and cannot overlap itself.
- AC5: File and dictation callbacks behave according to platform capability,
  and the recipe describes browser `File`, paste, contenteditable, event, and
  observer boundaries accurately.
- AC6: The Chat family is exported from `@octane-xplat/ui/chat` with matching
  public names and prop types for web, iOS, Android, macOS, Linux's
  web-backed entry, and the Windows app's shared TypeScript entry.

## Documentation

- AC1: [Chat API inventory and portable event/file contract](../../../docs/app/components.md#chat), plus the maintained [ChatDemo](../../../packages/demos/src/ChatDemo.tsrx).
- AC2: [ChatComposerInput, token, and trigger API](../../../docs/app/components.md#chat), this recipe's [trigger and token example](#compose-triggers-and-tokens), its [draft serialization example](#compose-triggers-and-tokens), and the maintained [ChatDemo](../../../packages/demos/src/ChatDemo.tsrx). Native inline editing remains a documented limitation: native uses a chip row and approximates mid-text token positions.
- AC3: [Chat API inventory](../../../docs/app/components.md#chat) and this recipe's [ChatLayout scroll behavior](#compose-triggers-and-tokens).
- AC4: [ChatMessageList contract](../../../docs/app/components.md#chat), its `scrollToTopAction` prop documentation, and this recipe's [data-driven example](#compose-triggers-and-tokens).
- AC5: [Portable Chat deviations](../../../docs/app/components.md#chat). Native paste/file delivery and speech recognition are unsupported; file paste and dictation therefore have no native verification.
- AC6: The [chat barrel](../../../packages/ui/src/chat/index.ts) shares the family across targets; [macOS](../../../packages/ui/package.json) resolves the same entry through its `./chat` condition. Linux uses the web entry. The [Windows app TypeScript map](../../../apps/windows/tsconfig.json) resolves the shared entry; Windows runtime checks render explicit message slots and token chips, but deferred text, composer actions, and accessibility remain blocked; see [Windows support boundary](../../design/windows-notes.md#current-support-boundary). Windows is not a supported target of this recipe.
