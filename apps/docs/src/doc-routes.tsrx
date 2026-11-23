import { defineRoute, defineRoutes } from '@octane-xplat/ui/routing/core'
import { DOCS } from './docs'
import { DocNotFound, DocRouteScreen } from './DocPage.tsrx'

export const docRoutes = defineRoutes([
  defineRoute({
    path: '/:slug?',
    loader: ({ params }) => DOCS.find((page) => page.slug === (params.slug ?? 'README')),
    head: ({ data }) => ({
      title: data ? data.title + ' — Xplat' : 'Page not found — Xplat',
    }),
  }).screen(DocRouteScreen),
  defineRoute({
    path: '/*',
    head: () => ({ title: 'Page not found — Xplat' }),
  }).screen(DocNotFound),
])
