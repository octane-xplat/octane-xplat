/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, InternationalizationProvider, Table, Text, TextInput, VStack, pixel, proportional, useTableColumnResize, useTableStickyColumns } from '@octane-xplat/ui'
import type { TableColumn, TablePlugin } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
type Person = { name: string; team: string; location: string; status: string }
const rows: Person[] = [
	{ name: 'Ada', team: 'Platform', location: 'London', status: 'Active' },
	{ name: 'Grace', team: 'Product', location: 'New York', status: 'Away' },
]
function StickyTable(props: { data: Person[]; columns: TableColumn<Person>[]; plugins: Record<string, TablePlugin<Person>>; pinned: boolean; multiple: boolean }) @{
	const sticky = useTableStickyColumns<Person>({ startKeys: props.pinned ? [props.multiple ? 'team' : 'name'] : [], endKeys: props.pinned ? ['status'] : [] })
	<Table id="table-scroll-preview" data={props.data} columns={props.columns} plugins={{ ...props.plugins, sticky }} />
}
export default function TableScrollProbe() @{
	const [wide, setWide] = useState(false), [empty, setEmpty] = useState(false), [bounded, setBounded] = useState(false), [metrics, setMetrics] = useState('Not measured')
	const [overridden, setOverridden] = useState(false), [pinned, setPinned] = useState(true), [multiple, setMultiple] = useState(false), [rtl, setRTL] = useState(false)
	const [action, setAction] = useState('None'), [notes, setNotes] = useState<Record<string, string>>({})
	const resize = useTableColumnResize<Person>({ columnWidths: overridden ? { name: 320, team: 420 } : {} })
	const viewport = useRef<NSScrollView | null>(null)
	const columns: TableColumn<Person>[] = [
		{ key: 'name', header: 'Name', width: pixel(180), resizable: false, renderCell: (person) => <Button label={`Open ${person.name}`} clickAction={() => setAction(person.name)} /> },
		{ key: 'team', header: 'Team', width: proportional(2, { minWidth: 240 }) },
		{ key: 'location', header: 'Location', width: proportional(1, { minWidth: 140 }) },
		{ key: 'status', header: 'Status', width: pixel(140), renderCell: (person) => <TextInput label={`Note for ${person.name}`} value={notes[person.name] ?? person.status} onChange={(text) => setNotes((previous) => ({ ...previous, [person.name]: text }))} /> },
	]
	const wrapper: TablePlugin<Person> = {
		transformScrollWrapper: (props) => ({ ...props, htmlProps: { ...props.htmlProps, style: bounded ? { height: 240 } : {}, ref: (view: NSScrollView | null) => { viewport.current = view } }, beforeTable: <Text>Before table</Text>, afterTable: <Text>After table</Text> }),
	}
	const measure = () => {
		const view = viewport.current
		setMetrics(view ? JSON.stringify({ viewport: view.contentView.bounds, document: view.documentView?.frame }) : 'No native viewport')
	}
	<InternationalizationProvider locale="en" dir={rtl ? 'rtl' : 'ltr'}><VStack id="table-scroll-controls" gap={2}>
		<Text>Check narrow/wide pixel and proportional columns, auto/bounded height, header/body alignment and controlled width updates/removal, native horizontal input, plugin slots/ref, empty/refill, resize, nested vertical scrolling and RTL separately. Check sticky start/end, actual expanded widths, oversized overlapping runs, pinned button/field hit-testing, focus, disable/removal and cleanup separately.</Text>
		<Button label="Toggle viewport width" clickAction={() => setWide(!wide)} />
		<Button label="Toggle empty data" clickAction={() => setEmpty(!empty)} />
		<Button label="Toggle bounded height" clickAction={() => setBounded(!bounded)} />
		<Button label="Toggle controlled column widths" clickAction={() => setOverridden(!overridden)} />
		<Button label="Toggle sticky columns" clickAction={() => setPinned(!pinned)} />
		<Button label="Toggle multiple pinned columns" clickAction={() => setMultiple(!multiple)} />
		<Button label="Toggle RTL" clickAction={() => setRTL(!rtl)} />
		<Text>Last pinned action: {action}</Text>
		<Button label="Read native metrics" clickAction={measure} />
		<Text>{metrics}</Text>
		<VStack style={{ width: wide ? 960 : 360, maxWidth: '100%' }}>
			<StickyTable data={empty ? [] : rows} columns={columns} plugins={{ wrapper, columnResize: resize }} pinned={pinned} multiple={multiple} />
		</VStack>
	</VStack></InternationalizationProvider>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('table-scroll-controls'))
	ctx.record('qualification', 'Controls mounted only; native dimensions, scroll input and table semantics remain unqualified')
}
