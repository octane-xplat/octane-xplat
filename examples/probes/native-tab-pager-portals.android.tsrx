/** @jsxImportSource @octane-xplat/jsx */
import { BottomNavigationView } from '@octane-xplat/ui/android'
import { Pager } from '@octane-xplat/pager'
import { createContext, useContext, useEffect, useState } from 'octane'
import type { ProbeContext } from '../../scripts/probe/context'

type Surface = 'tab-stack' | 'tab-pane' | 'pager-first' | 'pager-second'

const NameContext = createContext('missing')
const NameProvider: any = NameContext
const rendered: Record<Surface, string[]> = {
	'tab-stack': [],
	'tab-pane': [],
	'pager-first': [],
	'pager-second': [],
}

const mounted = new Set<Surface>()
let updateName: (value: string) => void
let setPage: (value: number) => void

function ContextLabel(props: { surface: Surface }) {
	const value = useContext(NameContext)
	rendered[props.surface].push(value)
	useEffect(() => {
		mounted.add(props.surface)
		return () => mounted.delete(props.surface)
	}, [props.surface])

	return <label id={`portal-${props.surface}`} text={`${props.surface}: ${value}`} />
}

function StackTabContent() {
	return <ContextLabel surface="tab-stack" />
}

function PlainTabContent() {
	return <ContextLabel surface="tab-pane" />
}

function renderPage(_item: string, index: number) {
	return <ContextLabel surface={index === 0 ? 'pager-first' : 'pager-second'} />
}

const tabs: any[] = [
	{ key: 'portal-stack', title: 'Stack', stack: 'portal-stack', render: StackTabContent },
	{ key: 'portal-pane', title: 'Pane', render: PlainTabContent },
]

const pages = ['first', 'second']

export default function NativeTabPagerPortals() {
	const [name, setName] = useState('Avery')
	const [page, setCurrentPage] = useState(0)
	updateName = setName
	setPage = setCurrentPage
	return (
		<NameProvider value={name}>
			<>
				<BottomNavigationView tabs={tabs} selectedIndex={0} />
				<Pager items={pages} renderItem={renderPage} page={page} onPageChange={setCurrentPage} />
			</>
		</NameProvider>
	)
}

export async function run(ctx: ProbeContext) {
	const initial = ['tab-stack', 'tab-pane', 'pager-first'] as const
	await ctx.waitFor(
		() => initial.every((surface) => mounted.has(surface) && rendered[surface].at(-1) === 'Avery'),
		{ timeout: 12000, interval: 25 },
	)

	ctx.assert('stack tab portal reads declaring context', rendered['tab-stack'].at(-1), 'Avery')
	ctx.assert('plain tab portal reads declaring context', rendered['tab-pane'].at(-1), 'Avery')
	ctx.assert('initial pager cell reads declaring context', rendered['pager-first'].at(-1), 'Avery')

	updateName('Jordan')
	await ctx.waitFor(() => initial.every((surface) => rendered[surface].at(-1) === 'Jordan'), {
		timeout: 5000,
		interval: 25,
	})

	ctx.assert('live update reaches stack tab', rendered['tab-stack'].at(-1), 'Jordan')
	ctx.assert('live update reaches plain tab', rendered['tab-pane'].at(-1), 'Jordan')
	ctx.assert('live update reaches current pager cell', rendered['pager-first'].at(-1), 'Jordan')

	setPage(1)
	await ctx.waitFor(
		() => mounted.has('pager-second') && rendered['pager-second'].at(-1) === 'Jordan',
		{ timeout: 8000, interval: 25 },
	)

	ctx.assert('new pager cell reads declaring context', rendered['pager-second'].at(-1), 'Jordan')
	ctx.record(
		'portal boundary evidence',
		'Android tab panes and recycled Pager cells inherit provider context',
	)
}
