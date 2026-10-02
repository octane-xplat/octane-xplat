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
app. Reuse that token value when displaying a submitted message:

```tsrx
import { useState } from 'octane'
import { ChatComposer, ChatComposerInput, ChatTokenizedText, View } from '@octane-xplat/ui'

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

`ChatLayout` owns the stream-scroll and new-message hooks. It follows content
growth while the reader stays at the bottom, then offers a return button when
the reader scrolls away. Put `scrollToTopAction` on `ChatMessageList` to load
older messages; the list shows pending state and waits for the returned promise
before accepting another top-load request.

```tsx
import { ChatLayout, ChatMessageList, ChatComposer, Text } from '@octane-xplat/ui'

// loadOlder belongs to your app and updates its message collection.
export function Conversation({ loadOlder }: { loadOlder: () => Promise<void> }) {
	return (
		<ChatLayout composer={<ChatComposer onSubmit={(text) => console.log(text)} />}>
			<ChatMessageList scrollToTopAction={loadOlder}>
				<Text>Welcome to your trip chat.</Text>
			</ChatMessageList>
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
- AC3: Scroll follows content growth while locked at the bottom, exposes a
  return-to-bottom action when unlocked, and reports new messages until
  dismissed.
- AC4: A top-load callback shows pending state and cannot overlap itself.
- AC5: File and dictation callbacks behave according to platform capability,
  and the recipe describes browser `File`, paste, contenteditable, event, and
  observer boundaries accurately.
- AC6: The Chat family is exported with matching public names and prop types
  for web, iOS, Android, macOS, Linux's web-backed entry, and the Windows
  app's shared TypeScript entry.

## Documentation

- AC1: [Chat API inventory and portable event/file contract](../docs/components.md#chat), plus the maintained [ChatDemo](../packages/demos/src/ChatDemo.tsrx).
- AC2: [ChatComposerInput, token, and trigger API](../docs/components.md#chat), this recipe's [trigger and token example](#compose-triggers-and-tokens), and the maintained [ChatDemo](../packages/demos/src/ChatDemo.tsrx). Native inline editing remains a documented limitation: native uses a chip row and approximates mid-text token positions.
- AC3: [Chat API inventory](../docs/components.md#chat) and this recipe's [ChatLayout scroll behavior](#compose-triggers-and-tokens).
- AC4: [ChatMessageList contract](../docs/components.md#chat) and its `scrollToTopAction` prop documentation.
- AC5: [Portable Chat deviations](../docs/components.md#chat). Native paste/file delivery and speech recognition are unsupported; file paste and dictation therefore have no native verification.
- AC6: [Root exports](../packages/ui/src/index.shared.ts) share the family; [macOS](../packages/ui/src/index.macos.ts) explicitly re-exports it. Linux uses the web entry. The [Windows app TypeScript map](../apps/windows/tsconfig.json) resolves the shared entry; Windows runtime checks render explicit message slots and token chips, but deferred text, composer actions, and accessibility remain blocked; see [Windows support boundary](../docs/windows-notes.md#current-support-boundary). Windows is not a supported target of this recipe.
