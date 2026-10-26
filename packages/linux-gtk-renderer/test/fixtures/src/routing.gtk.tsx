/** @jsxImportSource @octane-xplat/jsx */
import { useState } from 'octane'
import {
	createPaneRouterHost,
	createRouter,
	defineRoute,
	defineRoutes,
	RouterPane,
	type RouteScreenProps,
} from '@octane-xplat/ui/routing'

const detail = defineRoute({
	path: '/probe/:id',
	transition: 'none',
	loader: ({ params }) => ({ id: params.id }),
})

function Detail(props: RouteScreenProps<typeof detail>) {
	const [count, setCount] = useState(0)

	return (
		<masonview style={{ display: 'flex', flexDirection: 'column' }}>
			<label text={`${props.data.id}:${count}`} />
			<button text={`Increment ${props.data.id}`} onTap={() => setCount(count + 1)} />
		</masonview>
	)
}

const host = createPaneRouterHost()
const navigation = createRouter({ host: host.host, catalog: defineRoutes([detail.screen(Detail)]) })
host.attach(navigation)

export function App() {
	return (
		<masonview style={{ display: 'flex', flexDirection: 'column' }}>
			<button
				text="Open coat"
				onTap={() => {
					void navigation.push({ to: '/probe/:id', params: { id: 'coat' } })
				}}
			/>
			<RouterPane host={host} router={navigation} />
		</masonview>
	)
}

export { navigation }
