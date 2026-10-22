import { defineRoute, defineRoutes, RouteResourceNotFound } from '@octane-xplat/ui/routing/core'
import { DOCS } from './docs'
import { DocRouteScreen } from './DocPage.tsrx'

export const docRoutes = defineRoutes([
	defineRoute({
		path: '/:slug?',
		loader: ({ params }) => {
			const doc = DOCS.find((page) => page.slug === (params.slug ?? 'README'))
			if (!doc) {
				throw new RouteResourceNotFound()
			}

			return doc
		},
		head: ({ data }) => ({ title: data.title === 'Xplat' ? 'Xplat docs' : data.title + ' — Xplat' }),
	}).screen(DocRouteScreen),
])
