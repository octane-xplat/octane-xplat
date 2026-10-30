/** @jsxImportSource @octane-xplat/jsx */
import './text-overflow-css.macos.css'
import { useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

const title = 'A complete artificial title that needs several lines in a narrow frame.'
const alignments = ['start', 'end', 'left', 'right', 'center', 'justify', undefined] as const
export default function TextOverflowCssProbe() {
	const [single, setSingle] = useState(true), [ellipsis, setEllipsis] = useState(true)
	const [wide, setWide] = useState(false), [short, setShort] = useState(false), [limit, setLimit] = useState(false)
	const [alignment, setAlignment] = useState(0), [rtl, setRTL] = useState(false)
	const classes = ['text-overflow-sample', single && 'text-overflow-sample--single', ellipsis && 'text-overflow-sample--ellipsis']
	return <VStack gap={2}>
		<Text>Manual AppKit text overflow fixture. Change CSS modes, width, content and the explicit line limit. Native drawing, resize, copying, VoiceOver and installed behavior remain unqualified. Visual comparison requires separate authorization.</Text>
		<masonview id="text-overflow-css-preview" className="text-overflow-frame" style={{ width: wide ? 320 : 160, direction: rtl ? 'rtl' : 'ltr' }}>
			<label className={classes} text={short ? 'Short title' : title} maxLines={limit ? 2 : undefined} style={{ textAlign: alignments[alignment] }} />
			<label className={classes} maxLines={limit ? 2 : undefined} style={{ lineHeight: '24px', textAlign: alignments[alignment] }}>
				<formattedstring><span text={short ? 'Short ' : title} /><span text=" Formatted suffix" style={{ fontWeight: 700 }} /></formattedstring>
			</label>
		</masonview>
		<Button label="Toggle CSS nowrap" clickAction={() => setSingle(!single)} />
		<Button label="Toggle CSS ellipsis" clickAction={() => setEllipsis(!ellipsis)} />
		<Button label="Resize frame" clickAction={() => setWide(!wide)} />
		<Button label="Toggle short title" clickAction={() => setShort(!short)} />
		<Button label="Toggle explicit two-line limit" clickAction={() => setLimit(!limit)} />
		<Button label="Cycle text alignment" clickAction={() => setAlignment((alignment + 1) % alignments.length)} />
		<Button label="Toggle CSS direction" clickAction={() => setRTL(!rtl)} />
		<Text>{`Nowrap ${single}, ellipsis ${ellipsis}, two-line limit ${limit}, wide ${wide}, alignment ${alignments[alignment] ?? 'removed'}, CSS direction ${rtl ? 'rtl' : 'ltr'}. Direction selects label alignment only; bidi shaping, vertical writing and parity remain unqualified.`}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('text-overflow-css-preview'))
	ctx.record('qualification', 'Mounted controls only; no native text measurement, painting, resize/input, accessibility, visual or installed-consumer qualification performed.')
}
