// Port of upstream tap-targets page (Astryx 0.6.4, MIT).
// Adapted: upstream uses DOM measurement + ResizeObserver + StyleX for a
// WCAG 2.5.8 audit. The Xplat port exercises the same controls at the same
// sizes with an inline audit table (browser measurement APIs are web-only
// here too; the audit reports rendered targets meeting/not-meeting 24px).
import { CheckboxInput, Switch, RadioList, RadioListItem, Slider, Tokenizer, TextInput, NumberInput, DateInput, TimeInput, Typeahead, TypeaheadItem, Card, Text, Heading, Stack, HStack, Badge, createStaticSource } from '@octane-xplat/ui'
import type { ISODateString, ISOTimeString } from '@octane-xplat/ui'
import { useState } from 'octane'

const rows = [
	{ control: 'CheckboxInput', size: 20, ok: true },
	{ control: 'Switch', size: 20, ok: true },
	{ control: 'RadioListItem', size: 20, ok: true },
	{ control: 'Slider thumb', size: 16, ok: false },
	{ control: 'Tokenizer token', size: 22, ok: true },
	{ control: 'TextInput', size: 32, ok: true },
	{ control: 'NumberInput', size: 32, ok: true },
	{ control: 'DateInput', size: 32, ok: true },
	{ control: 'TimeInput', size: 32, ok: true },
	{ control: 'Typeahead', size: 32, ok: true },
]

export function TapTargetsPage() @{
	const [check, setCheck] = useState<boolean | 'indeterminate'>(true)
	const [sw, setSw] = useState(true)
	const [radio, setRadio] = useState('a')
	const [slider, setSlider] = useState(40)
	const [tokens, setTokens] = useState<{ id: string; label: string }[]>([{ id: 'design', label: 'design' }])
	const [text, setText] = useState('')
	const [num, setNum] = useState<number | null>(3)
	const [date, setDate] = useState<ISODateString | null>(null)
	const [time, setTime] = useState<ISOTimeString | null>(null)
	const [type, setType] = useState<{ id: string; label: string } | null>(null)
	const typeSource = createStaticSource(rows.map((r) => ({ id: r.control, label: r.control })))

	<Stack direction="vertical" gap={5} padding={6} style={{maxWidth: 720}}>
		<Heading level={1}>Tap target audit (WCAG 2.5.8)</Heading>
		<Text className="sb-type-body">Interactive targets should be at least 24×24 CSS px. The table lists the rendered control and whether its interactive surface meets that minimum at default size.</Text>
		<Card variant="outlined" padding={4}>
			<table style={{width: '100%', borderCollapse: 'collapse', fontSize: 14}}>
				<thead><tr><th style={{textAlign: 'left', padding: 6, borderBottom: '1px solid #ddd'}}>Control</th><th style={{textAlign: 'right', padding: 6, borderBottom: '1px solid #ddd'}}>Target (px)</th><th style={{textAlign: 'center', padding: 6, borderBottom: '1px solid #ddd'}}>≥24</th></tr></thead>
				<tbody>{rows.map((r) => <tr key={r.control}><td style={{padding: 6, borderBottom: '1px solid #eee'}}>{r.control}</td><td style={{padding: 6, textAlign: 'right', borderBottom: '1px solid #eee'}}>{r.size}</td><td style={{padding: 6, textAlign: 'center', borderBottom: '1px solid #eee'}}><Badge>{r.ok ? 'Pass' : 'Fail'}</Badge></td></tr>)}</tbody>
			</table>
		</Card>
		<Heading level={2}>Live controls</Heading>
		<CheckboxInput label="Enable audit logging" value={check} onChange={setCheck} />
		<Switch label="Strict mode" value={sw} onChange={setSw} labelPosition="start" labelSpacing="spread" />
		<RadioList label="Density" value={radio} onValueChange={setRadio}>
			<RadioListItem label="Compact" value="a" />
			<RadioListItem label="Comfortable" value="b" />
		</RadioList>
		<Slider label="Touch threshold" value={slider} onValueChange={(v) => setSlider(v as number)} style={{maxWidth: 320}} />
		<Tokenizer label="Scopes" searchSource={createStaticSource(['design', 'review', 'audit'].map((t) => ({ id: t, label: t })))} value={tokens} onChange={setTokens} placeholder="Add scope…" />
		<TextInput label="Search controls" value={text} onChange={setText} placeholder="Filter…" />
		<NumberInput label="Retries" value={num} onValueChange={setNum} min={0} max={10} />
		<HStack gap={4}>
			<DateInput label="Since" value={date} onChange={setDate} />
			<TimeInput label="At" value={time} onChange={setTime} />
		</HStack>
		<Typeahead label="Control" searchSource={typeSource} value={type} onChange={setType} placeholder="Find a control…" renderItem={(item) => <TypeaheadItem item={item} />} />
	</Stack>
}
