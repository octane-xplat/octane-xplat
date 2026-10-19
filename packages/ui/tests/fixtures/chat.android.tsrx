/** @jsxImportSource @octane-xplat/jsx */
import { mergeStyle } from '../../src/style-merge'
import { useState } from 'octane'
import { ChatLayout, ChatMessageList, useChatLayoutContext } from '@octane-xplat/ui/chat'
import type { ChatMessageData } from '@octane-xplat/ui/chat'
import { TextInput } from '@octane-xplat/ui'
import { KeyboardController } from '../../../keyboard/src/index'
import { chatHost } from '../../src/chat-scroll-host'
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
	const field = await ctx.waitFor(() => ctx.find('chat-field')?.isLoaded && ctx.find('chat-field'))
	const root = ctx.find('chat-root'),
		viewport = scrollRef.current,
		scroll = chatHost.scroll(viewport)

	const keys: any[] = []
	const off = KeyboardController.onMove(root, (state) => {
		keys.push(state)
		ctx.record('latest keyboard', state)
	})

	ctx.onCleanup(off)
	ctx.record('layout context', {
		available: !!seenContext,
		viewportMatches: seenContext?.scrollContainerRef.current === viewport,
	})

	const sample = setInterval(() => {
		const dock = root.getChildAt(1),
			content = viewport.content

		const native = field.ios,
			rect = native?.convertRectToView(native.bounds, native.window)

		ctx.record('native layout', {
			offset: scroll.verticalOffset,
			max: scroll.scrollableHeight,
			dockY: dock?.translateY,
			dockHeight: dock?.getActualSize?.().height,
			dockValid: dock?.isLayoutValid,
			padding: content?.paddingBottom,
			fieldBottom: rect ? rect.origin.y + rect.size.height : null,
		})
	}, 50)

	ctx.onCleanup(() => clearInterval(sample))
	const end = () => Math.abs(scroll.scrollableHeight - scroll.verticalOffset) < 2
	const opened = () => {
		const key = keys.at(-1)
		return (
			key?.inset > 100 &&
			key?.capabilities.nativeFrames &&
			key.currentFrame &&
			key.targetFrame &&
			Math.abs(key.currentFrame.y - key.targetFrame.y) < 1
		)
	}

	const hidden = () => {
		const key = keys.at(-1)
		return (
			key?.inset === 0 &&
			(!key.currentFrame ||
				key.currentFrame.height === 0 ||
				key.currentFrame.y >= key.windowRect.y + key.windowRect.height - 1)
		)
	}

	const blur = () => {
		field.dismissSoftInput()
		field.android?.clearFocus()
		field.ios?.resignFirstResponder()
	}

	ctx.record('phase', 'initial end')
	const position = (row: any) => chatHost.position(row, viewport)!
	await ctx.waitFor(() => scroll.scrollableHeight > 500 && end())
	ctx.assert('long chat initially follows conversation end', end(), true)
	if (field.android) {
		await ctx.waitFor(() => field.android.hasWindowFocus())
	}

	field.focus()
	ctx.record('phase', 'keyboard open')
	await ctx.waitFor(opened)
	ctx.record('phase', 'open end')
	await ctx.waitFor(end)
	const nativeTop = () => (keys.at(-1).currentFrame ?? keys.at(-1).targetFrame).y
	const fieldBottom = () => {
		if (field.ios) {
			const rect = field.ios.convertRectToView(field.ios.bounds, field.ios.window)
			return rect.origin.y + rect.size.height
		}

		const point = (Array as any).create('int', 2),
			origin = (Array as any).create('int', 2)

		field.android.getLocationOnScreen(point)
		field.android.getRootView().getLocationOnScreen(origin)
		return (
			(point[1] - origin[1] + field.android.getHeight()) /
			field.android.getResources().getDisplayMetrics().density
		)
	}

	ctx.record('phase', 'composer clearance')
	await ctx.waitFor(() => fieldBottom() <= nativeTop() + 1)
	ctx.assert('composer clears native keyboard', fieldBottom() <= nativeTop() + 1, true)
	ctx.assert('keyboard opening preserves conversation end', end(), true)
	scroll.scrollToVerticalOffset(Math.max(0, scroll.scrollableHeight - 700), false)
	await ctx.waitFor(() => !end())
	const row = Array.from({ length: 30 }, (_, i) => ctx.find(`row-m${i}`)).find((candidate) => {
		const b = position(candidate)
		return b && b.y + b.height > 0 && b.y < chatHost.height(viewport)
	})

	const beforeY = position(row).y,
		oldRow = row,
		oldId = row.id,
		offset = scroll.verticalOffset

	const beforeStream = scroll.scrollableHeight
	stream()
	await ctx.waitFor(() => scroll.scrollableHeight > beforeStream + 90)
	ctx.assert('streaming retains older reading row', Math.abs(position(row).y - beforeY) < 1, true)
	ctx.assert('streaming does not force end', Math.abs(scroll.verticalOffset - offset) < 1, true)
	ctx.record('phase', 'prepend')
	const beforePrepend = scroll.scrollableHeight
	prepend()
	await ctx.waitFor(() => ctx.find('row-old0') && scroll.scrollableHeight > beforePrepend + 300)
	await ctx.waitFor(() => Math.abs(position(row).y - beforeY) < 1)
	ctx.assert('prepend retains native row identity', ctx.find(oldId) === oldRow, true)
	ctx.assert('prepend retains reading anchor pixel', Math.abs(position(row).y - beforeY) < 1, true)
	ctx.record('phase', 'composer growth')
	const beforeGrow = scroll.scrollableHeight
	grow(96)
	await ctx.waitFor(() => scroll.scrollableHeight > beforeGrow + 40)
	ctx.assert(
		'composer growth preserves older reading anchor',
		Math.abs(position(row).y - beforeY) < 1,
		true,
	)

	ctx.record('phase', 'always close')
	policy('always')
	blur()
	await ctx.waitFor(() => hidden() && end())
	ctx.assert('always policy follows even from history on close', end(), true)
	ctx.record('phase', 'second open')
	field.focus()
	await ctx.waitFor(() => opened() && end())
	const reserved = keys.at(-1).inset,
		beforePanel = scroll.verticalOffset,
		composerBefore = position(field).y

	ctx.record('phase', 'panel mount')
	panel(reserved)
	await ctx.waitFor(() => ctx.find('chat-panel')?.getActualSize().height >= reserved - 1)
	await ctx.waitFor(() => Math.abs(position(field).y - composerBefore) < 2 && end())
	ctx.assert(
		'custom panel mounting preserves composer position above keyboard',
		Math.abs(position(field).y - composerBefore) < 2,
		true,
	)

	ctx.record('phase', 'panel close')
	blur()
	await ctx.waitFor(hidden)
	await ctx.waitFor(() => Math.abs(position(field).y - composerBefore) < 2 && end())
	ctx.assert(
		'keyboard to matching panel preserves end position',
		Math.abs(scroll.verticalOffset - beforePanel) < 2,
		true,
	)

	ctx.assert('custom panel survives keyboard close', ctx.find('chat-panel').isLoaded, true)
	ctx.record('chat final', {
		offset: scroll.verticalOffset,
		max: scroll.scrollableHeight,
		composerY: position(field).y,
		panelHeight: reserved,
	})
}
