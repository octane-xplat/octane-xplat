/** @jsxImportSource @nativescript-community/octane */
import { createContext, useContext, useEffect, useState } from 'octane'
import { RouteOutlet, Screen, defineRoutes, popRoute, pushRoute, registerRoutes, useImperativeBottomSheet } from '@octane-xplat/ui'
import { UITabBar } from '@octane-xplat/ui/ios'
import { useNativeRouteNavigator } from '@octane-xplat/ui/nativescript'

const Name = createContext('missing')
const Provider: any = Name
const views = new Map<string, any>()
const mounted = new Set<string>()
const increments = new Map<string, () => void>()
let updateName: (name: string) => void
let updateLocalName: (name: string) => void
let removeLocal: () => void
let removeOutlet: () => void
let navigator: ReturnType<typeof useNativeRouteNavigator>
let sheet: ReturnType<typeof useImperativeBottomSheet>
let completeLoader: (value: string) => void
let loaderCompleted = false

const renderTab = () => <Screen><label id="tab-base" text="Tab base" /></Screen>
const tabs = [{ key: 'tab', title: 'Tab', stack: 'portal-tab', render: renderTab }]

function RouteScreen(props: { id: string }) {
	const name = useContext(Name)
	const [count, setCount] = useState(0)
	increments.set(props.id, () => setCount(value => value + 1))
	useEffect(() => { mounted.add(props.id); return () => { mounted.delete(props.id); increments.delete(props.id) } }, [props.id])
	return <Screen><label id={'route-' + props.id} ref={(view: any) => { if (view) views.set(props.id, view); else views.delete(props.id) }} text={name + ':' + count} /></Screen>
}

function SheetRoute(props: { params: { id: string } }) {
	return <RouteScreen id={props.params.id} />
}

function LocalNavigator() {
	navigator = useNativeRouteNavigator()
	return <>{navigator.element}</>
}

function LocalScope() {
	const [name, setName] = useState('Local')
	updateLocalName = setName
	return <Provider value={name}><LocalNavigator /></Provider>
}

export default function Case() {
	sheet = useImperativeBottomSheet()
	const [name, setName] = useState('Avery')
	const [local, setLocal] = useState(true)
	const [open, setOpen] = useState(true)
	updateName = setName
	removeLocal = () => setLocal(false)
	removeOutlet = () => setOpen(false)
	return <Screen><Provider value={name}><UITabBar tabs={tabs} style={{ height: 120 }} />{sheet.element}{open ? <RouteOutlet>{local ? <LocalScope /> : null}</RouteOutlet> : null}</Provider></Screen>
}

export async function run(ctx: any) {
	registerRoutes(defineRoutes([
		{ path: 'portal-route', screen: RouteScreen },
		{ path: 'portal-slow', screen: RouteScreen, loader: () => new Promise<string>(resolve => { completeLoader = value => { loaderCompleted = true; resolve(value) } }) },
	]))

	await ctx.waitFor(() => ctx.find('tab-base')?.isLoaded)
	pushRoute({ stack: 'portal-tab', name: 'portal-route', params: { id: 'tab-route' } } as any)
	await ctx.waitFor(() => mounted.has('tab-route') && views.get('tab-route')?.isLoaded)
	ctx.assert('UITabBar named Frame routes inherit the pane outlet', views.get('tab-route').text, 'Avery:0')
	updateName('Tab update')
	await ctx.waitFor(() => views.get('tab-route')?.text === 'Tab update:0')
	ctx.assert('named tab route receives live provider updates', views.get('tab-route').text, 'Tab update:0')
	popRoute('portal-tab')
	await ctx.waitFor(() => !mounted.has('tab-route'))
	ctx.assert('named tab pop releases route content', views.has('tab-route'), false)
	updateName('Avery')
	const push = (id: string, presentation?: 'modal') => pushRoute({ stack: 'root', name: 'portal-route', params: { id }, presentation } as any)
	push('first')
	await ctx.waitFor(() => mounted.has('first') && views.get('first')?.isLoaded)
	const first = views.get('first')
	const hiddenSheet = sheet.open(SheetRoute, { id: 'hidden-owner-sheet' })
	await ctx.waitFor(() => views.get('hidden-owner-sheet')?.isLoaded)
	ctx.assert('hidden owner presents on the current Page', views.get('hidden-owner-sheet').text, 'Avery:0')
	hiddenSheet.close('done')
	ctx.assert('hidden-owner sheet settles its own handle', await hiddenSheet, 'done')
	await ctx.waitFor(() => !mounted.has('hidden-owner-sheet'))
	ctx.assert('pushed Page inherits its stack outlet provider', first.text, 'Avery:0')
	increments.get('first')!()
	push('second')
	await ctx.waitFor(() => mounted.has('second') && views.get('second')?.isLoaded)
	ctx.assert('hidden Page stays mounted in the backstack', mounted.has('first'), true)
	updateName('Jordan')
	await ctx.waitFor(() => views.get('first')?.text === 'Jordan:1' && views.get('second')?.text === 'Jordan:0')
	ctx.assert('provider update reaches a hidden backstack Page', views.get('first').text, 'Jordan:1')
	popRoute()
	await ctx.waitFor(() => !mounted.has('second') && views.get('first')?.isLoaded)
	ctx.assert('pop preserves previous native view and local state', views.get('first') === first && first.text === 'Jordan:1', true)
	push('modal', 'modal')
	await ctx.waitFor(() => mounted.has('modal') && views.get('modal')?.isLoaded)
	ctx.assert('route modal inherits its stack outlet provider', views.get('modal').text, 'Jordan:0')
	updateName('Riley')
	await ctx.waitFor(() => views.get('modal')?.text === 'Riley:0')
	ctx.assert('route modal receives live context updates', views.get('modal').text, 'Riley:0')
	popRoute()
	await ctx.waitFor(() => !mounted.has('modal'))
	ctx.assert('route modal pop disposes its portal', views.has('modal'), false)
	popRoute()
	await ctx.waitFor(() => !mounted.has('first') && ctx.host.frame.currentPage === ctx.host.page)
	navigator.push({ name: 'portal-route', params: { id: 'local' } } as any)
	await ctx.waitFor(() => mounted.has('local') && views.get('local')?.isLoaded)
	ctx.assert('owner-bound navigation inherits the nearest local provider', views.get('local').text, 'Local:0')
	updateLocalName('Taylor')
	await ctx.waitFor(() => views.get('local')?.text === 'Taylor:0')
	ctx.assert('owner-bound route receives live local updates', views.get('local').text, 'Taylor:0')
	navigator.push({ name: 'portal-slow', params: { id: 'late' } } as any)
	await ctx.waitFor(() => typeof completeLoader === 'function')
	removeLocal()
	await ctx.waitFor(() => !mounted.has('local') && ctx.host.frame.currentPage === ctx.host.page)
	ctx.assert('owner removal returns to its declaring Page', ctx.host.frame.currentPage === ctx.host.page, true)
	completeLoader('ready')
	await ctx.waitFor(() => loaderCompleted)
	await Promise.resolve()
	ctx.assert('removed owner cannot revive an async route', mounted.has('late'), false)
	push('last')
	await ctx.waitFor(() => mounted.has('last') && views.get('last')?.isLoaded)
	removeOutlet()
	await ctx.waitFor(() => mounted.size === 0 && ctx.host.frame.currentPage === ctx.host.page)
	ctx.assert('removing the stack outlet releases every owned route', mounted.size, 0)
}
