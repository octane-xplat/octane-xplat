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
	ctx.record('qualification', 'Mounted controls only; no native layer, drawing/pixel, shadow, clip, image-decode, input, scale, disposal or installed-consumer qualification performed.')
}
