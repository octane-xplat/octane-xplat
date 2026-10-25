// Port of upstream DateInput/DateInputFormats.tsx (Astryx 0.6.4, MIT).
import { DateInput, Stack } from '@octane-xplat/ui'
import { useState } from 'octane'
import type { ISODateString } from '@octane-xplat/ui'

export function DateInputFormats() @{
	const [a, setA] = useState<ISODateString | null>(null)
	const [b, setB] = useState<ISODateString | null>(null)
	const [c, setC] = useState<ISODateString | null>(null)
	const [d, setD] = useState<ISODateString | null>(null)
	const [custom, setCustom] = useState<ISODateString | null>('2025-03-15')
	<Stack direction="vertical" gap={4} style={{width: 400}}>
		<DateInput label="Date (default)" value={a} onChange={setA} format="date" />
		<DateInput label="Date long" value={b} onChange={setB} format="date_long" />
		<DateInput label="Date weekday" value={c} onChange={setC} format="date_weekday" />
		<DateInput label="System date" value={d} onChange={setD} format="system_date" />
		<DateInput label="Custom format" value={custom} onChange={setCustom} format={(iso) => iso ? new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(iso)) : ''} />
	</Stack>
}
