/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Button, Heading, RichText, RichTextSpan, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function TextStylesProbe() {
	const [large, setLarge] = useState(false), [css, setCSS] = useState(false), [styled, setStyled] = useState(true)
	const fontSize = large ? 28 : 18, style = !styled ? undefined : css ? `font-size:${fontSize}px;letter-spacing:1px` : { fontSize, letterSpacing: 1 }
	return <VStack gap={2}>
		<Heading id="styled-heading" level={2} maxLines={1} style={style}>AppKit heading</Heading>
		<Text id="styled-text" type="body" style={style}>Text with authored typography</Text>
		<RichText id="styled-rich" style={style}><RichTextSpan style={styled ? 'font-weight:600;letter-spacing:2px' : undefined}>Rich span</RichTextSpan></RichText>
		<Button label="Toggle text size" clickAction={() => setLarge((current) => !current)} />
		<Button label="Toggle declaration string" clickAction={() => setCSS((current) => !current)} />
		<Button label="Remove or restore style" clickAction={() => setStyled((current) => !current)} />
		<Text>Manual style/removal fixture. Mounting does not qualify native glyphs, layout, heading levels or VoiceOver.</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('styled-heading') && ctx.find('styled-text'))
	ctx.record('qualification', 'Text style controls mounted; native presentation unqualified')
}
