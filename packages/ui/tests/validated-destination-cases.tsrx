/** @jsxImportSource @octane-xplat/jsx */
import { createRouter } from '../src/routing/router-instance'
import { defineRoute } from '../src/routing/define-route'
import { defineRoutes, defineRuntimeRoutes } from '../src/routing/route-table'
import { NavLink } from '../src/components/navigation/NavLink'
import { Text } from '../src/components/content/Text'
import { RouterProvider } from '../src/routing/router-hooks.tsrx'
import type { PreparedRouteMatch, RouterHost, ValidatedDestination } from '../src/props'

export function checkedLinkFixture() {
	const matches = new Map<string, PreparedRouteMatch>()
	const listeners = new Set<() => void>()
	let loads = 0
	const host: RouterHost = {
		history: 'independent',
		canReset: true,
		getSnapshot: (flow) => ({ route: matches.get(flow) ?? null, canGoBack: false, modal: false }),
		subscribe: (listener) => {
			listeners.add(listener)
			return () => {
				listeners.delete(listener)
			}
		},
		commit(command) {
			if (!command.beginCommit()) {
				return { status: 'cancelled', reason: 'superseded' }
			}

			if (command.route) {
				matches.set(command.flow, command.route)
			}

			for (const listener of listeners) {
				listener()
			}

			return { status: 'committed', route: matches.get(command.flow) ?? null }
		},
	}

	const router = createRouter({
		catalog: defineRoutes([]),
		host,
		base: '/app',
		stacks: ['library'],
	})

	const registration = router.addRoutes(
		defineRuntimeRoutes([
			defineRoute({
				path: '/from-data/:id',
				validateSearch: (raw: { page?: unknown }) => {
					const page = Number(raw.page ?? 1)
					if (!Number.isSafeInteger(page) || page < 1) {
						throw new Error('Invalid page')
					}

					return { page }
				},
				loader: ({ params, search }) => {
					loads++
					return params.id + ':' + search.page
				},
			}).screen(() => null),
		]),
		{ id: 'content' },
	)

	return {
		router,
		registration,
		get loads() {
			return loads
		},
	}
}

export function CheckedLinks(props: {
	router: ReturnType<typeof checkedLinkFixture>['router']
	destination: ValidatedDestination
	disabled?: boolean
	cancel?: boolean
}) {
	return (
		<RouterProvider router={props.router} stack="library">
			<NavLink
				router={props.router}
				to={props.destination}
				id="checked-link"
				activeClassName="selected"
				disabled={props.disabled}
				onPress={(event) => {
					if (props.cancel) {
						event.preventDefault()
					}
				}}
			>
				<Text>Open checked</Text>
			</NavLink>
		</RouterProvider>
	)
}
