/** @jsxImportSource @octane-xplat/jsx */
import './text-overflow-css.macos.css'
import { useState } from 'octane'
import { Button, Text, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'

const title = 'A complete artificial title that needs several lines in a narrow frame.'
export default function TextOverflowCssProbe() {
	const [single, setSingle] = useState(true), [ellipsis, setEllipsis] = useState(true)
	const [wide, setWide] = useState(false), [short, setShort] = useState(false), [limit, setLimit] = useState(false)
	const classes = ['text-overflow-sample', single && 'text-overflow-sample--single', ellipsis && 'text-overflow-sample--ellipsis']
	return <VStack gap={2}>
		<Text>Manual AppKit text overflow fixture. Change CSS modes, width, content and the explicit line limit. Native drawing, resize, copying, VoiceOver and installed behavior remain unqualified. Visual comparison requires separate authorization.</Text>
		<masonview id="text-overflow-css-preview" className="text-overflow-frame" style={{ width: wide ? 320 : 160 }}>
			<label className={classes} text={short ? 'Short title' : title} maxLines={limit ? 2 : undefined} />
			<label className={classes} maxLines={limit ? 2 : undefined} style={{ lineHeight: 24 }}>
				<formattedstring><span text={short ? 'Short ' : title} /><span text=" Formatted suffix" style={{ fontWeight: 700 }} /></formattedstring>
			</label>
		</masonview>
		<Button label="Toggle CSS nowrap" clickAction={() => setSingle(!single)} />
		<Button label="Toggle CSS ellipsis" clickAction={() => setEllipsis(!ellipsis)} />
		<Button label="Resize frame" clickAction={() => setWide(!wide)} />
		<Button label="Toggle short title" clickAction={() => setShort(!short)} />
		<Button label="Toggle explicit two-line limit" clickAction={() => setLimit(!limit)} />
		<Text>{`Nowrap ${single}, ellipsis ${ellipsis}, two-line limit ${limit}, wide ${wide}`}</Text>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('text-overflow-css-preview'))
	ctx.record('qualification', 'Mounted controls only; no native text measurement, painting, resize/input, accessibility, visual or installed-consumer qualification performed.')
}
