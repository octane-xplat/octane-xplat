/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { ChatLayout, ChatMessageList } from '@octane-xplat/ui/chat'
import type { ChatMessageData } from '@octane-xplat/ui/chat'
import type { ProbeContext } from '../../../../scripts/probe/context'
import './chat.css'
let fill = () => {},
	grow = () => {}

export default function ShortChat() @{
	const [messages, setMessages] = useState<ChatMessageData[]>([
		{ id: 'first', sender: 'assistant', content: 'Hello' },
	])

	const [height, setHeight] = useState(48)
	fill = () =>
		setMessages(
			Array.from({ length: 30 }, (_, i) => ({
				id: `m${i}`,
				sender: 'assistant',
				content: `Message ${i}`,
			})),
		)

	grow = () => setHeight(120)

	<ChatLayout
		id="short-chat"
		className="chat-probe"
		keyboardFollow="never"
		followLatest={false}
		composer={<div style={{ height }}>Composer</div>}
	>
		<ChatMessageList
			messages={messages}
			gap={0}
			renderMessage={(message) => <div style={{ height: 64 }}>{message.content}</div>}
		/>
	</ChatLayout>
}

export async function run(ctx: ProbeContext) {
	const root: any = await ctx.waitFor(() => ctx.find('short-chat'))
	await ctx.waitFor(() => root.clientHeight === 480)
	ctx.assert(
		'short conversation has no unnecessary scroll range',
		root.scrollHeight - root.clientHeight < 2,
		true,
	)

	fill()
	await ctx.waitFor(() => root.scrollHeight > 1800)
	await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
	ctx.assert('followLatest false preserves the initial reading position', root.scrollTop < 1, true)
	const before = root.scrollHeight
	grow()
	await ctx.waitFor(() => root.scrollHeight > before + 60)
	await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
	ctx.assert(
		'disabled content following remains paused after composer growth',
		root.scrollTop < 1,
		true,
	)
}
