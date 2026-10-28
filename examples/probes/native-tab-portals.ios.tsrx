/** @jsxImportSource @octane-xplat/jsx */
import { UITabBar } from '@octane-xplat/ui/ios'
import { createContext, useContext, useEffect, useState } from 'octane'
import type { ProbeContext } from '../../scripts/probe/context'

type Surface = 'stack' | 'pane'

const NameContext = createContext('missing')
const NameProvider: any = NameContext
const rendered: Record<Surface, string[]> = { stack: [], pane: [] }
const mounted = new Set<Surface>()
let updateName: (value: string) => void
let showStackTab: (value: boolean) => void

function ContextLabel(props: { surface: Surface }) {
	const value = useContext(NameContext)
	rendered[props.surface].push(value)
	useEffect(() => {
		mounted.add(props.surface)
		return () => mounted.delete(props.surface)
	}, [props.surface])

	return <label id={`portal-tab-${props.surface}`} text={`tab-${props.surface}: ${value}`} />
}

function StackTabContent() {
	return <ContextLabel surface="stack" />
}

function PlainTabContent() {
	return <ContextLabel surface="pane" />
}

const plainTabs: any[] = [{ key: 'portal-pane', title: 'Pane', render: PlainTabContent }]
const stackTabs: any[] = [
	{ key: 'portal-stack', title: 'Stack', stack: 'portal-stack', render: StackTabContent },
	{ key: 'portal-pane', title: 'Pane', render: PlainTabContent },
]

export default function NativeTabPortals() {
	const [name, setName] = useState('Avery')
	const [includeStackTab, setIncludeStackTab] = useState(false)
	updateName = setName
	showStackTab = setIncludeStackTab
	const tabs = includeStackTab ? stackTabs : plainTabs
	return (
		<NameProvider value={name}>
			<UITabBar tabs={tabs} selectedIndex={0} />
		</NameProvider>
	)
}

export async function run(ctx: ProbeContext) {
	await ctx.waitFor(() => mounted.has('pane') && rendered.pane.at(-1) === 'Avery', {
		timeout: 12000,
		interval: 25,
	})

	ctx.assert('plain tab portal reads declaring context', rendered.pane.at(-1), 'Avery')

	updateName('Jordan')
	await ctx.waitFor(() => rendered.pane.at(-1) === 'Jordan', { timeout: 5000, interval: 25 })
	ctx.assert('live context update reaches plain tab', rendered.pane.at(-1), 'Jordan')

	showStackTab(true)
	await ctx.waitFor(() => mounted.has('stack') && rendered.stack.at(-1) === 'Jordan', {
		timeout: 8000,
		interval: 25,
	})

	ctx.assert('stack tab portal reads declaring context', rendered.stack.at(-1), 'Jordan')
	ctx.record(
		'portal boundary evidence',
		'iOS UITabBar stack and plain panes inherit provider context',
	)
}
