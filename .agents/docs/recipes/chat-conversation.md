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
- Load older history without firing duplicate requests while one is pending,
  preserving the retained reading row.
- Keep the composer clear of the phone keyboard; follow keyboard movement only
  according to an explicit policy and count matching custom-panel space once.
- Report target-specific limits for file input, speech recognition, and rich
  token editing.

## Compose triggers and tokens

Give each trigger a synchronous or asynchronous search source. Selection can
insert a token whose `value` remains stable for submission and display. Use
structured draft serialization to preserve text and tokens across a save and
restore, including custom renderer recovery where needed. The numbered
[draft and mentions walkthrough](../../../examples/chat/draft-with-mentions.tsx)
shows an in-memory round trip; an app owns persistent storage and validation.

`ChatLayout` owns the stream-scroll and new-message hooks. Use `followLatest`
to keep the viewport locked to new content (default true), or set it to false
so the reader stays where they are until they explicitly scroll back down. Put
`scrollToTopAction` on `ChatMessageList` to load older messages; the list shows
pending state and waits for the returned promise before accepting another
top-load request.

Separate send/cancel actions from draft state: `ChatComposer` accepts `onSend`
for submitting and `onCancel` for stopping. The older `onSubmit`/`onStop` names
remain as migration aliases.

The numbered [conversation walkthrough](../../../examples/chat/conversation.tsx)
shows a data-driven list, composer and older-message callback.

## Keyboard movement and reading anchors

Follow the [conversation guide](../../../docs/app/software-keyboard.md#keep-a-conversation-steady)
for policy examples and matching custom-panel space. Keep message IDs stable
when prepending history. The maintained ChatDemo uses the default policy; the
UI chat fixtures qualify native keyboard geometry and retained reading pixels.

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

- AC7: Native keyboard opening/closing clears the composer, respects
  `keyboardFollow` (`never`, `always`, or default `when-at-end`), and accounts for
  composer and matching custom-panel heights once. Web/macOS have neutral
  software-keyboard behavior.
- AC8: Reading history retains the same row and visible position across prepend,
  streaming below the reader, and composer growth. Short conversations remain
  usable, and resumed end-follow tracks growth.

- AC9: Render rich assistant content through public Markdown and smooth cumulative text; describe citation composition and reduced-motion/native limits.

## Documentation

- AC9: [Rich Markdown and streamed text](../../../docs/app/content-display.md#markdown-documents), [citations and reduced-motion limits](../../../docs/app/markdown.md#handle-links-and-citations); maintained [sandbox consumers](../../../apps/astryx-sandbox/src/examples/markdown/MarkdownRichContent.tsrx) and [streaming hook example](../../../apps/astryx-sandbox/src/examples/hooks/useStreamingTextHookUsage.tsrx).
- AC1: [Chat API inventory and portable event/file contract](../../../docs/app/components.md#chat), plus the maintained [ChatDemo](../../../packages/demos/src/ChatDemo.tsrx).
- AC2: [ChatComposerInput, token, and trigger API](../../../docs/app/components.md#chat), the [draft and mentions walkthrough](../../../examples/chat/draft-with-mentions.tsx), and the maintained [ChatDemo](../../../packages/demos/src/ChatDemo.tsrx). Native inline editing remains a documented limitation: native uses a chip row and approximates mid-text token positions.
- AC3: [Chat API inventory](../../../docs/app/components.md#chat) and this recipe's [ChatLayout scroll behavior](#compose-triggers-and-tokens).
- AC4: [ChatMessageList contract](../../../docs/app/components.md#chat), its `scrollToTopAction` prop documentation, and the [conversation walkthrough](../../../examples/chat/conversation.tsx).
- AC5: [Portable Chat deviations](../../../docs/app/components.md#chat). Native paste/file delivery and speech recognition are unsupported; file paste and dictation therefore have no native verification.
- AC6: The [chat barrel](../../../packages/ui/src/chat/index.ts) shares the family across targets; [macOS](../../../packages/ui/package.json) resolves the same entry through its `./chat` condition. Linux uses the web entry. The [Windows app TypeScript map](../../../apps/windows/tsconfig.json) resolves the shared entry; Windows runtime checks render explicit message slots and token chips, but deferred text, composer actions, and accessibility remain blocked; see [Windows support boundary](../../design/windows-notes.md#current-support-boundary). Windows is not a supported target of this recipe.

- AC7: [Conversation keyboard guide](../../../docs/app/software-keyboard.md#keep-a-conversation-steady), [ChatDemo](../../../packages/demos/src/ChatDemo.tsrx), and maintained [iOS chat fixture](../../../packages/ui/tests/fixtures/chat.ios.tsrx).
- AC8: [Conversation keyboard guide](../../../docs/app/software-keyboard.md#keep-a-conversation-steady), [browser fixture](../../../packages/ui/tests/fixtures/chat.web.tsrx), and [AppKit fixture](../../../packages/ui/tests/fixtures/chat.macos.tsrx).

The [packed keyboard/UI consumer](../../../packages/keyboard/tests/packed-consumer.mts)
checks chat follow policies and panel-height props under six platform conditions
and two TypeScript resolver modes. [Final qualification](../keyboard.md#final-workflow-qualification)
keeps chat's programmatic scrolling/geometry evidence separate from OS typing
in the form and shared-sheet journey; the latter does not qualify ChatComposer
editing or platform accessibility.
