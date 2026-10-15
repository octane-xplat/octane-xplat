/** @jsxImportSource @nativescript-community/octane */
import { Pager } from '@octane-xplat/pager'
import { createContext, useContext, useEffect, useState } from 'octane'
import type { ProbeContext } from '../../scripts/probe/context'

type Surface = 'first' | 'second'

const NameContext = createContext('missing')
const NameProvider: any = NameContext
const rendered: Record<Surface, string[]> = { first: [], second: [] }
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
	return <label id={`portal-page-${props.surface}`} text={`page-${props.surface}: ${value}`} />
}

function renderPage(_item: string, index: number) {
	return <ContextLabel surface={index === 0 ? 'first' : 'second'} />
}

const pages = ['first', 'second']

export default function NativePagerPortals() {
	const [name, setName] = useState('Avery')
	const [page, setCurrentPage] = useState(0)
	updateName = setName
	setPage = setCurrentPage
	return <NameProvider value={name}><Pager items={pages} renderItem={renderPage} page={page} onPageChange={setCurrentPage} /></NameProvider>
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(
		() => mounted.has('first') && rendered.first.at(-1) === 'Avery',
		{ timeout: 12000, interval: 25 },
	)
	ctx.assert('initial pager cell reads declaring context', rendered.first.at(-1), 'Avery')

	updateName('Jordan')
	await ctx.waitFor(
		() => rendered.first.at(-1) === 'Jordan',
		{ timeout: 5000, interval: 25 },
	)
	ctx.assert('live context update reaches current pager cell', rendered.first.at(-1), 'Jordan')

	setPage(1)
	await ctx.waitFor(
		() => mounted.has('second') && rendered.second.at(-1) === 'Jordan',
		{ timeout: 8000, interval: 25 },
	)
	ctx.assert('recycled pager cell reads the current declaring context', rendered.second.at(-1), 'Jordan')
	ctx.record('portal boundary evidence', 'iOS recycled Pager cells inherit provider context')
}
