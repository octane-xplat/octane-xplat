import { createRoot } from 'octane'
import { RouteOutlet, Text } from '@octane-xplat/ui'
import { configureRouter, defineRoute, defineRoutes } from '@octane-xplat/ui/routing'
import { CachedUsers, loader as loadFeed } from '../../../../../packages/app/src/app/cached-users.tsrx'
import { CachedUser, loader as loadUser, validateSearch } from '../../../../../packages/app/src/app/cached-user.tsrx'
import { routeContext } from '../../../../../packages/app/src/route-context'

// Keep the real app screens, transport, and router, without importing unrelated demos.
const route = defineRoute.withContext<ReturnType<typeof routeContext>>()
configureRouter({
	catalog: defineRoutes([
		route({ path: '/cached-users', loader: loadFeed }).screen(CachedUsers),
		route({ path: '/cached-user', validateSearch, loader: loadUser }).screen(CachedUser),
	]),
	context: routeContext,
})
function App() @{
	<RouteOutlet><Text>Opening query workflow…</Text></RouteOutlet>
}
createRoot(document.getElementById('root')!).render(App, {})
