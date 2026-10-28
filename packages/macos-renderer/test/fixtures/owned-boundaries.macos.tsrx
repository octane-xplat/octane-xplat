/** @jsxImportSource @octane-xplat/macos-renderer */
import { createContext, useContext, useEffect, useState } from 'octane'

const Name = createContext('missing')
const Provider: any = Name
const tabRef = { current: null as any }
const listRef = { current: null as any }
let assign: (left: any[], right: any[]) => void
let updateName: (name: string) => void
let replaceItems: () => void
let closeAll: () => void
let tabMounts = 0
let tabMounted = false
const rows = Array.from({ length: 100 }, (_, index) => ({ id: index, text: 'row-' + index }))

function TabContent() {
	const name = useContext(Name)
	useEffect(() => {
		tabMounted = true
		tabMounts++
		return () => {
			tabMounted = false
		}
	}, [])

	return <label id="owned-tab-content" text={name} />
}

function Row(props: { item: { id: number; text: string } }) {
	const name = useContext(Name)
	return <label id={'owned-row-' + props.item.id} text={props.item.text + ': ' + name} />
}

const renderRow = (item: any) => <Row item={item} />

export default function Case() {
	const [name, setName] = useState('Avery')
	const [arrays, setArrays] = useState({ left: [] as any[], right: [] as any[] })
	const [items, setItems] = useState(rows)
	const [open, setOpen] = useState(true)
	assign = (left, right) => setArrays({ left, right })
	updateName = setName
	replaceItems = () => setItems(rows.map((item) => ({ ...item, text: 'updated-' + item.id })))
	closeAll = () => setOpen(false)
	return (
		<Provider value="outside">
			<Provider value={name}>
				{open ? (
					<tabviewitem ref={tabRef} title="Owned">
						<TabContent />
					</tabviewitem>
				) : null}
				<masonview
					style={{
						flexDirection: 'column',
						display: 'flex',
					}}
				>
					{open ? (
						<>
							<tabview
								id="owned-tabs-left"
								items={arrays.left}
								style={{ width: 240, height: 80 }}
							/>
							<tabview
								id="owned-tabs-right"
								items={arrays.right}
								style={{ width: 240, height: 80 }}
							/>
							<listview
								id="owned-list"
								ref={listRef}
								items={items}
								renderItem={renderRow}
								rowHeight={24}
								style={{ width: 240, height: 120 }}
							/>
						</>
					) : null}
				</masonview>
			</Provider>
		</Provider>
	)
}

export async function run(ctx: any) {
	await ctx.waitFor(() => tabRef.current && ctx.find('owned-row-0'))
	ctx.assert('unassigned tab content remains unmounted', tabMounted, false)
	const handle = tabRef.current
	assign([handle], [])
	await ctx.waitFor(() => tabMounted && ctx.find('owned-tab-content'))
	const tab = ctx.find('owned-tab-content')
	ctx.assert('tab uses a portal, not a content root', handle.contentRoot, null)
	ctx.assert('tab inherits the nearest provider', String(tab.stringValue), 'Avery')
	ctx.assert(
		'list inherits the nearest provider',
		String(ctx.find('owned-row-0').stringValue),
		'row-0: Avery',
	)

	updateName('Jordan')
	await ctx.waitFor(
		() =>
			String(tab.stringValue) === 'Jordan' &&
			String(ctx.find('owned-row-0')?.stringValue) === 'row-0: Jordan',
	)

	ctx.assert('tab context updates without remount', tabMounts, 1)
	assign([], [handle])
	await ctx.waitFor(() => Number(ctx.find('owned-tabs-right').numberOfTabViewItems) === 1)
	ctx.assert('tab transfer retains native content', ctx.find('owned-tab-content') === tab, true)
	ctx.assert('tab transfer retains component state', tabMounts, 1)
	const table = listRef.current.documentView
	table.scrollRowToVisible(80)
	await ctx.waitFor(() => ctx.find('owned-row-80'))
	ctx.assert(
		'rebound list cell receives current context',
		String(ctx.find('owned-row-80').stringValue),
		'row-80: Jordan',
	)

	replaceItems()
	await ctx.waitFor(() => String(ctx.find('owned-row-80')?.stringValue) === 'updated-80: Jordan')
	ctx.assert(
		'list data replacement updates the portal',
		String(ctx.find('owned-row-80').stringValue),
		'updated-80: Jordan',
	)

	assign([], [])
	await ctx.waitFor(() => !tabMounted)
	ctx.assert('unassigned tab releases content', ctx.find('owned-tab-content') == null, true)
	assign([handle], [])
	await ctx.waitFor(() => tabMounted)
	ctx.assert('reassigned tab remounts exactly once', tabMounts, 2)
	closeAll()
	await ctx.waitFor(() => !tabMounted && listRef.current == null)
	ctx.assert('owner removal detaches the tab portal', tab.superview == null, true)
	ctx.assert('owner removal releases list portal nodes', ctx.find('owned-row-80') == null, true)
}
