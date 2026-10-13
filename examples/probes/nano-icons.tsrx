import { VStack, createStore, useStore } from '@octane-xplat/ui'
import { NanoIcon } from '@octane-xplat/nano-icons'
import type { ProbeContext } from '../../scripts/probe/context'
import { XplatProbeIcons, glyphMap } from './nano-icons-font/XplatProbe'
import { glyphSnapshot, fontReady } from './nano-icons-host'

const selection = createStore({ name: 'dot', color: '#123456', size: 24 })

export default function NanoIconsProbe() {
	const current = useStore(selection)
	return <VStack>
		<NanoIcon id="nano-main" {...current} label="Direction" />
		<XplatProbeIcons.Icon id="nano-duo" name="bell" size={48} />
		<NanoIcon id="nano-tint" name="frame" color="#aa0000" size={24} />
		<NanoIcon id="nano-palette" name="bell" color={['#ff0000', '#00ff00']} tintMode="all" />
		<NanoIcon id="nano-missing" name="nope" />
	</VStack>
}

export async function run(ctx: ProbeContext) {
	// The set registered its font on creation; wait for the platform loader.
	await XplatProbeIcons.ready
	const ready = await fontReady(glyphMap.m.f)
	ctx.assert('icon font registered', ready, 'ready')

	// Glyph layers render as text in the generated family — private-use
	// codepoints are inert to accessibility (container carries the label).
	const main = glyphSnapshot(ctx.find('nano-main'))
	ctx.assert('glyph container width', main.width, 24)
	ctx.assert('glyph container height', main.height, 24)
	ctx.assert('accessible label', main.label, 'Direction')
	ctx.assert('layer count (single-color icon)', main.layers.length, 1)
	ctx.assert('layer codepoint', main.layers[0]?.codePoint, glyphMap.i.dot[1][0][0])
	ctx.assert('layer family', main.layers[0]?.fontFamily, glyphMap.m.f)
	ctx.assert('layer tint', main.layers[0]?.color, 'rgb(18, 52, 86)')

	const duo = glyphSnapshot(ctx.find('nano-duo'))
	ctx.assert('multicolor layer count', duo.layers.length, 2)
	ctx.assert('duo layer 0 keeps source color', duo.layers[0]?.color, 'rgb(245, 158, 11)')
	ctx.assert('duo layer 1 keeps source color', duo.layers[1]?.color, 'rgb(29, 78, 216)')
	ctx.assert('duo width', duo.width, 48)

	const tint = glyphSnapshot(ctx.find('nano-tint'))
	ctx.assert('currentColor layer tints', tint.layers[0]?.color, 'rgb(170, 0, 0)')

	const palette = glyphSnapshot(ctx.find('nano-palette'))
	ctx.assert('palette layer 0', palette.layers[0]?.color, 'rgb(255, 0, 0)')
	ctx.assert('palette layer 1', palette.layers[1]?.color, 'rgb(0, 255, 0)')

	ctx.assert('missing icon has no host', !!ctx.find('nano-missing'), false)

	// Prop updates re-resolve color/size without rebuilding the font.
	selection.set({ name: 'dot', color: '#00ff00', size: 40 })
	await ctx.waitFor(() => glyphSnapshot(ctx.find('nano-main')).layers[0]?.color === 'rgb(0, 255, 0)')
	ctx.assert('updated width', glyphSnapshot(ctx.find('nano-main')).width, 40)
	ctx.assert('updated height', glyphSnapshot(ctx.find('nano-main')).height, 40)

	ctx.record('host geometry', ctx.inspect('nano-main'))
	ctx.record('evidence boundary', 'font registration + label/span structure + tint resolution; no glyph pixel or raster claim')
}
