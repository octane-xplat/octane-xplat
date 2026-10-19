/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../src/style-merge'
import { useState } from 'octane'
import { ChatLayout, ChatMessageList, useChatLayoutContext } from '@octane-xplat/ui/chat'
import type { ChatMessageData } from '@octane-xplat/ui/chat'
import { TextInput } from '@octane-xplat/ui'
import { chatHost } from '../../src/chat-scroll-host'
import { chatScrollControl } from '../../src/chat-scroll-state'
import type { ProbeContext } from '../../../../scripts/probe/context'
let seenContext: any = null
function ContextCheck() {
	seenContext = useChatLayoutContext()
	return null
}

let stream = () => {},
	prepend = () => {},
	grow = (_height: number) => {},
	policy = (_value: 'never' | 'always' | 'when-at-end') => {},
	panel = (_height: number) => {}

const scrollRef: { current: any } = { current: null }
export default function ChatProbe() @{
	const [messages, setMessages] = useState<ChatMessageData[]>(
		Array.from({ length: 30 }, (_, i) => ({
			id: `m${i}`,
			sender: 'assistant',
			content: `Message ${i}`,
		})),
	)

	const [lastHeight, setLastHeight] = useState(64),
		[composerHeight, setComposerHeight] = useState(48),
		[follow, setFollow] = useState<'never' | 'always' | 'when-at-end'>('when-at-end'),
		[panelHeight, setPanelHeight] = useState(0)

	stream = () => setLastHeight(160)
	grow = setComposerHeight
	policy = setFollow
	panel = setPanelHeight
	prepend = () =>
		setMessages((old) => [
			...Array.from({ length: 5 }, (_, i) => ({
				id: `old${i}`,
				sender: 'assistant' as const,
				content: `Older ${i}`,
			})),
			...old,
		])

	<ChatLayout
		id="chat-root"
		scrollRef={scrollRef}
		keyboardFollow={follow}
		bottomPanelHeight={panelHeight}
		composer={
			<masonview style={{ display: 'flex', flexDirection: 'column' }}>
				<TextInput id="chat-field" defaultValue="Composer" style={{ height: composerHeight }} />
				{panelHeight > 0 ? (
					<masonview
						id="chat-panel"
						style={mergeStyle(
							{ display: 'flex', flexDirection: 'column' },
							{ height: panelHeight },
						)}
					>
						<label text="Custom panel" />
					</masonview>
				) : null}
			</masonview>
		}
	>
		<ContextCheck />
		<ChatMessageList
			id="chat-list"
			messages={messages}
			align="top"
			gap={0}
			renderMessage={(message) => (
				<label
					id={`row-${message.id}`}
					text={String(message.content)}
					style={{ height: message.id === 'm29' ? lastHeight : 64 }}
				/>
			)}
		/>
	</ChatLayout>
}

export async function run(ctx: ProbeContext) {
	const field: any = await ctx.waitFor(
		() => ctx.find('chat-field')?.window && ctx.find('chat-field'),
	)

	const viewport = scrollRef.current,
		scroll = chatHost.scroll(viewport)

	const sample = setInterval(
		() =>
			ctx.record('layout', {
				offset: scroll.verticalOffset,
				max: scroll.scrollableHeight,
				viewport: chatHost.height(viewport),
				dock: chatHost.height(chatHost.children(ctx.find('chat-root'))[1]),
				field: chatHost.height(field),
			}),
		50,
	)

	ctx.onCleanup(() => clearInterval(sample))
	const end = () => Math.abs(scroll.scrollableHeight - scroll.verticalOffset) < 2
	ctx.record('phase', 'initial end')
	await ctx.waitFor(() => scroll.scrollableHeight > 500 && end())
	ctx.assert('AppKit long chat initially follows end', end(), true)
	const eventLog: any[] = []
	const changed = () =>
		eventLog.push({
			offset: scroll.verticalOffset,
			max: scroll.scrollableHeight,
			following: chatScrollControl(viewport)?.isFollowing(),
		})

	scroll.on('scroll', changed)
	ctx.onCleanup(() => scroll.off('scroll', changed))
	scroll.scrollToVerticalOffset(Math.max(0, scroll.scrollableHeight - 700), false)
	await ctx.waitFor(() => !end())
	const position = (row: any) => chatHost.position(row, viewport)!
	const row = Array.from({ length: 30 }, (_, i) => ctx.find(`row-m${i}`)).find((candidate) => {
		const b = position(candidate)
		return b && b.y + b.height > 0 && b.y < chatHost.height(viewport)
	})

	const oldId = Array.from({ length: 30 }, (_, i) => `row-m${i}`).find(
			(id) => ctx.find(id) === row,
		)!,
		before = position(row).y,
		offset = scroll.verticalOffset

	ctx.record('manual state', {
		following: chatScrollControl(viewport)?.isFollowing(),
		events: eventLog,
	})

	ctx.record('phase', 'stream')
	const previous = scroll.scrollableHeight
	ctx.record('before stream', {
		offset,
		max: previous,
		clip: viewport.contentView.bounds.origin.y,
		flipped: viewport.documentView.isFlipped,
		anchorY: before,
	})

	stream()
	await ctx.waitFor(() => scroll.scrollableHeight > previous + 90)
	ctx.record('after stream', {
		offset: scroll.verticalOffset,
		max: scroll.scrollableHeight,
		clip: viewport.contentView.bounds.origin.y,
		anchorY: position(row).y,
	})

	await ctx.waitFor(() => Math.abs(position(row).y - before) < 1)
	ctx.assert(
		'AppKit streaming preserves history offset',
		Math.abs(scroll.verticalOffset - offset) < 1,
		true,
	)

	ctx.assert(
		'AppKit streaming preserves reading pixel',
		Math.abs(position(row).y - before) < 1,
		true,
	)

	ctx.record('phase', 'prepend')
	const beforePrepend = scroll.scrollableHeight
	prepend()
	await ctx.waitFor(() => ctx.find('row-old0') && scroll.scrollableHeight > beforePrepend + 300)
	await ctx.waitFor(() => Math.abs(position(row).y - before) < 1)
	ctx.assert('AppKit prepend retains row identity', ctx.find(oldId) === row, true)
	ctx.assert('AppKit prepend retains reading pixel', Math.abs(position(row).y - before) < 1, true)
	ctx.record('phase', 'grow')
	const beforeGrow = scroll.scrollableHeight
	grow(96)
	await ctx.waitFor(() => scroll.scrollableHeight > beforeGrow + 40)
	await ctx.waitFor(() => Math.abs(position(row).y - before) < 1)
	ctx.assert(
		'AppKit composer growth preserves history',
		Math.abs(position(row).y - before) < 1,
		true,
	)

	scroll.scrollToVerticalOffset(scroll.scrollableHeight, false)
	await ctx.waitFor(end)
	const beforeEndGrow = scroll.scrollableHeight
	grow(160)
	await ctx.waitFor(
		() => scroll.scrollableHeight > beforeEndGrow && chatHost.height(field) >= 160 && end(),
	)

	ctx.assert('AppKit composer growth follows resumed end', end(), true)
	ctx.record('final', { offset: scroll.verticalOffset, max: scroll.scrollableHeight })
}
