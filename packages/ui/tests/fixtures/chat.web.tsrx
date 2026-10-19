/** @jsxImportSource @octane-xplat/jsx/dom */
import { useState } from 'octane'
import { ChatLayout, ChatMessageList } from '@octane-xplat/ui/chat'
import type { ChatMessageData } from '@octane-xplat/ui/chat'
import { TextInput } from '@octane-xplat/ui'
import type { ProbeContext } from '../../../../scripts/probe/context'
import './chat.css'
let stream = () => {},
	prepend = () => {},
	append = () => {},
	grow = (_height: number) => {}

export default function ChatProbe() @{
	const [messages, setMessages] = useState<ChatMessageData[]>(
		Array.from({ length: 30 }, (_, i) => ({
			id: `m${i}`,
			sender: 'assistant',
			content: `Message ${i}`,
		})),
	)

	const [lastHeight, setLastHeight] = useState(64),
		[composerHeight, setComposerHeight] = useState(48)

	stream = () => setLastHeight(160)
	grow = setComposerHeight
	prepend = () =>
		setMessages((old) => [
			...Array.from({ length: 5 }, (_, i) => ({
				id: `old${i}`,
				sender: 'assistant' as const,
				content: `Older ${i}`,
			})),
			...old,
		])

	append = () =>
		setMessages((old) => [...old, { id: 'tail', sender: 'assistant', content: 'Newest message' }])

	<ChatLayout
		id="chat-root"
		className="chat-probe"
		composer={
			<TextInput id="chat-field" defaultValue="Composer" style={{ height: composerHeight }} />
		}
	>
		<ChatMessageList
			id="chat-list"
			messages={messages}
			align="top"
			gap={0}
			renderMessage={(message) => (
				<div id={`row-${message.id}`} style={{ height: message.id === 'm29' ? lastHeight : 64 }}>
					{message.content}
				</div>
			)}
		/>
	</ChatLayout>
}

export async function run(ctx: ProbeContext) {
	const root: any = await ctx.waitFor(() => ctx.find('chat-root'))
	let sampling = true,
		frame = 0

	const sample = () => {
		if (!sampling) {
			return
		}

		ctx.record('latest scroll', {
			offset: root.scrollTop,
			max: root.scrollHeight - root.clientHeight,
			following: root.hasAttribute('data-vx-chat-following'),
			dock: root.querySelector('.vx-chatlayout-dock')?.getBoundingClientRect().height,
		})

		frame = requestAnimationFrame(sample)
	}

	frame = requestAnimationFrame(sample)
	ctx.onCleanup(() => {
		sampling = false
		cancelAnimationFrame(frame)
	})

	const end = () => root.scrollHeight - root.clientHeight - root.scrollTop < 2
	await ctx.waitFor(() => root.scrollHeight > 1000 && end())
	ctx.assert('long chat initially follows conversation end', end(), true)
	root.scrollTop = Math.max(0, root.scrollHeight - root.clientHeight - 700)
	await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
	const rootBox = root.getBoundingClientRect()
	const row: any = Array.from(root.querySelectorAll('[id^="row-"]')).find((element: any) => {
		const b = element.getBoundingClientRect()
		return b.bottom > rootBox.top && b.top < rootBox.bottom
	})

	const id = row.id,
		y = row.getBoundingClientRect().y,
		offset = root.scrollTop

	const beforeStream = root.scrollHeight
	stream()
	await ctx.waitFor(() => root.scrollHeight > beforeStream + 90)
	ctx.assert(
		'streaming preserves an older reading row',
		Math.abs(row.getBoundingClientRect().y - y) < 1,
		true,
	)

	ctx.assert(
		'streaming does not force older reader to end',
		Math.abs(root.scrollTop - offset) < 1,
		true,
	)

	const beforePrepend = root.scrollHeight
	prepend()
	await ctx.waitFor(() => ctx.find('row-old0') && root.scrollHeight > beforePrepend + 300)
	await ctx.waitFor(() => Math.abs(row.getBoundingClientRect().y - y) < 1)
	ctx.assert('prepend preserves stable row identity', ctx.find(id) === row, true)
	ctx.assert(
		'prepend preserves reading anchor pixel',
		Math.abs(row.getBoundingClientRect().y - y) < 1,
		true,
	)

	const beforeGrow = root.scrollHeight
	grow(96)
	await ctx.waitFor(() => root.scrollHeight > beforeGrow + 40)
	ctx.assert(
		'composer growth preserves older reading anchor',
		Math.abs(row.getBoundingClientRect().y - y) < 1,
		true,
	)

	const beforeAppend = root.scrollHeight
	append()
	await ctx.waitFor(() => root.scrollHeight > beforeAppend + 60)
	await ctx.waitFor(() => root.querySelector('[aria-label="New messages"]'))
	ctx.assert(
		'new arrivals show an action while reading older messages',
		!!root.querySelector('[aria-label="New messages"]'),
		true,
	)

	root.querySelector('[aria-label="New messages"]').click()
	await ctx.waitFor(end)
	ctx.assert('new-message action returns to the end', end(), true)
	const beforeLastGrow = root.scrollHeight
	grow(160)
	await ctx.waitFor(() => root.scrollHeight > beforeLastGrow + 60 && end())
	ctx.assert('composer growth follows only after end tracking resumes', end(), true)
	ctx.record('chat offsets', { offset: root.scrollTop, max: root.scrollHeight - root.clientHeight })
}
