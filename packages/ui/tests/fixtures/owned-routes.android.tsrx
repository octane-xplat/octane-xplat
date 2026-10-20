/** @jsxImportSource @nativescript-community/octane */
import { createContext, useContext, useEffect, useState } from 'octane'
import { RouteOutlet, Screen, useImperativeBottomSheet } from '@octane-xplat/ui'
import { configureRouter, defineRoute, defineRoutes, router, useRouter } from '@octane-xplat/ui/routing'
import type { RouterNavigator } from '@octane-xplat/ui/routing'

const Name = createContext('missing')
const Provider: any = Name
const views = new Map<string, any>()
const mounted = new Set<string>()
const increments = new Map<string, () => void>()
let updateName: (name: string) => void
let updateLocalName: (name: string) => void
let removeLocal: () => void
let removeOutlet: () => void
let navigator: RouterNavigator
let enableLocal: () => void
let restoreOuter: () => void
const routeNavigators = new Map<string, RouterNavigator>()
let sheet: ReturnType<typeof useImperativeBottomSheet>
let completeLoader: (value: string) => void
let loaderCompleted = false

function RouteContent(props: { id: string }) {
	const id = props.id
	const name = useContext(Name)
	const [count, setCount] = useState(0)
	increments.set(id, () => setCount(value => value + 1))
	useEffect(() => { mounted.add(id); return () => { mounted.delete(id); increments.delete(id) } }, [id])
	return <Screen><label id={'route-' + id} ref={(view: any) => { if (view) views.set(id, view); else views.delete(id) }} text={name + ':' + count} /></Screen>
}

function RouteScreen(props: { params: { id: string } }) {
	routeNavigators.set(props.params.id, useRouter())
	return <RouteContent id={props.params.id} />
}

function SheetRoute(props: { params: { id: string } }) {
	return <RouteContent id={props.params.id} />
}

function LocalNavigator() {
	navigator = useRouter()
	return <label id="local-base" text="Local base" />
}

function LocalScope() {
	const [name, setName] = useState('Local')
	updateLocalName = setName
	return <Provider value={name}><RouteOutlet><LocalNavigator /></RouteOutlet></Provider>
}

export default function Case() {
	sheet = useImperativeBottomSheet()
	const [name, setName] = useState('Avery')
	const [scope, setScope] = useState<'outer' | 'local' | 'none'>('outer')
	updateName = setName
	enableLocal = () => setScope('local')
	restoreOuter = () => setScope('outer')
	removeLocal = () => setScope('none')
	removeOutlet = () => setScope('none')
	return <Screen><Provider value={name}>{sheet.element}{scope === 'outer' ? <RouteOutlet><label id="outer-base" text="Outer base" /></RouteOutlet> : scope === 'local' ? <LocalScope /> : null}</Provider></Screen>
}

// This runtime-discovered fixture exercises navigateUrl validation and ownership.
// Static application destinations are checked separately by generated consumer tests.
configureRouter({ allowedSchemes: ['xplat'], catalog: defineRoutes([
	defineRoute({ path: '/portal-route/:id' }).screen(RouteScreen),
	defineRoute({ path: '/portal-modal/:id', presentation: 'modal' }).screen(RouteScreen),
	defineRoute({ path: '/portal-slow/:id', loader: () => new Promise<string>(resolve => { completeLoader = value => { loaderCompleted = true; resolve(value) } }) }).screen(RouteScreen),
]), stacks: ['portal-tab'] })

export async function run(ctx: any) {
	const push = (id: string, presentation?: 'modal') => router.navigateUrl('/' + (presentation === 'modal' ? 'portal-modal' : 'portal-route') + '/' + encodeURIComponent(id))
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
	await router.back()
	await ctx.waitFor(() => !mounted.has('second') && views.get('first')?.isLoaded)
	ctx.assert('pop preserves previous native view and local state', views.get('first') === first && first.text === 'Jordan:1', true)
	push('modal', 'modal')
	await ctx.waitFor(() => mounted.has('modal') && views.get('modal')?.isLoaded)
	ctx.assert('route modal inherits its stack outlet provider', views.get('modal').text, 'Jordan:0')
	updateName('Riley')
	await ctx.waitFor(() => views.get('modal')?.text === 'Riley:0')
	ctx.assert('route modal receives live context updates', views.get('modal').text, 'Riley:0')
	await routeNavigators.get('modal')!.dismiss()
	await ctx.waitFor(() => !mounted.has('modal'))
	ctx.assert('route modal dismissal disposes its portal', views.has('modal'), false)
	await router.back()
	await ctx.waitFor(() => !mounted.has('first') && ctx.host.frame.currentPage === ctx.host.page)
	enableLocal()
	await ctx.waitFor(() => ctx.find('local-base')?.isLoaded)
	void navigator.navigateUrl('/portal-route/local')
	await ctx.waitFor(() => mounted.has('local') && views.get('local')?.isLoaded)
	ctx.assert('owner-bound navigation inherits the nearest local provider', views.get('local').text, 'Local:0')
	updateLocalName('Taylor')
	await ctx.waitFor(() => views.get('local')?.text === 'Taylor:0')
	ctx.assert('owner-bound route receives live local updates', views.get('local').text, 'Taylor:0')
	const late = navigator.navigateUrl('/portal-slow/late')
	await ctx.waitFor(() => typeof completeLoader === 'function')
	removeLocal()
	await ctx.waitFor(() => !mounted.has('local') && ctx.host.frame.currentPage === ctx.host.page)
	ctx.assert('owner removal returns to its declaring Page', ctx.host.frame.currentPage === ctx.host.page, true)
	ctx.assert('removed owner cancels pending preparation', (await late).status, 'cancelled')
	completeLoader('ready')
	await ctx.waitFor(() => loaderCompleted)
	await Promise.resolve()
	ctx.assert('removed owner cannot revive an async route', mounted.has('late'), false)
	restoreOuter()
	await ctx.waitFor(() => ctx.find('outer-base')?.isLoaded)
	void push('last')
	await ctx.waitFor(() => mounted.has('last') && views.get('last')?.isLoaded)
	removeOutlet()
	await ctx.waitFor(() => mounted.size === 0 && ctx.host.frame.currentPage === ctx.host.page)
	ctx.assert('removing the stack outlet releases every owned route', mounted.size, 0)
}
