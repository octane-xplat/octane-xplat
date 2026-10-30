# Typography and readable text

Use this reference for Text, Heading, rich content, and readable metadata. Apply the [shared contracts](contracts.md) and consult the [task index](../primitives.md) for other controls.

## Text and Heading typography

`Text` and `Heading` carry the Astryx type-scale props. `type` selects the
theme's `--text-<type>-*` tokens (`body`, `large`, `label`, `supporting`,
`code`, `display-1`–`display-3`); `size`, `color`, and `weight` refine it;
`maxLines` truncates with an ellipsis (1 = single-line clip, >1 = line-clamp).
Omit `type` — or pass `type="inherit"` — to keep ambient typography: unlike
upstream's `'body'` default, bare `Text` inherits because it is also the
shared text host every other component composes. `Heading` sizes from
`level` (the `--text-heading-<level>-*` scale) and accepts `type` for the
display scale plus `color`/`weight`/`maxLines`.

```tsx
<>
  <Text type="body" size="sm" color="secondary" maxLines={2}>{summary}</Text>
  <Heading level={3}>Card title</Heading>
</>
```

AppKit Text/Heading now merge authored styles over typography defaults without
dropping declaration strings or runtime arrays. Heading root/purpose paths share
one leaf; RichText/Span forward styles and RichText's declared ID survives.
Renderer normalization runs before validation/creation/update, including logical
text runs and direct template creation. Native text/layout/truncation/VoiceOver
require separate target qualification; do not infer heading-level AX support from a heading role.
Prefer classes for static styles and objects for dynamic values.

```tsx
import { Heading, Text } from '@octane-xplat/ui'
export function Summary({ points }: { points: number }) {
	return <>
		<Heading level={2} style={{ fontSize: points }}>Summary</Heading>
		<Text type="body" style={{ fontSize: points }}>Ready</Text>
	</>
}
```

AppKit nested Text/RichText now use a text-owner context and emit logical spans;
Heading provides that scope to nested Text too. RichText purpose/root imports
share the AppKit leaf. RichTextSpan.text overrides children, including an empty
string; omitted/null text falls back to children. Root Text/RichText forward
parent-layout metadata; only the outer text host owns line caps/layout. A capped
root Text allows shrinking. Per-span onPress is still unwired: readable runs do
not prove glyph hit testing, native layout/AX or packed resolution.

```tsx
import { RichText, RichTextSpan, Text } from '@octane-xplat/ui'
export function Notice() {
	return <>
		<Text>Read <Text weight="bold">carefully</Text>.</Text>
		<RichText><RichTextSpan text="Ready" /></RichText>
	</>
}
```

Outer AppKit Text now forwards testID, accessible, hint and value alongside the
name. Native label/htmlview hints use accessibilityHelp; portable value text
uses accessibilityValueDescription without rewriting displayed text. Dropping
descriptions clears them to nil; dropping accessible restores participation.
Inline runs have no separate native owner. This does not add Text state/live
announcements or arbitrary role mappings, nor establish VoiceOver behavior.

```tsx
import { Text } from '@octane-xplat/ui'
export function Count({ count }: { count: number }) {
	return <Text testID="item-count" accessibilityLabel="Items"
		accessibilityValue={`${count} items`} accessibilityHint="Review the collection.">
		{count}
	</Text>
}
```

**For UI contributors**, shared component prop contracts live in
`packages/ui/src/props.ts` and feed published declarations. Consumer app
components own their own props; do not edit framework internals to define them.

AppKit Heading forwards level (default 2) independently of its visual `type`.
The readable label maps heading to AXHeading, numeric level to accessibilityValue
and current plain/rich contents to accessibilityTitle; it retains visible text
and restores captured native metadata when the heading role is removed. The
AppKit-only label intrinsic declares accessibilityHeadingLevel (1–6); prefer
Heading for application code. Source cases and packed type assertions require separate verification;
actual VoiceOver navigation/updates, native setter behavior and packing remain
unqualified. This does not add per-span owners, actions or live announcements.

```tsx
import { Heading, Text } from '@octane-xplat/ui'
export function AccountTitle({ title }: { title: string }) {
	return <Heading level={2} type="display-2">Your <Text>{title}</Text></Heading>
}
```

## Rich and streamed text

Use `@octane-xplat/ui/markdown` for `Markdown` and `useStreamingText`; chat
components live at `@octane-xplat/ui/chat`. Markdown accepts exactly one of
`text` or `data`. Tables, task markers, strike, code fences and `[id]` citations
are supported. `sources` maps ids to public Citation sources; these are individual labelled links, matching the pinned example.
Keep source keys in first-citation order for consistent numbering. See the [content guide](../../../../../docs/app/content-display.md#markdown-documents).

```tsx
import { Markdown, useStreamingText } from '@octane-xplat/ui/markdown'

function Response(props: { text: string; streaming: boolean }) {
	const displayed = useStreamingText(props.text, props.streaming, { speed: 'fast' })
	return <Markdown text={displayed} isStreaming={props.streaming} density="compact" headingLevelStart={3} />
}
```

Do not infer OS speech from a dictation button or mock recognition callback.
`useChatDictation` reports `isSupported: false` on native; expose an unavailable
state. Browser recognition also depends on host permission and service support.
The sandbox's dictation state fixtures do not start recognition.

```tsx
import { ChatDictationButton, useChatDictation } from '@octane-xplat/ui/chat'
import { Text } from '@octane-xplat/ui'

function Dictation() {
	const dictation = useChatDictation()
	return dictation.isSupported
		? <ChatDictationButton dictation={dictation} />
		: <Text>Dictation is unavailable on this host.</Text>
}
```

## AppKit heading snapshots

useOutlineFromView on ui/macos now uses the installed renderer heading reader.
Check getOutlineFromViewCapabilities: missing/older hosts report unsupported;
method presence reports snapshot capability without a native runtime pass.
Pass a native root/ref or ScrollableArea handle. Discovery reads owned Heading
IDs, current plain/rich labels and levels once per root/reader, recollecting
only when a render exposes a different root/reader. It does not observe mutable
contents. Generated unique slugs avoid authored IDs but are not written onto
views; duplicate authored IDs keep the first. Prefer document-derived items for
dynamic content. Read [Outline navigation](tables.md#appkit-outline-navigation) for AppKit activation; native/packed discovery
requires separate target qualification; see the content-display guide.

```tsx
import { useRef } from 'octane'
import { Heading, Outline, ScrollableArea, type ScrollableAreaHandle } from '@octane-xplat/ui'
import { useOutlineFromView } from '@octane-xplat/ui/macos'
export function Guide() {
	const content = useRef<ScrollableAreaHandle | null>(null)
	const items = useOutlineFromView(content)
	return <>
		<ScrollableArea ref={content} height={200}><Heading id="intro" level={1}>Introduction</Heading></ScrollableArea>
		<Outline items={items} hasScrollOnClick={false} />
	</>
}
```
