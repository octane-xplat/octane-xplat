/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

import { createClientRouteEntry } from './client-route-entry'
import { ClientRouteView } from './ClientRouteView.tsrx'
import { createRouter } from './router-instance'
import { defineRoute } from './define-route'
import { defineRoutes } from './route-table'
import { getRouteApi } from './router-hooks.tsrx'
import type { RouterHost, RouterInstance } from './props'

let navigation: RouterInstance<any>
function Item() {
	const item = getRouteApi('/items/:id', navigation)
	return <label text={item.useParams().id + ':' + item.useLoaderData().title} />
}

function Broken() {
	throw new Error('deliberate native render failure')
}

function nodes(node: any): any[] {
	return [node, ...(node.children ?? []).flatMap(nodes)]
}

for (const broken of [false, true]) {
	it(`receives native renderer ${broken ? 'failure' : 'commit'} before settling the request`, async () => {
		const container = createObjectContainer('nativescript')
		const root = createUniversalRoot(container, createObjectDriver('nativescript'))
		let entry: ReturnType<typeof createClientRouteEntry> | undefined
		const host: RouterHost = {
			history: 'independent',
			canReset: true,
			getSnapshot: () => ({ route: entry?.route ?? null, canGoBack: false, modal: false }),
			subscribe: () => () => {},
			commit(command) {
				if (!command.beginCommit()) {
					return { status: 'cancelled', reason: 'superseded' }
				}

				entry = createClientRouteEntry(
					navigation,
					command.flow,
					'native-entry',
					command.route!,
					command.content!,
				)

				root.render(ClientRouteView, { entry })
				return entry.committed
			},
		}

		navigation = createRouter({
			catalog: defineRoutes([
				defineRoute({
					path: '/items/:id',
					loader: ({ params }) => ({ title: params.id.toUpperCase() }),
				}).screen(broken ? Broken : Item),
			]),
			host,
		})

		try {
			const result = await navigation.push({ to: '/items/:id', params: { id: 'coat' } })
			if (broken) {
				expect(result).toMatchObject({ status: 'failed', phase: 'commit' })
			} else {
				expect(result.status).toBe('committed')
				expect(nodes(container).some((node) => node.props?.text === 'coat:COAT')).toBe(true)
			}
		} finally {
			root.unmount()
			navigation.dispose()
		}
	})
}
