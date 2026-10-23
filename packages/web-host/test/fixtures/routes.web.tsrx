/** @jsxImportSource octane */
import { useId, useState } from 'octane'
import { Text, RouteOutlet } from '@octane-xplat/ui'
import { useRouter } from '@octane-xplat/ui/routing'
import {
	defineRoute,
	defineRoutes,
	redirect,
	RouteForbidden,
	RouteResourceNotFound,
} from '@octane-xplat/ui/routing/core'

export let loads = 0
export let guards = 0
export function Item(props: any): any {
	const id = useId()
	const [count, setCount] = useState(0)
	return (
		<>
			<Text>Shared Xplat UI</Text>
			<button id="item" data-id={id} onClick={() => setCount(count + 1)}>
				{props.data.label}:{count}
			</button>
		</>
	)
}

export const catalog = defineRoutes([
	defineRoute({
		path: '/items/:id',
		beforeLoad: () => {
			guards++
		},
		loader: async ({ params, context }: any) => {
			loads++
			if (context.delay) {
				await context.delay()
			}

			return { label: (context.viewer ?? 'client') + '/' + params.id }
		},
		head: ({ data }: any) => ({ title: data.label, meta: { description: data.label } }),
	}).screen(Item),
	defineRoute({
		path: '/redirect',
		beforeLoad: () => {
			throw redirect({ to: '/items/:id', params: { id: 'coat' } })
		},
	}).screen(Item),
	defineRoute({
		path: '/forbidden',
		loader: () => {
			throw new RouteForbidden()
		},
	}).screen(Item),
	defineRoute({
		path: '/missing',
		loader: () => {
			throw new RouteResourceNotFound()
		},
	}).screen(Item),
	defineRoute({
		path: '/response',
		loader: () => {
			throw new Response('custom', { status: 418, headers: { 'X-Route': 'preserved' } })
		},
	}).screen(Item),
	defineRoute({
		path: '/invalid',
		validateSearch: () => {
			throw new Error('bad input')
		},
	}).screen(Item),
	defineRoute({ path: '/render-error' }).screen(Broken),
	defineRoute({
		path: '/error',
		loader: () => {
			throw new Error('private-error')
		},
	}).screen(Item),
])

export function Document(props: any): any {
	return (
		<html lang={props.request.headers.get('X-Lang') ?? 'en'}>
			<head>{props.head}</head>
			<body>
				<header>Store</header>
				{props.children}
				{props.scripts}
			</body>
		</html>
	)
}

function Broken(): any {
	throw new Error('private-render-error')
}

export function App(props: any): any {
	const navigation = useRouter(props.router)
	return (
		<main>
			<p>{navigation.getSnapshot().route?.to ?? 'base'}</p>
			<RouteOutlet />
			<RouteOutlet stack="side" />
		</main>
	)
}
