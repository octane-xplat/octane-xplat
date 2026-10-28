/** @jsxImportSource @octane-xplat/macos-renderer */
import 'octane/signals'
import { useSignal$ } from 'octane/signals/client'

let update: (props: any) => void
const text = 'Words that wrap across several lines in a narrow container.'

export default function Case() {
	const props$ = useSignal$<any>({ width: 120 })
	update = (props) => props$.set(props)
	return <masonview style={{ display: 'flex', flexDirection: 'column' }}>
		<label id="wrapped" text={text} maxLines={props$.get().maxLines} whiteSpace={props$.get().whiteSpace}
			style={{ width: props$.get().width, fontSize: 16, lineHeight: '20px' }} />
	</masonview>
}

export async function run(ctx: any) {
	const geometry = () => {
		const view = ctx.find('wrapped')
		if (!view) return { width: 0, height: 0 }
		const rect = view.alignmentRectForFrame(view.frame)
		return { width: Number(rect.size.width), height: Number(rect.size.height) }
	}
	await ctx.waitFor(() => geometry().width === 120 && geometry().height > 20)
	const narrow = geometry()
	ctx.assert('constrained width', narrow.width, 120)
	ctx.assert('default wraps', narrow.height > 20, true)
	update({ width: 600 })
	await ctx.waitFor(() => geometry().width === 600)
	await ctx.waitFor(() => geometry().height < narrow.height)
	ctx.assert('wide text is one line', geometry().height, 20)
	update({ width: 120, whiteSpace: 'nowrap' })
	await ctx.waitFor(() => geometry().width === 120 && geometry().height === 20)
	ctx.assert('nowrap stays one line', geometry().height, 20)
	update({ width: 120 })
	await ctx.waitFor(() => geometry().width === 120 && geometry().height > 20)
	ctx.assert('wrapping returns after nowrap removal', geometry().height, narrow.height)
	ctx.record('wrapped label sizes', { narrow, wideHeight: 20 })
}
