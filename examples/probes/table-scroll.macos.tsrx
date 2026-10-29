/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, InternationalizationProvider, Table, Text, TextInput, VStack, pixel, proportional, useTableColumnResize, useTableStickyColumns } from '@octane-xplat/ui'
import type { TableColumn, TablePlugin, UseTableColumnResizeConfig } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
type Person = { name: string; team: string; location: string; status: string }
const rows: Person[] = [
	{ name: 'Ada', team: 'Platform', location: 'London', status: 'Active' },
	{ name: 'Grace', team: 'Product', location: 'New York', status: 'Away' },
]
function StickyTable(props: { data: Person[]; columns: TableColumn<Person>[]; plugins: Record<string, TablePlugin<Person>>; pinned: boolean; multiple: boolean; resizeConfig: UseTableColumnResizeConfig }) @{
	const resize = useTableColumnResize<Person>(props.resizeConfig)
	const sticky = useTableStickyColumns<Person>({ startKeys: props.pinned ? [props.multiple ? 'team' : 'name'] : [], endKeys: props.pinned ? ['status'] : [] })
	<Table id="table-scroll-preview" data={props.data} columns={props.columns} plugins={{ ...props.plugins, columnResize: resize, sticky }} />
}
export default function TableScrollProbe() @{
	const [wide, setWide] = useState(false), [empty, setEmpty] = useState(false), [bounded, setBounded] = useState(false), [metrics, setMetrics] = useState('Not measured')
	const [pinned, setPinned] = useState(true), [multiple, setMultiple] = useState(false), [rtl, setRTL] = useState(false)
	const [action, setAction] = useState('None'), [notes, setNotes] = useState<Record<string, string>>({})
	const [widths, setWidths] = useState<Record<string, number>>({}), [accept, setAccept] = useState(true), [uncontrolled, setUncontrolled] = useState(false), [locked, setLocked] = useState(false), [commits, setCommits] = useState(0)
	const resizeConfig: UseTableColumnResizeConfig = { ...(uncontrolled ? {} : { columnWidths: widths }), minWidth: 80, maxWidth: 520, onColumnResizeEnd: (next) => { setCommits((n) => n + 1); if (accept && !uncontrolled) setWidths(next) } }
	const viewport = useRef<NSScrollView | null>(null)
	const columns: TableColumn<Person>[] = [
		{ key: 'name', header: 'Name', width: pixel(180), resizable: !locked, renderCell: (person) => <Button label={`Open ${person.name}`} clickAction={() => setAction(person.name)} /> },
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
		<Button label="Toggle controlled column widths" clickAction={() => setWidths(widths.name === 320 ? {} : { name: 320, team: 420 })} />
		<Button label="Toggle accepting resize commits" clickAction={() => setAccept(!accept)} />
		<Button label="Toggle uncontrolled resize" clickAction={() => setUncontrolled(!uncontrolled)} />
		<Button label="Toggle name-column resize lock" clickAction={() => setLocked(!locked)} />
		<Text>Resize commits: {commits}; mode: {uncontrolled ? 'uncontrolled' : 'controlled'}; accepting: {String(accept)}</Text>
		<Button label="Toggle sticky columns" clickAction={() => setPinned(!pinned)} />
		<Button label="Toggle multiple pinned columns" clickAction={() => setMultiple(!multiple)} />
		<Button label="Toggle RTL" clickAction={() => setRTL(!rtl)} />
		<Text>Last pinned action: {action}</Text>
		<Button label="Read native metrics" clickAction={measure} />
		<Text>{metrics}</Text>
		<VStack style={{ width: wide ? 960 : 360, maxWidth: '100%' }}>
			<StickyTable data={empty ? [] : rows} columns={columns} plugins={{ wrapper }} pinned={pinned} multiple={multiple} resizeConfig={resizeConfig} />
		</VStack>
	</VStack></InternationalizationProvider>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('table-scroll-controls'))
	ctx.record('qualification', 'Controls mounted only; native dimensions, scroll input and table semantics remain unqualified')
}
