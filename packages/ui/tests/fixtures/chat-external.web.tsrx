/** @jsxImportSource @octane-xplat/jsx/dom */
import { useRef, useState } from 'octane'
import { ChatLayout, ChatMessageList } from '@octane-xplat/ui/chat'
import type { ProbeContext } from '../../../../scripts/probe/context'
let grow = () => {}
export default function ExternalChat() @{
	const scroller = useRef<any>(null)
	const [height, setHeight] = useState(48)
	grow = () => setHeight(128)

	<div id="external-chat" ref={scroller} style={{ height: 480, overflowY: 'auto' }}>
		<ChatLayout
			id="external-layout"
			scrollRef={scroller}
			composer={<div style={{ height }}>Composer</div>}
		>
			<ChatMessageList
				gap={0}
				messages={Array.from({ length: 30 }, (_, i) => ({
					id: String(i),
					sender: 'assistant' as const,
					content: String(i),
				}))}
				renderMessage={(message) => <div style={{ height: 64 }}>{message.content}</div>}
			/>
		</ChatLayout>
	</div>
}

export async function run(ctx: ProbeContext) {
	const root: any = await ctx.waitFor(() => ctx.find('external-chat'))
	const end = () => root.scrollHeight - root.clientHeight - root.scrollTop < 2
	await ctx.waitFor(() => root.scrollHeight > 1800 && end())
	const content = root.querySelector('.vx-chatlayout-messages'),
		dock = root.querySelector('.vx-chatlayout-dock')

	ctx.assert(
		'external scroller reserves its fixed composer once',
		Math.abs(
			parseFloat(getComputedStyle(content).paddingBottom) - dock.getBoundingClientRect().height,
		) < 1,
		true,
	)

	const before = root.scrollHeight
	grow()
	await ctx.waitFor(() => root.scrollHeight > before + 70 && end())
	ctx.assert('external scroller follows composer growth at end', end(), true)
	root.scrollTop -= 600
	await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))
	ctx.assert(
		'external history scroll stays unlocked',
		!root.hasAttribute('data-vx-chat-following'),
		true,
	)
}
