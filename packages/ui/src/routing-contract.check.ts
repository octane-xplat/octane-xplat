import { defineRoute, withSearchDecoder } from './define-route'
import { defineRoutes, mergeRouteManifests } from './route-table'
import { createRouter } from './router-instance'
import type {
	ContractsOf,
	DestinationFor,
	RouteMatchFor,
	RouteSearchSchema,
	RouterHost,
} from './props'

// Compile-time regression fixtures. Never executed or imported by the runtime.
function checkRouteContracts() {
	const item = defineRoute({
		path: '/items/:id',
		validateSearch(raw: { tab?: unknown; page?: unknown }) {
			const tab = raw.tab ?? 'details'
			if (tab !== 'details' && tab !== 'activity') {
				throw new Error('Invalid tab')
			}
			return { tab, page: Number(raw.page ?? 1) } as const
		},
		loader: ({ params, search }) => ({ title: params.id, page: search.page }),
	}).screen(function screen(props) {
		const title: string = props.data.title
		const page: number = props.search.page
		const id: string = props.params.id
		void [title, page, id]
		// @ts-expect-error Screen data comes from the loader, not a caller-supplied shape.
		void props.data.invented
		return null
	})
	defineRoute({
		path: '/broken',
		loader: () => ({ title: 'ok' }),
	}).screen(
		// @ts-expect-error A screen cannot invent a loader data contract.
		(_props: { data: { count: number } }) => null,
	)
	const settings = defineRoute({ path: '/settings' }).screen(() => null)
	defineRoute({
		path: '/fetch',
		loader: ({ signal }) => fetch('/api/items', { signal }).then(() => ({ ok: true })),
	}).screen(() => null)
	const optional = defineRoute({ path: '/[[locale]]/help' }).screen(() => null)
	const catalog = defineRoutes([item, settings, optional])
	type Destination = DestinationFor<ContractsOf<typeof catalog>>
	const navigate = (_destination: Destination) => undefined
	navigate({ to: '/items/:id', params: { id: 'coat' } })
	navigate({ to: '/items/:id', params: { id: 'coat' }, search: { tab: 'activity', page: 2 } })
	navigate({ to: '/settings' })
	navigate({ to: '/:locale?/help' })
	// @ts-expect-error Destination spelling is checked.
	navigate({ to: '/itmes' })
	// @ts-expect-error Required path params cannot be omitted.
	navigate({ to: '/items/:id' })
	// @ts-expect-error Static destinations cannot take arbitrary params.
	navigate({ to: '/settings', params: { invented: true } })
	// @ts-expect-error Query fields must be declared.
	navigate({ to: '/items/:id', params: { id: 'coat' }, search: { invented: true } })
	// @ts-expect-error Search value must satisfy the declared enum.
	navigate({ to: '/items/:id', params: { id: 'coat' }, search: { tab: 'invented' } })
	// @ts-expect-error Numeric search fields do not accept arbitrary text.
	navigate({ to: '/items/:id', params: { id: 'coat' }, search: { page: 'bad' } })
	// @ts-expect-error Path and search values retain their declared types.
	navigate({ to: '/items/:id', params: { id: 3 } })
	// @ts-expect-error Prepared state is not destination input.
	navigate({ to: '/settings', loaderData: 'injected' })
	// @ts-expect-error Flow names must be declared.
	navigate({ to: '/settings', stack: 'invented' })
	// @ts-expect-error Transition names must be built-in or registered.
	navigate({ to: '/settings', transition: 'invented' })

	interface AccountContext {
		account: { id: string }
	}
	const withAccount = defineRoute.withContext<AccountContext>()
	const accountRoute = withAccount({
		path: '/account',
		beforeLoad: ({ context }) => ({ owner: context.account.id }),
		loader: ({ context }) => {
			const owner: string = context.owner
			return { owner }
		},
	}).screen((props) => {
		const owner: string = props.data.owner
		void owner
		return null
	})
	const NamedAccountScreen = (_props: { data: { title: string }; params: { id: string } }) => null
	const namedAccount = withAccount({
		path: '/named/:id',
		beforeLoad: () => ({ checked: true }),
		loader: ({ params, context }) => {
			const checked: boolean = context.checked
			return { title: context.account.id + params.id + checked }
		},
	}).screen(NamedAccountScreen)
	withAccount({
		path: '/named-context/:id',
		beforeLoad: ({ context }) => ({ owner: context.account.id }),
		loader: ({ params, context }) => {
			const owner: string = context.owner
			// @ts-expect-error A separately declared screen must not widen guard context.
			void context.invented
			return { title: owner + params.id }
		},
	}).screen(NamedAccountScreen)
	withAccount({
		path: '/named-search/:id',
		validateSearch: (raw: { page?: unknown }) => ({ page: Number(raw.page ?? 1) }),
		beforeLoad: ({ context, search }) => ({ owner: context.account.id + search.page }),
		loader: async ({ params, context }) => ({ title: context.owner + params.id }),
	}).screen(NamedAccountScreen)
	defineRoute({ path: '/unknown-data', loader: (): unknown => ({ title: 'untrusted' }) }).screen(
		// @ts-expect-error Unknown loader output cannot satisfy a named screen's DTO contract.
		(_props: { data: { title: string } }) => null,
	)
	const noLoader = defineRoute({ path: '/without-loader' }).screen(() => null)
	const noLoaderCatalog = defineRoutes([noLoader])
	type WithoutData = ContractsOf<typeof noLoaderCatalog>['/without-loader']['data']
	const emptyData: WithoutData = undefined
	// @ts-expect-error Required-loader inference defaults must not leak into loader-free routes.
	const inventedData: WithoutData = 'invented'
	void [emptyData, inventedData]
	const namedCatalog = defineRoutes([namedAccount])
	const namedRouter = createRouter({
		catalog: namedCatalog,
		host: undefined as unknown as RouterHost,
		context: { account: { id: 'a' } },
	})
	const namedMatch = namedRouter.getSnapshot().route
	if (namedMatch) {
		// @ts-expect-error Aggregate state may contain runtime data. Use a named accessor for an inferred DTO.
		const title: string = namedMatch.data.title
		// @ts-expect-error Capturing a loader function must not widen its return type.
		void namedMatch.data.count
		void title
	}
	const accountCatalog = defineRoutes([accountRoute])
	const accountHost = undefined as unknown as RouterHost
	createRouter({ catalog: accountCatalog, host: accountHost, context: { account: { id: 'a' } } })
	// @ts-expect-error A typed root context must be supplied to its instance.
	createRouter({ catalog: accountCatalog, host: accountHost })
	// @ts-expect-error Root services/account fields retain their inferred types.
	createRouter({ catalog: accountCatalog, host: accountHost, context: { account: { id: 3 } } })
	defineRoute
		.withContext<{ status: number }>()({
			path: '/shadow',
			beforeLoad: () => ({ status: 'ready' as const }),
			loader: ({ context }) => {
				const status: 'ready' = context.status
				// @ts-expect-error Guard context shadows the root value; it is not an impossible intersection.
				const wrong: number = context.status
				void wrong
				return status
			},
		})
		.screen(() => null)

	const schema: RouteSearchSchema<{ page?: number }, { page: number }> = {
		'~standard': { version: 1, vendor: 'fixture', validate: () => ({ value: { page: 1 } }) },
	}
	// @ts-expect-error Number-only schemas need an explicit decoder for URL strings.
	defineRoute({ path: '/raw-number', validateSearch: schema })
	// @ts-expect-error Parser arguments also receive URL strings.
	defineRoute({ path: '/raw-parser', validateSearch: (raw: { page: number }) => raw })
	const paged = defineRoute({
		path: '/pages',
		validateSearch: withSearchDecoder(schema, raw => ({ page: Number(raw.page ?? 1) })),
		loader: ({ search }) => search.page,
	}).screen((props) => {
		const page: number = props.data
		void page
		return null
	})
	const navigatePage = (_value: DestinationFor<ContractsOf<typeof paged>>) => undefined
	navigatePage({ to: '/pages' })
	navigatePage({ to: '/pages', search: { page: 2 } })
	// @ts-expect-error Schema navigation input is independent of its parsed output.
	navigatePage({ to: '/pages', search: { page: 'not-a-number' } })

	const host = undefined as unknown as RouterHost
	const router = createRouter({ catalog, host })
	router.push({ to: '/items/:id', params: { id: 'coat' } })
	// @ts-expect-error Explicit instances infer their own catalog, without ambient routes.
	router.push({ to: '/invented' })
	// @ts-expect-error An owned navigator does not broaden required path params.
	router.replace({ to: '/items/:id' })
	// @ts-expect-error Root-only instances reject undeclared stack names.
	router.forStack('invented')
	const state = router.getSnapshot()
	if (state.route?.to === '/items/:id') {
		// @ts-expect-error Aggregate reads include runtime contributions. Use a named accessor.
		const title: string = state.route.data.title
		// @ts-expect-error The match discriminant narrows loader output.
		void state.route.data.invented
		void title
	}
	const first = defineRoutes([defineRoute({ path: '/same', loader: () => 1 }).screen(() => null)])
	const second = defineRoutes([
		defineRoute({ path: '/same', loader: () => 'last' }).screen(() => null),
	])
	const composed = mergeRouteManifests(first, second)
	type LastData = RouteMatchFor<ContractsOf<typeof composed>, '/same'>['data']
	const lastData: LastData = 'last'
	// @ts-expect-error Startup precedence infers the later contract, independent of aggregate runtime state.
	const firstData: LastData = 1
	void [lastData, firstData]
	const merged = createRouter({ catalog: composed, host })
	const current = merged.getSnapshot().route
	if (current) {
		// @ts-expect-error Aggregate data stays unknown even with a single declared route.
		const last: string = current.data
		// @ts-expect-error Later registration replaces the earlier contract, matching runtime.
		const wrong: number = current.data
		void [last, wrong]
	}
	const unordered: Array<typeof first | typeof second> = [first, second]
	const uncertain = createRouter({ catalog: mergeRouteManifests(...unordered), host }).getSnapshot()
		.route
	if (uncertain) {
		// @ts-expect-error Aggregate data can also come from runtime registrations.
		const data: string | number = uncertain.data
		// @ts-expect-error Unknown registration order cannot promise the last data type.
		const assumed: string = uncertain.data
		void [data, assumed]
	}
}

void checkRouteContracts
