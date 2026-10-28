// Canonical router configuration — preserves the pinned upstream URL space
// (all routes carry a trailing-slash form upstream; the matcher normalizes
// trailing slashes so `/templates/X/` resolves against `/templates/:name`).
//
// One parameterized route stands in for each generated upstream family:
//   /templates/:name  → all 714 template routes (block + page templates)
//   /pages/*rest      → all 51 authored pages incl. the motion-lab subtree
//   /*rest            → catch-all 404, matching upstream's 404.html behavior
//
// Whether a resolved route shows real content or the pending placeholder is
// decided by the coverage registry, not by the route table.

import { configureRouter, defineRoute, defineRoutes } from '@octane-xplat/ui/routing'
import { HomeScreen } from './screens/HomeScreen'
import { CategoryScreen } from './screens/CategoryScreen'
import { TemplatesIndexScreen } from './screens/TemplatesIndexScreen'
import { TemplateScreen } from './screens/TemplateScreen'
import { PageScreen } from './screens/PageScreen'
import { NotFoundScreen } from './screens/NotFoundScreen'
import { CatchAllScreen } from './screens/CatchAllScreen'

// Embed URLs carry `?embed=1&theme=<name>&mode=<light|dark>` (upstream's
// embed contract); the router rejects search params unless the route
// declares a validator — pass them through verbatim, the theme layer reads
// them from location.search itself.
const passthroughSearch = (raw: Record<string, unknown>) => raw

export const routes = defineRoutes([
	defineRoute({ path: '', validateSearch: passthroughSearch }).screen(HomeScreen),
	defineRoute({ path: '/components-patterns', validateSearch: passthroughSearch }).screen(
		function ComponentsPatternsRoute() {
			return CategoryScreen({ slug: 'components-patterns' })
		},
	),
	defineRoute({ path: '/themes', validateSearch: passthroughSearch }).screen(
		function ThemesRoute() {
			return CategoryScreen({ slug: 'themes' })
		},
	),
	defineRoute({ path: '/tools', validateSearch: passthroughSearch }).screen(function ToolsRoute() {
		return CategoryScreen({ slug: 'tools' })
	}),
	defineRoute({ path: '/templates', validateSearch: passthroughSearch }).screen(
		TemplatesIndexScreen,
	),
	defineRoute({ path: '/templates/:name', validateSearch: passthroughSearch }).screen(
		TemplateScreen,
	),
	defineRoute({ path: '/pages/*rest', validateSearch: passthroughSearch }).screen(PageScreen),
	defineRoute({ path: '/404', validateSearch: passthroughSearch }).screen(function NotFoundRoute() {
		return NotFoundScreen({})
	}),
	// The canonical match-order ranks catch-alls above the empty index
	// pattern, so /*rest also wins '/': CatchAllScreen delegates the empty
	// splat to HomeScreen and everything else to the pinned 404 surface.
	defineRoute({ path: '/*rest', validateSearch: passthroughSearch }).screen(CatchAllScreen),
])

configureRouter({ catalog: routes })
