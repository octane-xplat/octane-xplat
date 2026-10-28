/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import { Pager } from '@octane-xplat/pager'
import { Button, InternationalizationProvider, Text, TextInput, VStack } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
export default function PagerProbe() {
	const [page, setPage] = useState(1), [rtl, setRTL] = useState(false), [empty, setEmpty] = useState(false), [accept, setAccept] = useState(true), [last, setLast] = useState('none')
	const items = empty ? [] : ['Pack', 'Travel', 'Arrive']
	return <InternationalizationProvider locale="en" dir={rtl ? 'rtl' : 'ltr'}><VStack gap={2}>
		<Text>Use trackpad and legacy wheel; stop between page boundaries. Compare native momentum, resize, RTL, reduced motion, nested text input and empty/refill. The runner mounts only; it does not verify input, geometry or accessibility.</Text>
		<Pager id="pager-preview" items={items} page={page} onPageChange={(next) => { setLast(String(next)); if (accept) setPage(next) }} accessibilityLabel="Travel steps" style={{ width: 320, height: 160 }}
			renderItem={(title) => <VStack><Text>{title}</Text><TextInput placeholder={`Notes for ${title}`} /></VStack>} renderEmpty={() => <Text>No steps</Text>} />
		<Text>Parent page: {page}; last user request: {last}</Text>
		<Button label="Previous" clickAction={() => setPage(Math.max(0, page - 1))} /><Button label="Next" clickAction={() => setPage(Math.min(2, page + 1))} />
		<Button label="Toggle RTL" clickAction={() => setRTL(!rtl)} /><Button label="Toggle empty" clickAction={() => setEmpty(!empty)} /><Button label="Toggle accepting user changes" clickAction={() => setAccept(!accept)} />
		<Pager items={['Uncontrolled first', 'Uncontrolled second']} defaultPage={1} style={{ width: 320, height: 90 }} renderItem={(title) => <Text>{title}</Text>} />
	</VStack></InternationalizationProvider>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('pager-preview'))
	ctx.record('qualification', 'fixture mounted only; native sizing/RTL/live-scroll/momentum/settlement/input/focus/AX and packaging remain unqualified')
}
