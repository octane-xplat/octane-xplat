/** @jsxImportSource @octane-xplat/macos-renderer */
import { VStack } from '@octane-xplat/ui'
import { createStore, useStore } from '@octane-xplat/ui/data'
import { createNanoIconSet, NanoIcon } from '@octane-xplat/nano-icons'
import type { ProbeContext } from '../../scripts/probe/context'
import { glyphMap } from './nano-icons-font/XplatProbe'
import { probeFontBytes } from './nano-icons-font/bytes'

// AppKit has no app/fonts contract — register the generated TTF bytes through
// CoreText + the renderer's family registry.
const ProbeIcons = createNanoIconSet(glyphMap, { font: { data: probeFontBytes() } })

const selection = createStore({ name: 'dot', color: '#123456', size: 24 })

export default function NanoIconsMacosProbe() {
	const current = useStore(selection)
	return <VStack>
		<NanoIcon id="nano-main" {...current} label="Direction" />
		<ProbeIcons.Icon id="nano-duo" name="bell" size={48} />
		<NanoIcon id="nano-missing" name="nope" />
	</VStack>
}

function glyphSnapshot(ctx: ProbeContext, id: string) {
	const view = ctx.find(id)
	const layers = []
	for (const child of view?.subviews ?? []) {
		const text = String(child?.stringValue ?? child?.text ?? '')
		if (text) {
			layers.push({ codePoint: text.codePointAt(0) })
		}
	}

	const frame = ctx.inspect(id).frame // inspect forces a layout pass
	return {
		layers,
		label: view?.accessibilityLabel,
		width: frame?.width,
		height: frame?.height,
	}
}

export async function run(ctx: ProbeContext) {
	ctx.assert('icon font registered', await ProbeIcons.ready, 'ready')

	const main = glyphSnapshot(ctx, 'nano-main')
	ctx.assert('glyph container width', main.width, 24)
	ctx.assert('glyph container height', main.height, 24)
	ctx.assert('accessible label', main.label, 'Direction')
	ctx.assert('single layer for one-color icon', main.layers.length, 1)
	ctx.assert('layer codepoint', main.layers[0]?.codePoint, glyphMap.i.dot[1][0][0])

	const duo = glyphSnapshot(ctx, 'nano-duo')
	ctx.assert('multicolor layer count', duo.layers.length, 2)
	ctx.assert('duo width', duo.width, 48)

	ctx.assert('missing icon has no host', !!ctx.find('nano-missing'), false)

	selection.set({ name: 'dot', color: '#00ff00', size: 40 })
	await ctx.waitFor(() => glyphSnapshot(ctx, 'nano-main').width === 40)
	ctx.assert('updated height', glyphSnapshot(ctx, 'nano-main').height, 40)

	ctx.record('host geometry', ctx.inspect('nano-main'))
	ctx.record('evidence boundary', 'CoreText registration + label stacking + size updates; no glyph pixel claim')
}
