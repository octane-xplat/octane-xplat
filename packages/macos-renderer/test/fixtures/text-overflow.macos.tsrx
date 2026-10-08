/** @jsxImportSource @octane-xplat/macos-renderer */
import 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
let change: (value: any) => void
const full = 'A very long tab title with repeated words '.repeat(12)

export default function Case() {
	const props$ = useSignal$<any>({
		text: full,
		maxLines: 1,
		whiteSpace: 'nowrap',
		textOverflow: 'ellipsis',
	})

	change = (value) => props$.set(value)
	return <absolutelayout>
		<label
			id="title"
			{...props$.get()}
			style={{ width: props$.get().width ?? 120, height: 32, lineHeight: props$.get().lineHeight }}
		/>
	</absolutelayout>
}

export async function run(ctx: any) {
	await ctx.waitFor(() => ctx.find('title'))
	const view = ctx.find('title')
	ctx.assert('full source', String(view.stringValue), full)
	ctx.assert('full accessibility value', String(view.accessibilityValue), full)
	ctx.assert('single line', Number(view.maximumNumberOfLines), 1)
	ctx.assert('tail mode', Number(view.cell.lineBreakMode), 4)
	const small = view.cell.cellSizeForBounds({ origin: { x: 0, y: 0 }, size: { width: 120, height: 1000 } })
	const wide = view.cell.cellSizeForBounds({ origin: { x: 0, y: 0 }, size: { width: 900, height: 1000 } })
	ctx.record('single line measurements', {
		narrowHeight: Number(small.height),
		wideHeight: Number(wide.height),
	})

	ctx.assert('narrow stays one line', Number(small.height) === Number(wide.height), true)
	ctx.host.window.setContentSize({ width: 900, height: 420 })
	change({ text: full, maxLines: 1, whiteSpace: 'nowrap', textOverflow: 'ellipsis', width: 900 })
	await ctx.waitFor(() => ctx.inspect('title').frame.width >= 899)
	ctx.assert('resized row height', ctx.inspect('title').frame.height, 32)
	ctx.assert('resize preserves full source', String(view.stringValue), full)
	ctx.host.window.setContentSize({ width: 120, height: 420 })
	change({ text: 'Short', maxLines: 1, textOverflow: 'clip', lineHeight: 24 })
	await ctx.waitFor(() => String(view.stringValue) === 'Short')
	const paragraph = view.attributedStringValue.attributeAtIndexEffectiveRange(
		NSParagraphStyleAttributeName, 0, null,
	)

	ctx.assert('attributed clipping', Number(paragraph.lineBreakMode), 2)
	change({ text: full, maxLines: 2, whiteSpace: 'normal', textOverflow: 'ellipsis' })
	await ctx.waitFor(() => Number(view.maximumNumberOfLines) === 2)
	ctx.assert('wraps', Boolean(view.cell.wraps), true)
	ctx.assert('last line ellipsis', Boolean(view.cell.truncatesLastVisibleLine), true)
	change({ text: 'Short' })
	await ctx.waitFor(() => String(view.stringValue) === 'Short')
	ctx.assert('removed line limit', Number(view.maximumNumberOfLines), 0)
	ctx.assert('removed overflow', Boolean(view.cell.truncatesLastVisibleLine), false)
	ctx.assert('restored wrapping', Boolean(view.cell.wraps), true)
}
