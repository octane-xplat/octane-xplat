// @vitest-environment node
import { expect, it } from 'vitest'
import { mkdtemp, mkdir, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { join, resolve, sep } from 'node:path'

// This integration check starts nine TypeScript compiler processes. Allow the
// full platform sweep to finish on shared hosts while keeping every assertion.
it('connects package-root registration to consumer destination types', async () => {
	const root = fileURLToPath(new URL('../', import.meta.url))
	const cache = join(root, 'node_modules/.cache')
	await mkdir(cache, { recursive: true })
	const fixture = await mkdtemp(join(cache, 'routing-package-'))
	try {
		const packed = process.env.XPLAT_ROUTING_UI_PACKAGE
		if (packed) {
			// A package scope prevents ancestor self-reference from silently using
			// workspace declarations when qualifying an extracted distribution.
			await writeFile(join(fixture, 'package.json'), '{"private":true,"type":"module"}')
			await mkdir(join(fixture, 'node_modules/@octane-xplat'), { recursive: true })
			await symlink(resolve(packed), join(fixture, 'node_modules/@octane-xplat/ui'), 'dir')
			const consumer = createRequire(join(fixture, 'consumer.mts'))
			const resolved = await realpath(consumer.resolve('@octane-xplat/ui/routing/core'))
			expect(resolved.startsWith((await realpath(packed)) + sep)).toBe(true)
		}
		await writeFile(
			join(fixture, 'consumer.mts'),
			`
import type {} from '@octane-xplat/ui'
import { router, configureRouter, redirect, useRouter, useNavigation, useNavigationBlocker, getRouteApi, RouterProvider, RouterPane, createPaneRouterHost } from '@octane-xplat/ui/routing'
import { createRouter, defineRoute, defineRouteGroup, withSearchDecoder, defineRoutes, defineRuntimeRoutes, mergeRouteManifests } from '@octane-xplat/ui/routing/core'
import type { Destination, DestinationFor, ContractsOf, RouterHost, RouteCatalog, RouteContract } from '@octane-xplat/ui/routing/core'
import { NavLink } from '@octane-xplat/ui'
import { NavigationMenu, SideNavItem, TopNavItem, TopNavMenu, TopNavMegaMenuItem, NavHeadingMenuItem, Tab, Breadcrumbs, DropdownMenuLink, DropdownMenu, ContextMenu } from '@octane-xplat/ui'
import { defineTransitions } from '@octane-xplat/ui/routing/core'
import { defineWebTransition } from '@octane-xplat/ui/web'
import type { TransitionNames, TransitionRegistry } from '@octane-xplat/ui/routing/core'
const effects = defineTransitions({ detail: defineWebTransition({ types: ({ direction }) => ['detail-' + direction] }) })
const effectName: TransitionNames<typeof effects> = 'detail'
// @ts-expect-error Registration preserves finite custom motion keys.
const unknownEffect: TransitionNames<typeof effects> = 'invented'
declare const runtimeEffects: TransitionRegistry
// @ts-expect-error An unbounded runtime registry cannot declare every transition name.
const runtimeEffectName: TransitionNames<typeof runtimeEffects> = 'invented'
declare module '@octane-xplat/ui' {
  interface AppRouteStacks { 'ambient-only': unknown }
  interface AppRouteTransitions { 'ambient-motion': unknown }
  interface AppRouteContracts {
    fixture: { '/items/:id': {
      params: { id: string }; searchInput: { tab?: 'details' | 'activity' };
      search: { tab: 'details' | 'activity' }; data: { title: string }; context: {}
    } }
  }
}
const accept = (_destination: Destination) => undefined
declare const fileCatalog: RouteCatalog<{ '/catalog-file/:id': RouteContract<{ id: string }> }>
declare const erasedCatalog: import('@octane-xplat/ui/routing/core').ContractRouteManifest
// @ts-expect-error Existential catalog views cannot erase contracts before declared composition.
mergeRouteManifests(fileCatalog, erasedCatalog)
// @ts-expect-error An erased catalog cannot establish an instance's contracts or dependencies.
createRouter({ catalog: erasedCatalog, host: undefined as unknown as RouterHost })
// @ts-expect-error An erased catalog cannot bypass registered default output checks.
configureRouter({ catalog: erasedCatalog })
const assembledCatalog = mergeRouteManifests(fileCatalog, defineRoutes([{ path: '/catalog-extra', screen: () => null }]))
type AssembledDestination = DestinationFor<ContractsOf<typeof assembledCatalog>>
const fileDestination: AssembledDestination = { to: '/catalog-file/:id', params: { id: 'coat' } }
const extraDestination: AssembledDestination = { to: '/catalog-extra' }
// @ts-expect-error Composed catalogs retain required path fields.
const missingDestination: AssembledDestination = { to: '/catalog-file/:id' }
// @ts-expect-error Composed catalogs exclude unknown names.
const unknownDestination: AssembledDestination = { to: '/unknown-catalog' }
accept({ to: '/items/:id', params: { id: 'coat' }, search: { tab: 'activity' } })
// @ts-expect-error Package consumers retain path requirements.
accept({ to: '/items/:id' })
// @ts-expect-error Package consumers retain search enum values.
accept({ to: '/items/:id', params: { id: 'coat' }, search: { tab: 'wrong' } })
// @ts-expect-error Package consumers reject unknown paths.
accept({ to: '/invented' })
// Runtime-discovered paths do not declare a compile-time route family.
const runtimePaths: string[] = []
const runtimeCatalog = defineRuntimeRoutes(runtimePaths.map(path => defineRoute({ path }).screen(() => null)))
// @ts-expect-error Computed patterns require the explicit runtime-only builder.
defineRoutes(runtimePaths.map(path => defineRoute({ path }).screen(() => null)))
// @ts-expect-error Erasing a catalog to RouteManifest also erases composable contract evidence.
mergeRouteManifests(undefined as unknown as import('@octane-xplat/ui/routing/core').RouteManifest)
// @ts-expect-error A catalog's full inferred map cannot be covariantly erased before composition.
const erasedContracts: RouteCatalog<{}> = fileCatalog
const staticAndRuntime = mergeRouteManifests(fileCatalog, runtimeCatalog)
const acceptMixed = (_destination: DestinationFor<ContractsOf<typeof staticAndRuntime>>) => undefined
acceptMixed({ to: '/catalog-file/:id', params: { id: 'coat' } })
// @ts-expect-error A runtime contribution cannot erase a known route's required fields.
acceptMixed({ to: '/catalog-file/:id' })
// @ts-expect-error Runtime paths must not turn every absolute string into a typed destination.
acceptMixed({ to: '/not-a-declared-route' })

const records: { slug: string }[] = []
const templatedCatalog = defineRuntimeRoutes(records.map(row => defineRoute({ path: \`/runtime/\${row.slug}\` }).screen(() => null)))
const templatedAndStatic = mergeRouteManifests(fileCatalog, templatedCatalog)
const acceptTemplated = (_destination: DestinationFor<ContractsOf<typeof templatedAndStatic>>) => undefined
acceptTemplated({ to: '/catalog-file/:id', params: { id: 'coat' } })
// @ts-expect-error An unbounded template cannot declare every path under its prefix.
acceptTemplated({ to: '/runtime/undeclared' })
const numericCatalog = defineRuntimeRoutes([defineRoute({ path: \`/numeric/\${Math.random()}\` }).screen(() => null)])
const numericAndStatic = mergeRouteManifests(fileCatalog, numericCatalog)
// @ts-expect-error Numeric template indexes also describe runtime paths, not a declared finite family.
const inventedNumeric: DestinationFor<ContractsOf<typeof numericAndStatic>> = { to: '/numeric/123' }
const literalCatalog = defineRoutes([
  defineRoute({ path: '/archive/001' }).screen(() => null),
  defineRoute({ path: '/café' }).screen(() => null),
])
const literalPaths: DestinationFor<ContractsOf<typeof literalCatalog>>[] = [{ to: '/archive/001' }, { to: '/café' }]

const runtimeAccountCatalog = defineRuntimeRoutes(runtimePaths.map(path => defineRoute.withContext<{ account: string }>()({ path }).screen(() => null)))
// @ts-expect-error Runtime-only destinations still require their declared root services.
createRouter({ catalog: runtimeAccountCatalog, host: undefined as unknown as RouterHost })
createRouter({ catalog: runtimeAccountCatalog, host: undefined as unknown as RouterHost, context: { account: 'a' } })
const runtimeServiceCatalog = defineRuntimeRoutes(runtimePaths.map(path => defineRoute.withContext<{ service: string }>()({ path }).screen(() => null)))
const runtimeWithDependencies = mergeRouteManifests(fileCatalog, runtimeAccountCatalog, runtimeServiceCatalog)
// @ts-expect-error Composing runtime catalogs must preserve both root dependency requirements.
createRouter({ catalog: runtimeWithDependencies, host: undefined as unknown as RouterHost, context: { service: 'a' } })
// @ts-expect-error A later runtime layer cannot erase an earlier root dependency.
createRouter({ catalog: runtimeWithDependencies, host: undefined as unknown as RouterHost, context: { account: 'a' } })
createRouter({ catalog: runtimeWithDependencies, host: undefined as unknown as RouterHost, context: { account: 'a', service: 'b' } })
const unionPath: '/union/:id' | '/union/static' = Math.random() > 0.5 ? '/union/:id' : '/union/static'
const unionPathCatalog = defineRoutes([defineRoute({ path: unionPath }).screen(() => null)])
const acceptUnion = (_destination: DestinationFor<ContractsOf<typeof unionPathCatalog>>) => undefined
acceptUnion({ to: '/union/:id', params: { id: 'coat' } })
acceptUnion({ to: '/union/static' })
// @ts-expect-error A finite path union retains params for each selected pattern.
acceptUnion({ to: '/union/:id' })

const baked = defineRoutes({ routes: [{ path: '/baked', dataMode: 'baked', screen: () => null }], baked: { baked: { title: 'build output' } } })
const bakedRouter = createRouter({ catalog: baked, host: undefined as unknown as RouterHost })
const bakedData = getRouteApi('/baked', bakedRouter).useLoaderData()
// @ts-expect-error Build-time DTOs retain their inferred object type.
const erasedBaked: undefined = bakedData
const bakedTitle: string = bakedData.title
// @ts-expect-error A supplied baked map infers its DTO, not arbitrary fields.
bakedData.invented
// @ts-expect-error Inferred DTO fields retain their actual value types.
const numericBakedTitle: number = bakedData.title
const multipleBaked = defineRoutes({ routes: [
 { path: '/', dataMode: 'baked', screen: () => null },
 { path: '/docs/[slug]', dataMode: 'baked', screen: () => null },
 { path: '/live', loader: () => ({ count: 3 }), screen: () => null },
], baked: { index: { welcome: true }, 'docs/:slug': { pages: ['intro'] }, live: { wrong: true }, undeclared: { secret: true } } })
const multipleBakedRouter = createRouter({ catalog: multipleBaked, host: undefined as unknown as RouterHost })
const welcome: boolean = getRouteApi('/', multipleBakedRouter).useLoaderData().welcome
const pages: readonly string[] = getRouteApi('/docs/:slug', multipleBakedRouter).useLoaderData().pages
const liveCount: number = getRouteApi('/live', multipleBakedRouter).useLoaderData().count
// @ts-expect-error Map data for a live route cannot replace the actual loader contract.
getRouteApi('/live', multipleBakedRouter).useLoaderData().wrong
// @ts-expect-error Extra baked-map keys do not declare new routes.
multipleBakedRouter.push({ to: '/undeclared' })
// @ts-expect-error Baked routes retain the pattern's required params.
multipleBakedRouter.push({ to: '/docs/:slug' })
type ExplicitBakedSpecs = readonly [{ path: '/proof-baked'; dataMode: 'baked'; screen: () => null }]
type ExplicitBakedData = { 'proof-baked': { title: string } }
// @ts-expect-error Explicit baked metadata still requires an actual map input.
defineRoutes<ExplicitBakedSpecs, ExplicitBakedData>({ routes: [{ path: '/proof-baked', dataMode: 'baked', screen: () => null }] })
// @ts-expect-error The list form cannot acquire an arbitrary baked DTO generic.
defineRoutes<ExplicitBakedSpecs, ExplicitBakedData>([{ path: '/proof-baked', dataMode: 'baked', screen: () => null }])
const optionalBakedInput: { routes: ExplicitBakedSpecs; baked?: ExplicitBakedData } = { routes: [{ path: '/proof-baked', dataMode: 'baked', screen: () => null }] }
const optionalBakedRouter = createRouter({ catalog: defineRoutes(optionalBakedInput), host: undefined as unknown as RouterHost })
// @ts-expect-error An optional map does not prove data exists.
getRouteApi('/proof-baked', optionalBakedRouter).useLoaderData().title
const missingBakedMap = defineRoutes([{ path: '/missing-baked', dataMode: 'baked', screen: () => null }])
const missingBakedRouter = createRouter({ catalog: missingBakedMap, host: undefined as unknown as RouterHost })
// @ts-expect-error A missing map cannot manufacture a DTO shape.
getRouteApi('/missing-baked', missingBakedRouter).useLoaderData().title
const erasedBakedMap: Record<string, unknown> = { erased: { title: 'unknown' } }
const erasedBakedCatalog = defineRoutes({ routes: [{ path: '/erased', dataMode: 'baked', screen: () => null }], baked: erasedBakedMap })
const erasedBakedRouter = createRouter({ catalog: erasedBakedCatalog, host: undefined as unknown as RouterHost })
// @ts-expect-error Runtime data without preserved types remains unknown.
getRouteApi('/erased', erasedBakedRouter).useLoaderData().title
const maybeBakedMode: 'baked' | 'live' = Math.random() > 0.5 ? 'baked' : 'live'
const maybeBakedCatalog = defineRoutes({ routes: [{ path: '/maybe-baked', dataMode: maybeBakedMode, screen: () => null }], baked: { 'maybe-baked': { title: 'maybe' } } })
const maybeBakedRouter = createRouter({ catalog: maybeBakedCatalog, host: undefined as unknown as RouterHost })
const maybeBakedData = getRouteApi('/maybe-baked', maybeBakedRouter).useLoaderData()
const maybeBakedTitle: string | undefined = maybeBakedData?.title
// @ts-expect-error A runtime data-mode choice cannot prove that data is absent.
const maybeAbsentData: undefined = maybeBakedData
// @ts-expect-error A runtime data-mode choice cannot prove that data is present.
const maybePresentData: { title: string } = maybeBakedData
const erasedOptionalLoader: import('@octane-xplat/ui/routing').RouteSpec<'/optional-loader'> = { path: '/optional-loader', loader: () => ({ count: 1 }), screen: () => null }
const optionalLoaderRouter = createRouter({ catalog: defineRoutes([erasedOptionalLoader]), host: undefined as unknown as RouterHost })
// @ts-expect-error Erasing optional loader metadata cannot manufacture an undefined output.
const erasedOptionalOutput: undefined = getRouteApi('/optional-loader', optionalLoaderRouter).useLoaderData()
const composedBakedCatalog = mergeRouteManifests(baked, multipleBaked)
const composedBakedRouter = createRouter({ catalog: composedBakedCatalog, host: undefined as unknown as RouterHost })
const composedBakedTitle: string = getRouteApi('/baked', composedBakedRouter).useLoaderData().title
const composedBakedPages: readonly string[] = getRouteApi('/docs/:slug', composedBakedRouter).useLoaderData().pages
const local = createRouter({
  catalog: defineRoutes([defineRoute({ path: '/local', loader: () => ({ count: 1 }) }).screen(() => null)]),
  host: undefined as unknown as RouterHost,
})
local.push({ to: '/local' })
NavLink({ to: '/items/:id', params: { id: 'coat' }, children: 'Coat' })
NavLink({ router: local, to: '/local', children: 'Local' })
// @ts-expect-error A link must retain required path fields.
NavLink({ to: '/items/:id' })
// @ts-expect-error A link cannot invent an application route.
NavLink({ to: '/invented' })
// @ts-expect-error The default link cannot infer a catalog from its destination.
NavLink({ to: '/local' })
// @ts-expect-error Explicit link instances exclude unrelated ambient routes.
NavLink({ router: local, to: '/items/:id', params: { id: 'coat' } })
// @ts-expect-error Link transitions retain the generated name union.
NavLink({ router: local, to: '/local', transition: 'invented' })
if (Math.random() > 1) redirect({ to: '/items/:id', params: { id: 'coat' } })
// @ts-expect-error Guard and loader redirects retain required path fields.
if (Math.random() > 1) redirect({ to: '/items/:id' })
// @ts-expect-error Redirects reject unknown routes.
if (Math.random() > 1) redirect({ to: '/invented' })

// The custom-host guide and skill share this complete inferred factory.
export function createPaneNavigation(host: RouterHost) {
  const catalog = defineRoutes([defineRoute({ path: '/help' }).screen(() => null)])
  const navigation = createRouter({ catalog, host, stacks: ['library', 'settings'] })
  return { navigation, library: navigation.forStack('library') }
}
const paneRouter = createRouter({
  catalog: defineRoutes([defineRoute({ path: '/pane' }).screen(() => null)]),
  stacks: ['left', 'right'],
  host: undefined as unknown as RouterHost,
})
paneRouter.forStack('left').push({ to: '/pane', stack: 'right' })
paneRouter.forStack('root')
paneRouter.href({ to: '/pane', stack: 'left' })
paneRouter.back({ fallback: { to: '/pane', stack: 'right' } })
useRouter(paneRouter).push({ to: '/pane', stack: 'left' })
RouterProvider({ router: paneRouter, stack: 'right' })
const rendering = createPaneRouterHost()
// @ts-expect-error A structural object cannot establish an original host witness.
const forgedPaneHost: typeof rendering = { host: rendering.host, attach() {} }
// @ts-expect-error Binding operations match the frozen public host object.
rendering.attach = () => {}
// @ts-expect-error The navigation host cannot be replaced after construction.
rendering.host = undefined as unknown as RouterHost
RouterPane({ host: rendering, router: paneRouter, stack: 'left' })
RouterPane({ host: rendering, router: paneRouter })
// @ts-expect-error A pane's stack comes from its explicit instance.
RouterPane({ host: rendering, router: paneRouter, stack: 'invented' })
// @ts-expect-error A pane cannot borrow ambient application stacks.
RouterPane({ host: rendering, router: paneRouter, stack: 'ambient-only' })
// @ts-expect-error A root-only instance has no named rendering pane.
RouterPane({ host: rendering, router: local, stack: 'left' })
// @ts-expect-error An explicit instance excludes unrelated generated stack names.
paneRouter.forStack('ambient-only')
// @ts-expect-error A root-only instance does not inherit application stacks.
local.push({ to: '/local', stack: 'ambient-only' })
// @ts-expect-error Explicit destinations use the instance's inferred stack names.
paneRouter.push({ to: '/pane', stack: 'invented' })
// @ts-expect-error Bound navigators retain the instance's stack union.
paneRouter.forStack('left').replace({ to: '/pane', stack: 'invented' })
// @ts-expect-error URL generation checks instance-local stacks.
paneRouter.href({ to: '/pane', stack: 'ambient-only' })
// @ts-expect-error Back fallback uses the same destination contract.
paneRouter.back({ fallback: { to: '/pane', stack: 'invented' } })
// @ts-expect-error Hooks preserve inferred instance stacks.
useRouter(paneRouter).push({ to: '/pane', stack: 'ambient-only' })
// @ts-expect-error A provider's stack cannot widen its router's accepted names.
RouterProvider({ router: paneRouter, stack: 'invented' })
// @ts-expect-error A provider cannot introduce ambient stacks into an isolated instance.
RouterProvider({ router: local, stack: 'ambient-only' })
useRouter().push({ to: '/items/:id', params: { id: 'coat' }, stack: 'ambient-only' })

const motionRouter = createRouter({ catalog: defineRoutes([defineRoute({ path: '/motion' }).screen(() => null)]), host: undefined as unknown as RouterHost, transitions: effects })
motionRouter.push({ to: '/motion', transition: 'detail' })
motionRouter.forStack('root').replace({ to: '/motion', transition: 'detail' })
useRouter(motionRouter).push({ to: '/motion', transition: 'detail' })
NavLink({ router: motionRouter, to: '/motion', transition: 'detail' })
RouterProvider({ router: motionRouter })
// @ts-expect-error Explicit instances infer their own custom effect names.
motionRouter.push({ to: '/motion', transition: 'invented' })
// @ts-expect-error An unrelated ambient motion does not enter an explicit instance.
motionRouter.push({ to: '/motion', transition: 'ambient-motion' })
// @ts-expect-error Bound hooks retain their instance's transition union.
useRouter(motionRouter).push({ to: '/motion', transition: 'ambient-motion' })
// @ts-expect-error Instance-aware links retain their transition union.
NavLink({ router: motionRouter, to: '/motion', transition: 'ambient-motion' })
// @ts-expect-error An instance without a custom registry accepts built-in presets only.
local.push({ to: '/local', transition: 'detail' })
// @ts-expect-error Links cannot infer effect names from the requested transition itself.
NavLink({ router: local, to: '/local', transition: 'detail' })
router.push({ to: '/items/:id', params: { id: 'coat' }, transition: 'ambient-motion' })

// @ts-expect-error Instance options cannot override declared behavior.
createRouter({ catalog: literalCatalog, host: undefined as unknown as RouterHost, behaviors: {} })
async function runtimeDestinations() {
  const controller = new AbortController()
  const warmed = await local.preload({ to: '/local' }, { signal: controller.signal })
  if (warmed.status === 'preloaded') { const href: string = warmed.href }
  // @ts-expect-error Preloading keeps the instance's finite route contract.
  local.preload({ to: '/unknown' })
  // @ts-expect-error Parameterized routes still require their params.
  router.preload({ to: '/items/:id' })
  const checked = await local.validateDestination({ to: '/local' }, { signal: controller.signal })
  // @ts-expect-error Validation is async because schemas may be async.
  local.validateDestination({ to: '/local' }).status
  if (checked.status !== 'valid') return
  local.preload(checked.destination)
  local.push(checked.destination)
  local.replace(checked.destination)
  local.navigate(checked.destination)
  local.reset(checked.destination)
  local.back({ fallback: checked.destination })
  const href: string = local.href(checked.destination)
  SideNavItem({ router: local, label: 'Checked', to: checked.destination })
  DropdownMenuLink({ router: local, label: 'Checked', to: checked.destination })
  // @ts-expect-error Opaque options are chosen before validation.
  SideNavItem({ router: local, label: 'Checked', to: checked.destination, params: { id: 'other' } })
  NavLink({ router: local, to: checked.destination, children: 'Checked' })
  if (Math.random() > 2) redirect(checked.destination)
  // @ts-expect-error Checked values are opaque; caller-selected fields are not part of the proof.
  checked.destination.params
  // @ts-expect-error Pass the opaque value through to, not a component prop spread.
  NavLink({ router: local, ...checked.destination })
  // @ts-expect-error Choose route fields/options before validating the complete request.
  NavLink({ router: local, to: checked.destination, params: { id: 'invented' } })
  const raw = local.resolveUrl('/local')
  if (raw.status === 'matched') {
    // @ts-expect-error A syntactic URL match does not establish the async schema proof.
    local.push(raw.destination)
  }
  void href
}
const registered = local.addRoutes(defineRoutes([defineRoute({ path: '/dynamic' }).screen(() => null)]), { id: 'plugin' })
registered.dispose()
// @ts-expect-error Runtime registration cannot widen an already inferred destination union.
local.push({ to: '/dynamic' })
const needsAccount = defineRoute.withContext<{ account: { id: string } }>()({ path: '/private' }).screen(() => null)
// @ts-expect-error A runtime layer cannot require dependencies absent from this router's declared root context.
local.addRoutes(defineRoutes([needsAccount]), { id: 'private' })
// @ts-expect-error Explicit instance catalogs exclude unrelated ambient routes.
local.push({ to: '/items/:id', params: { id: 'coat' } })
router.push({ to: '/items/:id', params: { id: 'coat' }, stack: 'ambient-only' })
router.forStack('ambient-only')
useRouter(router).push({ to: '/items/:id', params: { id: 'coat' } })
RouterProvider({ router, stack: 'ambient-only' })
// @ts-expect-error Published default facades retain required path params.
router.push({ to: '/items/:id' })
// @ts-expect-error The default facade retains the generated stack union.
router.forStack('invented')
// @ts-expect-error Explicit-only routes do not enter the default registry.
router.push({ to: '/local' })
configureRouter({ catalog: defineRoutes([needsAccount]), context: { account: { id: 'a' } } })
// @ts-expect-error Default setup requires the catalog's root dependencies.
configureRouter({ catalog: defineRoutes([needsAccount]) })
const blocker = useNavigationBlocker({ when: true })
const blockerState: import('@octane-xplat/ui/routing').NavigationBlockerState = blocker
const blockerOptions: import('@octane-xplat/ui/routing').NavigationBlockerOptions = { when: false }
useNavigationBlocker(blockerOptions)
// @ts-expect-error Confirmation controls require a blocked-state check.
blocker.proceed()
// @ts-expect-error The condition must be boolean.
useNavigationBlocker({ when: 'dirty' })
// @ts-expect-error A caller cannot choose a fabricated route-data contract.
useNavigationBlocker<{ invented: string }>({ when: true })
if (blocker.status === 'blocked') {
  blocker.proceed()
  blocker.reset()
  const path: string | undefined = blocker.destination?.to
  const input: unknown = blocker.destination?.search?.page
  // @ts-expect-error Confirmation input has no prepared loader data.
  blocker.destination?.data.title
  // @ts-expect-error Search input is unvalidated, not a successful route output.
  const output: number = blocker.destination?.search?.page
  void [path, input, output]
}
if (blocker.status === 'proceeding') {
  // @ts-expect-error A decided request cannot be approved again.
  blocker.proceed()
}
void blockerState

const navigationState = useNavigation()
if (navigationState.status === 'pending') {
  const action: string = navigationState.action
  // @ts-expect-error Navigation feedback exposes a readonly input snapshot.
  navigationState.destination!.params!.id = 'changed'
  // @ts-expect-error Pending feedback has no failure result.
  navigationState.result
}
if (navigationState.status === 'failed') {
  const status: string = navigationState.result.status
  // @ts-expect-error Failure feedback never invents loaded route data.
  navigationState.result.data
}
// @ts-expect-error Navigation state is discriminated rather than a nullable pending flag.
router.getSnapshot().pending
router.clearFailure()
const registeredApi = getRouteApi('/items/:id')
const registeredTitle: string = registeredApi.useLoaderData().title
const registeredSearch: 'details' | 'activity' = registeredApi.useSearch().tab
NavigationMenu({ items: [{ key: 'coat', label: 'Coat', to: '/items/:id', params: { id: 'coat' } }] })
SideNavItem({ label: 'Coat', to: '/items/:id', params: { id: 'coat' } })
TopNavItem({ label: 'Activity', to: '/items/:id', params: { id: 'coat' }, search: { tab: 'activity' } })
TopNavMegaMenuItem({ title: 'Coat', to: '/items/:id', params: { id: 'coat' } })
TopNavMenu({ label: 'Items', items: [{ title: 'Coat', to: '/items/:id', params: { id: 'coat' } }] })
Breadcrumbs({ items: [{ label: 'Coat', to: '/items/:id', params: { id: 'coat' } }, { label: 'Current' }] })
DropdownMenuLink({ label: 'Coat', to: '/items/:id', params: { id: 'coat' }, onSelect: event => event.preventDefault() })
DropdownMenu({ items: [{ type: 'link', key: 'coat', label: 'Coat', to: '/items/:id', params: { id: 'coat' } }] })
ContextMenu({ items: [{ type: 'section', key: 'section', label: 'Items', items: [{ type: 'link', key: 'coat', to: '/items/:id', params: { id: 'coat' } }] }] })
SideNavItem({ label: 'External', href: 'https://example.com' })
SideNavItem({ label: 'Action', onClick: event => event.preventDefault() })
SideNavItem({ label: 'Local', router: local, to: '/local' })
NavHeadingMenuItem({ label: 'Local', router: local, to: '/local' })
Tab({ value: 'local', label: 'Local', router: local, to: '/local' })
SideNavItem({ label: 'New window', to: '/items/:id', params: { id: 'coat' }, target: '_blank', rel: 'noreferrer' })
const readonlyAncestors = [{ label: 'Coat', to: '/items/:id', params: { id: 'coat' } }] as const satisfies readonly import('@octane-xplat/ui').BreadcrumbItem[]
Breadcrumbs({ items: readonlyAncestors })
DropdownMenu({ items: [{ type: 'link', key: 'local', router: local, to: '/local' }] })
// @ts-expect-error Navigation strip arrays preserve required path fields.
NavigationMenu({ items: [{ key: 'coat', to: '/items/:id' }] })
// @ts-expect-error Composed links preserve required path fields.
SideNavItem({ label: 'Coat', to: '/items/:id' })
// @ts-expect-error Composed links cannot combine raw URLs and typed requests.
TopNavItem({ label: 'Coat', href: 'https://example.com', to: '/items/:id', params: { id: 'coat' } })
// @ts-expect-error Menu arrays preserve required path fields.
TopNavMenu({ label: 'Items', items: [{ title: 'Coat', to: '/items/:id' }] })
// @ts-expect-error Breadcrumb arrays reject invented patterns.
Breadcrumbs({ items: [{ label: 'Unknown', to: '/invented' }] })
// @ts-expect-error Nested menu links preserve their search contracts.
ContextMenu({ items: [{ type: 'submenu', key: 'nested', items: [{ type: 'link', key: 'coat', to: '/items/:id', params: { id: 'coat' }, search: { tab: 'invented' } }] }] })
// @ts-expect-error An explicit router cannot borrow ambient paths.
SideNavItem({ label: 'Wrong owner', router: local, to: '/items/:id', params: { id: 'coat' } })
// @ts-expect-error A link menu row needs a URL or destination.
DropdownMenuLink({ label: 'Missing target' })
// @ts-expect-error Navigation tabs preserve required path fields.
Tab({ value: 'coat', label: 'Coat', to: '/items/:id' })
// @ts-expect-error Heading menu links cannot invent local route contracts.
NavHeadingMenuItem({ label: 'Wrong owner', router: local, to: '/items/:id', params: { id: 'coat' } })
// @ts-expect-error Action rows do not acquire routing fields from link rows.
DropdownMenu({ items: [{ type: 'action', key: 'bad', to: '/items/:id', params: { id: 'coat' } }] })
const updateSearch = registeredApi.useUpdateSearch()
updateSearch({ tab: 'activity' })
updateSearch(previous => ({ tab: previous.tab }), { replace: false })
updateSearch({})
// @ts-expect-error Search edits use the route's declared input.
updateSearch({ tab: 'invented' })
// @ts-expect-error Functional search edits must be synchronous.
updateSearch(async previous => ({ tab: previous.tab }))
// @ts-expect-error Validated output is readonly in an updater.
updateSearch(previous => { previous.tab = 'activity'; return previous })
interface NamedSearch { tab: 'details' | 'activity'; page: number }
function namedSearch(raw: { tab?: unknown; page?: unknown }): NamedSearch {
  return { tab: raw.tab === 'activity' ? 'activity' : 'details', page: Number(raw.page ?? 1) }
}
const namedSearchRoute = defineRoute({ path: '/named-search', validateSearch: namedSearch, loader: ({ search }) => search.page })
namedSearchRoute.screen(({ search, data }) => {
  const output: NamedSearch = search
  const page: number = data
  // @ts-expect-error Validated output is an interface, not any or never.
  const impossible: never = search
  // @ts-expect-error Named output preserves the loader's inferred scalar.
  const text: string = data
  return null
})
const namedSearchRouter = createRouter({ catalog: defineRoutes([namedSearchRoute.screen(() => null)]), host: undefined as unknown as RouterHost })
namedSearchRouter.push({ to: '/named-search', search: { tab: 'activity', page: 2 } })
// @ts-expect-error Named interfaces retain their finite field values.
namedSearchRouter.push({ to: '/named-search', search: { tab: 'invented' } })
// @ts-expect-error Head callbacks no longer receive flat path values.
defineRoute({ path: '/old-head/:id', head: ({ id }) => ({ title: id }) })
const headed = defineRoute.withContext<{ session: string }>()({
 path: '/headed/:id',
 validateSearch: (raw: { tab?: unknown }) => ({ tab: String(raw.tab ?? 'details') }),
 beforeLoad: ({ context }) => ({ owner: context.session }),
 loader: async ({ params, search, context }) => ({ title: context.owner + params.id + search.tab }),
 head: ({ params, search, context, data }) => {
  const id: string = params.id
  const tab: string = search.tab
  const owner: string = context.owner
  const title: string = data.title
  // @ts-expect-error Head data is inferred from the awaited loader result.
  data.invented
  // @ts-expect-error Head receives structured inputs, not a flat params bag.
  const flat: string = params.missing
  return { title, meta: { id, tab, owner } }
 },
})
const authorityProps: import('@octane-xplat/ui').RouteOutletProps = {
 authority: 'account-a:2', resumeUrl: '/items/coat', onResume(result) { const status: string = result.status },
}
// @ts-expect-error Authority tokens must be stable scalar versions.
const invalidAuthorityProps: import('@octane-xplat/ui').RouteOutletProps = { authority: {} }
const publicGroup = defineRouteGroup({ id: 'library', loader: () => ({ title: 'Guides' }) })
publicGroup.group({ id: 'book', loader: ({ context }) => context.library.title })
const accountGroup = defineRouteGroup.withContext<{ session: { id: string } }>()({
 id: 'account', beforeLoad: ({ context }) => ({ owner: context.session.id }),
 loader: ({ context }) => ({ name: context.owner }),
})
const projectGroup = accountGroup.group({ id: 'project', loader: ({ context }) => ({ owner: context.account.name }) })
const grouped = projectGroup.route({ path: '/grouped', loader: ({ context }) => context.project.owner })
grouped.screen(({ context, data }) => { const name: string = context.account.name; const owner: string = data; return null })
const groupHost = undefined as unknown as RouterHost
createRouter({ catalog: defineRoutes([grouped.screen(() => null)]), host: groupHost, context: { session: { id: 'a' } } })
// @ts-expect-error Group additions must not replace the required root context.
createRouter({ catalog: defineRoutes([grouped.screen(() => null)]), host: groupHost })
// @ts-expect-error Child callbacks inherit precise parent data.
projectGroup.route({ path: '/bad-group', loader: ({ context }) => context.account.invented })
const namedSchema: import('@octane-xplat/ui/routing/core').RouteSearchSchema<{ tab?: 'details' | 'activity'; page?: number }, NamedSearch> = {
  '~standard': { version: 1, vendor: 'named', validate: () => ({ value: { tab: 'details', page: 1 } }) },
}
// @ts-expect-error Search input must be a field object, not an array.
withSearchDecoder({} as import('@octane-xplat/ui/routing/core').RouteSearchSchema<string[], NamedSearch>, () => [])
// @ts-expect-error A numeric input cannot bypass URL decoding.
defineRoute({ path: '/raw-named-schema', validateSearch: namedSchema })
const namedSchemaRoute = defineRoute({ path: '/named-schema', validateSearch: withSearchDecoder(namedSchema, raw => ({ tab: raw.tab === 'activity' ? 'activity' : 'details', page: Number(raw.page ?? 1) } as const)), loader: ({ search }) => search.page })
namedSchemaRoute.screen(({ search, data }) => { const output: NamedSearch = search; const page: number = data; return null })
const asyncNamedRoute = defineRoute({ path: '/named-async', validateSearch: async (raw: { page?: unknown }): Promise<NamedSearch> => namedSearch(raw), loader: ({ search }) => search.page })
asyncNamedRoute.screen(({ search, data }) => { const output: NamedSearch = search; const page: number = data; return null })
// @ts-expect-error Maps are collections, not search field bags.
defineRoute({ path: '/map-search', validateSearch: () => new Map() }).screen(() => null)
// @ts-expect-error Sets are collections, not search field bags.
defineRoute({ path: '/set-search', validateSearch: () => new Set() }).screen(() => null)
// @ts-expect-error Callable results do not establish search fields.
defineRoute({ path: '/function-search', validateSearch: () => () => null }).screen(() => null)
// @ts-expect-error RegExp results do not establish search fields.
defineRoute({ path: '/regexp-search', validateSearch: () => /query/ }).screen(() => null)
const flagSchema: import('@octane-xplat/ui/routing').RouteSearchSchema<{ flag: 'yes' | 'no' }, { flag: boolean }> = {
  '~standard': { version: 1, vendor: 'fixture', validate: () => ({ value: { flag: true } }) },
}
const scalarSchema: import('@octane-xplat/ui/routing').RouteSearchSchema<unknown, number> = {
  '~standard': { version: 1, vendor: 'fixture', validate: () => ({ value: 42 }) },
}
// @ts-expect-error An array is not a validated search record.
defineRoute({ path: '/array-search', validateSearch: () => [] }).screen(() => null)
// @ts-expect-error Async parser output follows the same record contract.
defineRoute({ path: '/async-array-search', validateSearch: async () => [] }).screen(() => null)
// @ts-expect-error A Date value is not a search field bag.
defineRoute({ path: '/date-search', validateSearch: () => new Date() }).screen(() => null)
// @ts-expect-error Standard Schema search output must be an object.
defineRoute({ path: '/scalar-schema', validateSearch: scalarSchema }).screen(() => null)
const callableScalarSchema = Object.assign(() => ({ flag: true }), scalarSchema)
// @ts-expect-error The ordinary object-returning call cannot hide scalar protocol output.
defineRoute({ path: '/callable-scalar-schema', validateSearch: callableScalarSchema }).screen(() => null)
const flagRouter = createRouter({ catalog: defineRoutes([defineRoute({ path: '/flag', validateSearch: flagSchema }).screen(() => null)]), host: undefined as unknown as RouterHost })
const callableFlagSchema = Object.assign((_input: Record<string, unknown>) => 'ordinary-call', flagSchema)
const callableFlagRouter = createRouter({
  catalog: defineRoutes([defineRoute({ path: '/callable-flag', validateSearch: callableFlagSchema }).screen(() => null)]),
  host: undefined as unknown as RouterHost,
})
const callableFlag: boolean = getRouteApi('/callable-flag', callableFlagRouter).useSearch().flag
getRouteApi('/callable-flag', callableFlagRouter).useUpdateSearch()({ flag: 'yes' })
// @ts-expect-error Callable schemas expose protocol output, not ordinary-call output.
const callableFlagText: string = getRouteApi('/callable-flag', callableFlagRouter).useSearch().flag
// @ts-expect-error Callable schemas also preserve protocol navigation input.
callableFlagRouter.push({ to: '/callable-flag', search: { flag: true } })
type CallableFile = import('@octane-xplat/ui/routing/core').FileRouteContract<'/callable-file', { validateSearch: typeof callableFlagSchema }>
declare const callableFile: import('@octane-xplat/ui/routing/core').RouteScreenProps<CallableFile>
const callableFileFlag: boolean = callableFile.search.flag
// @ts-expect-error Named-file contracts use the same protocol output precedence.
const callableFileText: string = callableFile.search.flag
const updateFlag = getRouteApi('/flag', flagRouter).useUpdateSearch()
updateFlag(previous => ({ flag: previous.flag ? 'yes' : 'no' }))
// @ts-expect-error Search output is not automatically a valid navigation input.
updateFlag(previous => previous)
// @ts-expect-error Required search input cannot be cleared with an empty object.
updateFlag({})
// @ts-expect-error Route accessors infer loader results instead of accepting arbitrary result generics.
registeredApi.useLoaderData().count
// @ts-expect-error Unknown route accessor names are rejected.
getRouteApi('/invented')
const localApi = getRouteApi('/local', local)
const localCount: number = localApi.useLoaderData().count
// @ts-expect-error An isolated accessor excludes ambient routes.
getRouteApi('/items/:id', local)
useRouter(local).push({ to: '/local' })
// @ts-expect-error Inferred explicit hooks exclude ambient destinations.
useRouter(local).push({ to: '/items/:id', params: { id: 'coat' } })
useRouter().push({ to: '/items/:id', params: { id: 'coat' } })
// @ts-expect-error Default hooks retain path requirements.
useRouter().push({ to: '/items/:id' })
RouterProvider({ router: local })
// @ts-expect-error Providers require a registered stack name.
RouterProvider({ router: local, stack: 'invented' })
// @ts-expect-error Default setup cannot change the DTO promised by generated registration.
configureRouter({ catalog: defineRoutes([defineRoute({ path: '/items/:id', loader: () => 31 }).screen(() => null)]) })
// @ts-expect-error A raw erased manifest cannot establish default registered contracts.
configureRouter({ catalog: undefined as unknown as import('@octane-xplat/ui/routing/core').RouteManifest })
const state = local.getSnapshot()
if (state.route?.contract === 'declared' && state.route.to === '/local') {
  const count: number = state.route.data.count
  // @ts-expect-error Declared aggregate output retains its exact DTO.
  state.route.data.invented
}
if (state.route) {
  // @ts-expect-error Aggregate reads include runtime contributions. Use a named accessor.
		const count: number = state.route.data.count
  // @ts-expect-error Emitted instance declarations preserve loader data.
  state.route.data.invented
}
defineRoute({ path: '/fetch', loader: ({ signal }) => fetch('/api/items', { signal }).then(() => 1) }).screen(() => null)
const NamedScreen = (_props: { data: { title: string }; params: { id: string } }) => null
const namedRoute = defineRoute.withContext<{ account: { id: string } }>()({
  path: '/named/:id',
  beforeLoad: ({ context }) => ({ owner: context.account.id }),
  loader: ({ params, context }) => ({ title: context.owner + params.id }),
}).screen(NamedScreen)
const named = createRouter({ catalog: defineRoutes([namedRoute]), host: undefined as unknown as RouterHost, context: { account: { id: 'a' } } })
const namedApi = getRouteApi('/named/:id', named)
const namedTitle: string = namedApi.useLoaderData().title
const namedOwner: string = namedApi.useContext().owner
// @ts-expect-error Emitted declarations preserve a named screen's inferred DTO.
namedApi.useLoaderData().count
// @ts-expect-error Inference must not broaden guard-added context.
namedApi.useContext().invented
const authorRoute = defineRoute.withContext<{ account: { id: string } }>()
// @ts-expect-error Context describes the resolved value; an async source is supplied to the router.
defineRoute.withContext<Promise<{ account: { id: string } }>>()
function LoginScreen(_props: { search: { returnTo: string }; data: undefined }) { return null }
const loginPreparation = authorRoute({
  path: '/staged-login',
  validateSearch(raw: { returnTo?: unknown }) { return { returnTo: String(raw.returnTo ?? '/') } },
})
const stagedLogin = loginPreparation.screen(LoginScreen)
// @ts-expect-error Builders expose an immutable attachment operation.
loginPreparation.screen = () => stagedLogin
// @ts-expect-error Finished definitions cannot have their components replaced.
stagedLogin.screen = LoginScreen
declare const namedProps: Parameters<typeof namedRoute.screen>[0]
// @ts-expect-error Reading a finished component retains its actual required path inputs.
namedRoute.screen({ ...namedProps, params: {} })
// @ts-expect-error Unfinished preparation cannot be registered as a route.
defineRoutes([loginPreparation])
// @ts-expect-error The flat screen option is removed, rather than retained as a fallback.
defineRoute({ path: '/old-flat-screen', screen: () => null })
// @ts-expect-error Data cannot be chosen without an actual loader.
defineRoute<'/forced-data', void, string>({ path: '/forced-data' }).screen(() => null)
// @ts-expect-error Guard-added context requires the actual guard.
authorRoute<'/forced-context', { owner: string }>({ path: '/forced-context' }).screen(() => null)
interface AddedOwner { owner: string }
function DetailScreen(props: import('@octane-xplat/ui/routing/core').RouteScreenProps<typeof detailPreparation>) {
  const page: number = props.data.page
  const owner: string = props.context.owner
  // @ts-expect-error Projecting preparation props cannot invent DTO fields.
  props.data.invented
  return null
}
const detailPreparation = authorRoute({
  path: '/staged-detail',
  async validateSearch(raw: { page?: unknown }) { return { page: Number(raw.page ?? 1) } },
  async beforeLoad({ context, search }): Promise<AddedOwner> {
    const page: number = search.page
    // @ts-expect-error Inferred search has no invented field.
    search.invented
    return { owner: context.account.id + page }
  },
  loader: ({ context, search }) => ({ owner: context.owner, page: search.page }),
})
const stagedDetail = detailPreparation.screen(DetailScreen)
declare const finishedProps: import('@octane-xplat/ui/routing/core').RouteScreenProps<typeof stagedDetail>
const finishedPage: number = finishedProps.data.page
// @ts-expect-error Finished definitions project the same precise DTO.
const finishedPageText: string = finishedProps.data.page
const stagedInline = authorRoute({
  path: '/staged-inline',
  validateSearch(raw: { page?: unknown }) { return { page: Number(raw.page ?? 1) } },
  loader: ({ search }) => ({ page: search.page }),
}).screen(({ search, data }) => {
  const page: number = search.page
  const dataPage: number = data.page
  // @ts-expect-error Screen search cannot become any or never.
  const textSearch: string = search
  // @ts-expect-error Screen data cannot become any or never.
  const textData: string = data
  // @ts-expect-error The inferred DTO has no invented field.
  data.invented
  return null
})
const reorderedPreparation = authorRoute({
  path: '/staged-reordered',
  loader: ({ search }) => {
    // @ts-expect-error A dependent callback before its parser has conservative input.
    const text: string = search.returnTo
    return search
  },
  validateSearch(raw: { returnTo?: unknown }) { return { returnTo: String(raw.returnTo ?? '/') } },
}).screen(({ data }) => {
  // @ts-expect-error A whole early-search DTO cannot become any or never.
  const text: string = data
  return null
})
function parsedPage(raw: { page?: unknown }) { return { page: Number(raw.page ?? 1) } }
const reorderedNamedParser = authorRoute({
  path: '/staged-named-parser',
  loader: ({ search }) => {
    const page: number = search.page
    return { page }
  },
  validateSearch: parsedPage,
}).screen((_props: { data: { page: number } }) => null)
defineRoute({ path: '/empty-search', loader: ({ search }) => {
  // @ts-expect-error Empty search is an empty object, not a never-valued dictionary.
  search.invented
  return 1
}}).screen(({ search }) => {
  // @ts-expect-error An empty screen search has no invented field.
  search.invented
  return null
})
// @ts-expect-error Named screens cannot change parser output.
authorRoute({ path: '/wrong-staged-search', validateSearch: parsedPage }).screen((_props: { search: { page: string } }) => null)
// @ts-expect-error Named screens cannot invent a loader DTO.
authorRoute({ path: '/wrong-staged-data', loader: () => ({ title: 'text' }) }).screen((_props: { data: { count: number } }) => null)
// @ts-expect-error Unknown output cannot satisfy a known component DTO.
authorRoute({ path: '/unknown-staged-data', loader: (): unknown => ({ title: 'text' }) }).screen((_props: { data: { title: string } }) => null)
// @ts-expect-error Promise<boolean> is not context merely because promises are objects.
authorRoute({ path: '/async-boolean-guard', beforeLoad: async () => false }).screen(() => null)
// @ts-expect-error Nested promises must also resolve to valid guard output.
authorRoute({ path: '/nested-boolean-guard', beforeLoad: (): Promise<Promise<boolean>> => { throw new Error('fixture') } }).screen(() => null)
const authoring = createRouter({
  catalog: defineRoutes([stagedLogin, stagedDetail, stagedInline, reorderedPreparation, reorderedNamedParser]),
  host: undefined as unknown as RouterHost, context: { account: { id: 'a' } },
})
authoring.push({ to: '/staged-detail', search: { page: 2 } })
authoring.push({ to: '/staged-named-parser', search: { page: 2 } })
const inferredPage: number = getRouteApi('/staged-detail', authoring).useLoaderData().page
const inferredOwner: string = getRouteApi('/staged-detail', authoring).useContext().owner
const undefinedLoginData: undefined = getRouteApi('/staged-login', authoring).useLoaderData()
// @ts-expect-error Loader DTOs remain precise after screen attachment.
const pageText: string = getRouteApi('/staged-detail', authoring).useLoaderData().page
// @ts-expect-error Captured uncertainty must not turn a whole DTO into any or never.
const reorderedText: string = getRouteApi('/staged-reordered', authoring).useLoaderData()
// @ts-expect-error The completed contract preserves validated search values.
authoring.push({ to: '/staged-detail', search: { page: 'two' } })
const account = defineRoute.withContext<{ account: { id: string } }>()({ path: '/account' }).screen(() => null)
const accountCatalog = defineRoutes([account])
createRouter({ catalog: accountCatalog, host: undefined as unknown as RouterHost, context: { account: { id: 'a' } } })
// @ts-expect-error Consumers must supply required root context dependencies.
createRouter({ catalog: accountCatalog, host: undefined as unknown as RouterHost })
`,
		)

		const compiler = join(root, 'node_modules/typescript/bin/tsc')
		await writeFile(join(fixture, 'literal-diagnostic.mts'), `
import { defineRoutes } from '@octane-xplat/ui/routing/core'
import type { RouteSpec, ContractsOf, DestinationFor } from '@octane-xplat/ui/routing/core'
const screen = () => null
const widened: RouteSpec = { path: '/literal/:id', screen }
defineRoutes({ routes: [widened] })
const literal = { path: '/literal/:id', screen } as const satisfies RouteSpec
const repaired = defineRoutes({ routes: [literal] })
const destination: DestinationFor<ContractsOf<typeof repaired>> = { to: '/literal/:id', params: { id: 'coat' } }
// @ts-expect-error Preserving the literal also preserves its required parameter.
const missing: DestinationFor<ContractsOf<typeof repaired>> = { to: '/literal/:id' }
// @ts-expect-error Catalog options do not gain an open property index.
defineRoutes({ routes: [literal], invented: true })
type BakedSpecs = readonly [{ path: '/baked'; dataMode: 'baked'; screen: typeof screen }]
// @ts-expect-error An explicit generic cannot invent absent baked data.
defineRoutes<BakedSpecs, { baked: { title: string } }>({ routes: [{ path: '/baked', dataMode: 'baked', screen }] })

void [destination, missing]
`)
		const literalDiagnostic = spawnSync(process.execPath, [compiler, '--strict', '--noEmit', '--skipLibCheck', '--target', 'ES2020', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--types', 'node', join(fixture, 'literal-diagnostic.mts')], { cwd: root, encoding: 'utf8' })
		expect(literalDiagnostic.error).toBeUndefined()
		expect(literalDiagnostic.status).toBe(2)
		const diagnostic = literalDiagnostic.stdout + literalDiagnostic.stderr
		expect(diagnostic.match(/error TS\d+/g), diagnostic).toHaveLength(1)
		expect(diagnostic).toContain('Preserve literal paths with as const')
		expect(diagnostic.indexOf('Preserve literal paths with as const')).toBeLessThan(diagnostic.indexOf("Property 'baked' is missing"))
		const result = spawnSync(
			process.execPath,
			[
				compiler,
				'--strict',
				'--noEmit',
				'--skipLibCheck',
				'--target',
				'ES2020',
				'--module',
				'NodeNext',
				'--moduleResolution',
				'NodeNext',
				'--jsx',
				'preserve',
				'--types',
				'node',
				join(fixture, 'consumer.mts'),
			],
			{ cwd: root, encoding: 'utf8' },
		)

		expect(result.error).toBeUndefined()
		expect(result.status, result.stdout + result.stderr).toBe(0)
		await writeFile(
			join(fixture, 'web.json'),
			JSON.stringify({
				compilerOptions: {
					strict: true,
					noEmit: true,
					skipLibCheck: true,
					target: 'ES2020',
					module: 'NodeNext',
					moduleResolution: 'NodeNext',
					jsx: 'preserve',
					types: ['node'],
					customConditions: ['web'],
					moduleSuffixes: ['.web', ''],
				},
				files: ['consumer.mts'],
			}),
		)

		const web = spawnSync(process.execPath, [compiler, '-p', join(fixture, 'web.json')], {
			cwd: root,
			encoding: 'utf8',
		})

		expect(web.error).toBeUndefined()
		expect(web.status, web.stdout + web.stderr).toBe(0)
		for (const condition of ['native', 'macos', 'linux', 'windows']) {
			await writeFile(join(fixture, condition + '.json'), JSON.stringify({
				compilerOptions: {
					strict: true, noEmit: true, skipLibCheck: true, target: 'ES2020',
					module: 'NodeNext', moduleResolution: 'NodeNext', jsx: 'preserve',
					types: ['node'], customConditions: [condition], moduleSuffixes: ['.' + condition, ''],
				},
				files: ['consumer.mts'],
			}))
			const checked = spawnSync(process.execPath, [compiler, '-p', join(fixture, condition + '.json')], {
				cwd: root, encoding: 'utf8',
			})
			expect(checked.error).toBeUndefined()
			expect(checked.status, condition + ': ' + checked.stdout + checked.stderr).toBe(0)
		}
		await writeFile(
			join(fixture, 'consumer.native.mts'),
			`
import { defineRoute, defineRoutes, createRouter, defineTransitions } from '@octane-xplat/ui/routing/core'
import type { RouterHost } from '@octane-xplat/ui/routing/core'
import { defineNativeTransition } from '@octane-xplat/ui/nativescript'
import { useRouter } from '@octane-xplat/ui/routing'
import { NavLink } from '@octane-xplat/ui'
const detail = defineNativeTransition({ page: ({ to }) => {
  const id: string | undefined = to.params.id
  return { name: 'fade', duration: 120 }
} })
const nativeRouter = createRouter({
  catalog: defineRoutes([defineRoute({ path: '/native/:id' }).screen(() => null)]),
  host: undefined as unknown as RouterHost,
  transitions: defineTransitions({ detail }),
})
nativeRouter.push({ to: '/native/:id', params: { id: 'coat' }, transition: 'detail' })
useRouter(nativeRouter).push({ to: '/native/:id', params: { id: 'coat' }, transition: 'detail' })
NavLink({ router: nativeRouter, to: '/native/:id', params: { id: 'coat' }, transition: 'detail' })
// @ts-expect-error Native callbacks remain synchronous engine factories.
defineNativeTransition({ page: async () => ({ name: 'fade' }) })
// @ts-expect-error A native factory receives creation context; reversal belongs to the engine.
defineNativeTransition({ page: ({ direction }) => ({ name: 'fade' }) })
// @ts-expect-error Native instances keep required path fields.
nativeRouter.push({ to: '/native/:id', transition: 'detail' })
// @ts-expect-error Native instances retain finite custom effect names.
nativeRouter.push({ to: '/native/:id', params: { id: 'coat' }, transition: 'invented' })
`,
		)

		const native = spawnSync(
			process.execPath,
			[
				compiler,
				'--strict',
				'--noEmit',
				'--skipLibCheck',
				'--target',
				'ES2020',
				'--module',
				'NodeNext',
				'--moduleResolution',
				'NodeNext',
				'--customConditions',
				'native',
				'--types',
				'node',
				join(fixture, 'consumer.native.mts'),
			],
			{ cwd: root, encoding: 'utf8' },
		)

		expect(native.error).toBeUndefined()
		expect(native.status, native.stdout + native.stderr).toBe(0)
		await writeFile(join(fixture, 'consumer.macos.mts'), `
import { defineAppKitTransition } from '@octane-xplat/ui/macos'
import { createRouter, defineRoute, defineRoutes, defineTransitions } from '@octane-xplat/ui/routing/core'
import type { RouterHost } from '@octane-xplat/ui/routing/core'
const effect = defineAppKitTransition({ from: ({ direction, action, from, to }) => ({ opacity: 0, translateX: direction === 'back' ? -24 : 24 }), duration: 240 })
const routes = defineRoutes([defineRoute({ path: '/appkit/:id' }).screen(() => null)])
const navigation = createRouter({ catalog: routes, host: undefined as unknown as RouterHost, transitions: defineTransitions({ detail: effect }) })
navigation.push({ to: '/appkit/:id', params: { id: 'coat' }, transition: 'detail' })
// @ts-expect-error AppKit values are numeric.
defineAppKitTransition({ from: { opacity: 'transparent' } })
// @ts-expect-error Unknown starting properties are rejected.
defineAppKitTransition({ from: { translateZ: 24 } })
// @ts-expect-error Callbacks receive typed directions.
defineAppKitTransition({ from: ({ direction }) => ({ translateX: direction === 'sideways' ? 1 : 0 }) })
// @ts-expect-error AppKit starting values are synchronous.
defineAppKitTransition({ from: async () => ({ opacity: 0 }) })
// @ts-expect-error Duration is milliseconds.
defineAppKitTransition({ from: {}, duration: 'fast' })
// @ts-expect-error Finite registry names apply equally to AppKit.
navigation.push({ to: '/appkit/:id', params: { id: 'coat' }, transition: 'invented' })
`)
		const macos = spawnSync(process.execPath, [compiler, '--strict', '--noEmit', '--skipLibCheck', '--target', 'ES2022', '--module', 'NodeNext', '--moduleResolution', 'NodeNext', '--customConditions', 'macos', '--types', 'node', join(fixture, 'consumer.macos.mts')], { cwd: root, encoding: 'utf8' })
		expect(macos.error).toBeUndefined()
		expect(macos.status, macos.stdout + macos.stderr).toBe(0)

	} finally {
		await rm(fixture, { recursive: true, force: true })
	}
}, 120_000)
