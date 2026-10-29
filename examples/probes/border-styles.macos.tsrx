/** @jsxImportSource @octane-xplat/jsx */
import './border-styles.macos.css'
import { useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

const styles = ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'none', 'hidden', undefined] as const
export default function BorderStylesProbe() {
	const [index, setIndex] = useState(1), [width, setWidth] = useState(2), [radius, setRadius] = useState(8)
	const [mixed, setMixed] = useState(false), [wide, setWide] = useState(false)
	return <VStack gap={2}>
		<Text>Manual AppKit border fixture: cycle styles, widths, corners, mixed sides and resize. The runner records mounting only. Double needs width 3 or more. Native NSNumber dash bridging, band shading, drawing, antialiasing, scale, clipping/shadows, hit-testing and disposal remain unqualified. Visual comparison requires its own authorization.</Text>
		<masonview id="border-style-preview" className="border-style-preview" style={{
			width: wide ? 280 : 150, borderWidth: width, borderRadius: radius, borderStyle: styles[index],
			borderRightWidth: mixed ? width * 2 : undefined,
			borderRightStyle: mixed ? 'dotted' : undefined,
			borderBottomStyle: mixed ? 'solid' : undefined,
			borderRightColor: mixed ? '#b3261e' : undefined,
		}}><label text="Artificial border sample" /></masonview>
		<Button label="Next style" clickAction={() => setIndex((index + 1) % styles.length)} />
		<Button label="Next width" clickAction={() => setWidth(width === 4 ? 1 : width + 1)} />
		<Button label="Next radius" clickAction={() => setRadius(radius === 24 ? 0 : radius + 8)} />
		<Button label="Toggle mixed sides" clickAction={() => setMixed(!mixed)} />
		<Button label="Resize preview" clickAction={() => setWide(!wide)} />
		<Text>{`Style ${styles[index] ?? 'removed (native width-only solid)'}, width ${width}, radius ${radius}, mixed ${mixed}`}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('border-style-preview'))
	ctx.record('qualification', 'Mounted controls only; no native layer, drawing/pixel, input, scale, disposal or installed-consumer qualification performed.')
}
