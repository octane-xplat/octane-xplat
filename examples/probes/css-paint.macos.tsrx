/** @jsxImportSource @octane-xplat/jsx */
import './css-paint.macos.css'
import { useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

const backgrounds = [
	'paint-bg-linear', 'paint-bg-radial', 'paint-bg-repeating', 'paint-bg-layers',
	'paint-bg-url', 'paint-bg-positioned', 'paint-bg-shorthand', 'paint-bg-none',
] as const
const outlines = [
	'paint-outline-solid', 'paint-outline-dashed', 'paint-outline-dotted', 'paint-outline-double',
	'paint-outline-groove', 'paint-outline-ridge', 'paint-outline-none',
] as const
const shadows = [
	'paint-shadow-single', 'paint-shadow-multi', 'paint-shadow-inset', 'paint-shadow-inset-multi',
	'paint-shadow-mixed', 'paint-shadow-spread', 'paint-shadow-none',
] as const

export default function CssPaintProbe() {
	const [bg, setBg] = useState(0), [outline, setOutline] = useState(0), [shadow, setShadow] = useState(0)
	return <VStack gap={2}>
		<Text>Manual AppKit paint fixture: cycle layered backgrounds (linear/radial/repeating gradients, url() tiles, origin/clip boxes), non-solid outlines, and multi/inset box-shadows — the last two also exercise corner-radius clipping. The runner records mounting only. Native layer structure, drawing pixels, shadow bleed, clip interaction, image decode, scale, input, disposal and installed-consumer behavior remain unqualified. Visual comparison requires its own authorization.</Text>
		<masonview id="paint-sample" className={`paint-sample ${backgrounds[bg]} ${outlines[outline]} ${shadows[shadow]}`}>
			<label text="paint sample" />
		</masonview>
		<Button label="Next background" clickAction={() => setBg((bg + 1) % backgrounds.length)} />
		<Button label="Next outline" clickAction={() => setOutline((outline + 1) % outlines.length)} />
		<Button label="Next shadow" clickAction={() => setShadow((shadow + 1) % shadows.length)} />
		<Text>{`bg ${backgrounds[bg]} | outline ${outlines[outline]} | shadow ${shadows[shadow]}`}</Text>
	</VStack>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('paint-sample'))
	const sample = () => ctx.find('paint-sample')
	const layerOf = () => sample().layer
	const children = (layer: any) => {
		const out: any[] = []
		const subs = layer?.sublayers
		for (let i = 0; i < (subs?.count ?? subs?.length ?? 0); i++) out.push(subs[i] ?? subs.objectAtIndex?.(i))
		return out
	}
	// Layered backgrounds: bgHost sits at index 0 with one child per CSS layer.
	sample().className = 'paint-sample paint-bg-layers paint-outline-none paint-shadow-none'
	await ctx.waitFor(() => {
		const host = children(layerOf())[0]
		return host && children(host).length === 3
	})
	const bgHost = children(layerOf())[0]
	const bgKids = children(bgHost)
	ctx.assert('bg host holds one child per comma layer', bgKids.length, 3)
	ctx.assert('first CSS layer paints topmost', Number(bgKids[0].zPosition) > Number(bgKids[2].zPosition), true)
	ctx.assert('url() layer carried a rendered CGImage', bgKids[1].contents != null, true)

	// Non-solid outline: dashed strokes a centered path with a dash pattern.
	sample().className = 'paint-sample paint-bg-none paint-outline-dashed paint-shadow-none'
	await ctx.waitFor(() => children(layerOf()).some((l) => l.lineDashPattern != null))
	const outline = children(layerOf()).find((l) => l.lineDashPattern != null)
	ctx.assert('dashed outline installs a dashed stroke', outline?.lineWidth > 0, true)

	// Multi outset shadows: sibling hosts below view.layer keep the corner clip.
	sample().className = 'paint-sample paint-bg-none paint-outline-none paint-shadow-multi'
	await ctx.waitFor(() => {
		const below = children(layerOf().superlayer).filter((l) => l.shadowColor != null)
		return below.length >= 3
	})
	const below = children(layerOf().superlayer).filter((l) => l.shadowColor != null)
	ctx.assert('three outset shadows paint three sibling hosts', below.length, 3)
	ctx.assert('masksToBounds stays on with sibling shadows', layerOf().masksToBounds, true)

	// Inset shadow: wall/hole shape inside the layer carries its own shadow.
	sample().className = 'paint-sample paint-bg-none paint-outline-none paint-shadow-inset'
	await ctx.waitFor(() => children(layerOf()).some((l) => children(l).some((c) => c.shadowColor != null)))
	const insetHost = children(layerOf()).find((l) => children(l).some((c) => c.shadowColor != null))
	const wall = children(insetHost).find((c) => c.shadowColor != null)
	ctx.assert('inset wall carries real blur', Number(wall.shadowRadius) > 0, true)
	ctx.assert('inset wall clips to the interior', wall.masksToBounds, true)
	ctx.record('qualification', 'Native layer structure asserted on the AppKit host (sublayer counts, z-order, dash patterns, sibling shadow hosts, inset wall/hole); drawing pixels, input, scale and installed-consumer behavior remain unqualified.')
}
