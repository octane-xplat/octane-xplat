/** @jsxImportSource @octane-xplat/jsx */
import { useRef, useState } from 'octane'
import { Button, Table, Text, VStack, pixel, proportional } from '@octane-xplat/ui'
import type { TableColumn, TablePlugin } from '@octane-xplat/ui'
import type { ProbeContext } from '../../scripts/probe/context'
type Person = { name: string; team: string; location: string; status: string }
const rows: Person[] = [
	{ name: 'Ada', team: 'Platform', location: 'London', status: 'Active' },
	{ name: 'Grace', team: 'Product', location: 'New York', status: 'Away' },
]
export default function TableScrollProbe() @{
	const [wide, setWide] = useState(false), [empty, setEmpty] = useState(false), [bounded, setBounded] = useState(false), [metrics, setMetrics] = useState('Not measured')
	const viewport = useRef<NSScrollView | null>(null)
	const columns: TableColumn<Person>[] = [
		{ key: 'name', header: 'Name', width: pixel(180) },
		{ key: 'team', header: 'Team', width: proportional(2, { minWidth: 240 }) },
		{ key: 'location', header: 'Location', width: proportional(1, { minWidth: 140 }) },
		{ key: 'status', header: 'Status', width: pixel(140) },
	]
	const wrapper: TablePlugin<Person> = {
		transformScrollWrapper: (props) => ({ ...props, htmlProps: { ...props.htmlProps, style: bounded ? { height: 240 } : {}, ref: (view: NSScrollView | null) => { viewport.current = view } }, beforeTable: <Text>Before table</Text>, afterTable: <Text>After table</Text> }),
	}
	const measure = () => {
		const view = viewport.current
		setMetrics(view ? JSON.stringify({ viewport: view.contentView.bounds, document: view.documentView?.frame }) : 'No native viewport')
	}
	<VStack id="table-scroll-controls" gap={2}>
		<Text>Check narrow/wide pixel and proportional columns, auto/bounded height, header/body alignment, native horizontal input, plugin slots/ref, empty/refill, resize, nested vertical scrolling and RTL separately. Sticky columns are still unimplemented.</Text>
		<Button label="Toggle viewport width" clickAction={() => setWide(!wide)} />
		<Button label="Toggle empty data" clickAction={() => setEmpty(!empty)} />
		<Button label="Toggle bounded height" clickAction={() => setBounded(!bounded)} />
		<Button label="Read native metrics" clickAction={measure} />
		<Text>{metrics}</Text>
		<VStack style={{ width: wide ? 960 : 360, maxWidth: '100%' }}>
			<Table id="table-scroll-preview" data={empty ? [] : rows} columns={columns} plugins={{ wrapper }} />
		</VStack>
	</VStack>
}
export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => ctx.find('table-scroll-controls'))
	ctx.record('qualification', 'Controls mounted only; native dimensions, scroll input and table semantics remain unqualified')
}
