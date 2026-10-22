// Renderer-neutral qualification on actual Frame/modal and retained AppKit hosts.
import { createContext, useContext, useLayoutEffect, useMemo, useState } from 'octane'
import { Text } from '../src/Text'
import { View } from '../src/View'
import { ClientRouteOutlet } from '../src/ClientRouteOutlet.tsrx'
import { createRouter } from '../src/router-instance'
import { defineRoute } from '../src/define-route'
import { defineRoutes } from '../src/route-table'
import { DestinationRedirect } from '../src/routing-core'
import { useRouter } from '../src/router-hooks.tsrx'
import type {
	ClientRouterHost,
	ContractsOf,
	Renderable,
	RouteScreenProps,
	RouterInstance,
	RouterNavigator,
} from '../src/props'

type Account = { id: string }
type DriveOperation = <Value>(operation: Promise<Value>) => Promise<Value>
type SignInResult = { kind: 'success'; account: Account } | { kind: 'expired' }
type Loaded = { account: string; id: string }
type Context = {
	account: Account | null
	items: { load(account: string, id: string): Loaded | Promise<Loaded> }
}

interface LoginSearch {
	returnTo: string
}

const route = defineRoute.withContext<Context>()
const login = route({
	path: '/auth-login',
	transition: 'none',
	validateSearch(raw: { returnTo?: unknown }): LoginSearch {
		return { returnTo: typeof raw.returnTo === 'string' ? raw.returnTo : '/auth-home' }
	},
})

const privateItem = route({
	path: '/auth-private/:id',
	transition: 'none',
	beforeLoad({ context, params }) {
		if (!context.account) {
			throw new DestinationRedirect({
				to: '/auth-login',
				search: { returnTo: '/auth-private/' + encodeURIComponent(params.id) },
			})
		}

		return { account: context.account }
	},
	loader: ({ context, params }) => context.items.load(context.account.id, params.id),
})

type Contracts = ContractsOf<typeof catalog>
type LoginActions = {
	active: boolean
	status: string
	navigation: RouterNavigator<Contracts>
	signIn(): number
	cancel(): Promise<void>
}

type PrivateEntry = { data: Loaded; view: unknown }
interface FixtureState {
	readonly host: ClientRouterHost
	readonly navigation: RouterInstance<Contracts>
	readonly logins: Set<LoginActions>
	readonly entries: Set<PrivateEntry>
	readonly outcomes: string[]
	readonly returned: string[]
	readonly cancelled: string[]
	readonly loaded: Loaded[]
	authority(): number
	account(): Account | null
	pending(resolve: (result: SignInResult) => void): number
	complete(index: number, result: SignInResult): void
	changeSession(account: Account | null, returnTo?: string): void
	bindOwner(update: (version: number, returnTo?: string) => void): void
	holdNextLoad(): { started: boolean; release(): void }
	ownerReady: number
}

const Fixture = createContext<FixtureState | null>(null)
const Provider: any = Fixture
function useFixture(): FixtureState {
	const fixture = useContext(Fixture)
	if (!fixture) {
		throw new Error('Missing native auth fixture')
	}

	return fixture
}

function Home(): any {
	return <Text id="native-auth-home">Public home</Text>
}

function Login(props: RouteScreenProps<typeof login>): any {
	const fixture = useFixture()
	const navigation = useRouter(fixture.navigation)
	const [message, setMessage] = useState('ready')
	const lifetime = useMemo(() => ({ active: true, attempt: 0 }), [])
	const actions = useMemo<LoginActions>(
		() => ({ active: true, status: 'ready', navigation, signIn: () => -1, cancel: async () => {} }),
		[],
	)

	actions.status = message
	actions.signIn = () => {
		const attempt = ++lifetime.attempt
		const authority = fixture.authority()
		setMessage('pending')
		let index = -1
		const sdk = new Promise<SignInResult>((resolve) => {
			index = fixture.pending(resolve)
		})

		void sdk.then((result) => {
			if (!lifetime.active || lifetime.attempt !== attempt || fixture.authority() !== authority) {
				fixture.outcomes.push('cancelled')
				return
			}

			if (result.kind === 'expired') {
				setMessage('expired')
				fixture.outcomes.push('expired')
				return
			}

			fixture.outcomes.push('success')
			fixture.changeSession(result.account, props.search.returnTo)
		})

		return index
	}

	actions.cancel = async () => {
		const result = navigation.getSnapshot().modal
			? await navigation.dismiss()
			: await navigation.replace({ to: '/auth-home' })

		fixture.cancelled.push(result.status)
	}

	useLayoutEffect(() => {
		fixture.logins.add(actions)
		return () => {
			lifetime.active = false
			lifetime.attempt++
			actions.active = false
			fixture.logins.delete(actions)
		}
	}, [])

	return <Text id="native-auth-status">{message}</Text>
}

function Private(props: RouteScreenProps<typeof privateItem>): any {
	const fixture = useFixture()
	const entry = useMemo<PrivateEntry>(() => ({ data: props.data, view: null }), [])
	entry.data = props.data
	useLayoutEffect(() => {
		fixture.entries.add(entry)
		return () => {
			fixture.entries.delete(entry)
		}
	}, [])

	return (
		<View
			ref={(view) => {
				entry.view = view
			}}
		>
			<Text>{props.data.account + ':' + props.data.id}</Text>
		</View>
	)
}

const catalog = defineRoutes([
	route({ path: '/auth-home', transition: 'none' }).screen(Home),
	login.screen(Login),
	privateItem.screen(Private),
])

function Owner(props: { authority: number; returnTo?: string }): any {
	const fixture = useFixture()
	useLayoutEffect(() => { fixture.ownerReady = props.authority }, [props.authority])
	return (
		<ClientRouteOutlet host={fixture.host} authority={props.authority} resumeUrl={props.returnTo}
			onResume={result => fixture.returned.push(result.status)}>
			<Text id="native-auth-base">Account owner</Text>
		</ClientRouteOutlet>
	)
}

export function NativeAuthenticationExample(props: { fixture: FixtureState }): any {
	const [state, setState] = useState<{ version: number; returnTo?: string }>({ version: 0 })
	props.fixture.bindOwner((version, returnTo) => setState({ version, returnTo }))
	return (
		<Provider value={props.fixture}>
			<Owner authority={state.version} returnTo={state.returnTo} />
		</Provider>
	)
}

function createFixture(host: ClientRouterHost): FixtureState {
	let account: Account | null = null
	let authority = 0
	let updateOwner = (_version: number, _returnTo?: string) => {}
	const completions: ((result: SignInResult) => void)[] = []
	const loaded: Loaded[] = []
	let held: { state: { started: boolean; release(): void }; promise: Promise<void> } | undefined
	const navigation = createRouter({
		catalog,
		host: host.host,
		context: () => ({
			account: account ? { ...account } : null,
			items: {
				load(account: string, id: string) {
					const data = { account, id }
					loaded.push(data)
					const gate = held
					if (gate) {
						held = undefined
						gate.state.started = true
						return gate.promise.then(() => data)
					}

					return data
				},
			},
		}),
	})

	host.attach(navigation)
	return {
		host,
		navigation,
		loaded,
		logins: new Set(),
		entries: new Set(),
		outcomes: [],
		returned: [],
		cancelled: [],
		ownerReady: -1,
		authority: () => authority,
		account: () => account,
		pending(resolve) {
			completions.push(resolve)
			return completions.length - 1
		},
		complete(index, result) {
			if (!completions[index]) {
				throw new Error('Missing controlled sign-in attempt')
			}

			completions[index](result)
		},
		holdNextLoad() {
			let release!: () => void
			const promise = new Promise<void>((resolve) => {
				release = resolve
			})

			const state = { started: false, release }
			held = { state, promise }
			return state
		},
		bindOwner(update) {
			updateOwner = update
		},
		changeSession(next, returnTo) {
			account = next
			authority++
			updateOwner(authority, returnTo)
		},
	}
}

/** SDK callbacks are controlled. The adapters supply real renderer and surface receipts. */
export async function qualifyNativeAuthentication(options: {
	host: ClientRouterHost
	run?: DriveOperation
	mount(
		component: (props: { fixture: FixtureState }) => Renderable,
		props: { fixture: FixtureState },
	): () => void
	modals(): number
	check(name: string, pass: boolean): void
	wait(name: string, predicate: () => boolean): Promise<void>
	settled(): Promise<void>
}) {
	function drive<T>(operation: Promise<T>): Promise<T> {
		return options.run ? options.run(operation) : operation
	}

	const fixture = createFixture(options.host)
	const unmount = options.mount(NativeAuthenticationExample, { fixture })
	const check = (name: string, pass: boolean) => options.check('native auth: ' + name, pass)
	const wait = (name: string, predicate: () => boolean) =>
		options.wait('native auth: ' + name, predicate)

	const currentLogin = () => [...fixture.logins].filter((entry) => entry.active).at(-1)!
	const replaceOwner = async (account: Account | null) => {
		fixture.changeSession(account)
		await wait('replacement owner mounted', () => fixture.ownerReady === fixture.authority())
		await options.settled()
	}

	try {
		await wait('initial owner mounted', () => fixture.ownerReady === 0)
		const direct = await drive(
			fixture.navigation.navigateUrl('/auth-private/coat', {
				replace: true,
			}),
		)

		check(
			'private entry redirects before loading',
			direct.status === 'committed' && direct.redirected && fixture.loaded.length === 0,
		)

		await wait('login rendered', () => !!currentLogin())
		const first = currentLogin().signIn()
		fixture.complete(first, { kind: 'expired' })
		await wait('expired sign-in rendered', () => currentLogin()?.status === 'expired')
		check(
			'expiry retains login without authority',
			fixture.account() === null && fixture.loaded.length === 0,
		)

		const second = currentLogin().signIn()
		fixture.complete(second, { kind: 'success', account: { id: 'account-a' } })
		await wait('replacement owner completes return', () => fixture.returned.at(-1) === 'committed')
		check(
			'return prepares once with the new account',
			fixture.loaded.length === 1 &&
				fixture.loaded[0].account === 'account-a' &&
				fixture.loaded[0].id === 'coat',
		)

		check('ended login scope is released', fixture.logins.size === 0)
		const coat = [...fixture.entries][0]
		check('private view rendered', !!coat?.view && coat.data.account === 'account-a')
		check(
			'warm private URL commits',
			(await drive(fixture.navigation.navigateUrl('/auth-private/boots', {}))).status ===
				'committed',
		)

		check(
			'warm URL uses current account',
			fixture.loaded.length === 2 && fixture.loaded.at(-1)?.account === 'account-a',
		)

		await replaceOwner(null)
		await wait('private views removed on expiry', () => fixture.entries.size === 0)
		check(
			'expired account discards routed views and history',
			!coat.view &&
				fixture.navigation.getSnapshot().route === null &&
				!fixture.navigation.getSnapshot().canGoBack,
		)

		check('application-owned load records remain', fixture.loaded.length === 2)
		check(
			'fresh private URL denies expired account',
			(
				await drive(
					fixture.navigation.navigateUrl('/auth-private/boots', {
						replace: true,
					}),
				)
			).status === 'committed' &&
				fixture.loaded.length === 2 &&
				fixture.navigation.getSnapshot().route?.to === '/auth-login',
		)

		await replaceOwner(null)
		await drive(fixture.navigation.push({ to: '/auth-home' }))
		await drive(
			fixture.navigation.push({
				to: '/auth-login',
				search: { returnTo: '/auth-private/coat' },
				presentation: 'modal',
			}),
		)

		await wait('modal login rendered', () => options.modals() === 1 && !!currentLogin())
		const modalLogin = currentLogin()
		const late = modalLogin.signIn()
		await drive(modalLogin.cancel())
		await wait(
			'modal cancellation closes its owner',
			() => options.modals() === 0 && !modalLogin.active,
		)

		fixture.complete(late, { kind: 'success', account: { id: 'account-a' } })
		await wait('late SDK result ignored', () => fixture.outcomes.at(-1) === 'cancelled')
		check(
			'cancelled SDK result cannot reopen private content',
			fixture.account() === null && fixture.entries.size === 0 && fixture.loaded.length === 2,
		)

		check('cancel keeps its presenter', fixture.navigation.getSnapshot().route?.to === '/auth-home')

		await drive(
			fixture.navigation.push({
				to: '/auth-login',
				search: { returnTo: '/auth-private/coat' },
				presentation: 'modal',
			}),
		)

		await wait('next modal rendered', () => options.modals() === 1 && !!currentLogin())
		const accepted = currentLogin()
		const successful = accepted.signIn()
		const returned = fixture.returned.length
		fixture.complete(successful, { kind: 'success', account: { id: 'account-a' } })
		await wait(
			'modal return completes in replacement owner',
			() => fixture.returned.length === returned + 1,
		)

		check(
			'modal success ends its old scope',
			!accepted.active && options.modals() === 0 && fixture.returned.at(-1) === 'committed',
		)

		check(
			'modal return loads once',
			fixture.loaded.length === 3 &&
				fixture.loaded.at(-1)?.id === 'coat' &&
				fixture.loaded.at(-1)?.account === 'account-a',
		)

		await replaceOwner({ id: 'account-a' })
		await drive(fixture.navigation.push({ to: '/auth-login' }))
		await wait('root login rendered again', () => !!currentLogin())
		const retiring = currentLogin().navigation
		const held = fixture.holdNextLoad()
		const returning = retiring.navigateUrl('/auth-private/coat', { replace: true })
		await wait('retiring return starts loading', () => held.started)
		await replaceOwner({ id: 'account-b' })
		check(
			'work started by the retiring owner is cancelled',
			(await drive(returning)).status === 'cancelled',
		)

		held.release()
		check(
			'retired work cannot restore a private view',
			fixture.entries.size === 0 && fixture.navigation.getSnapshot().route === null,
		)

		check(
			'replacement can request its own return',
			(await drive(fixture.navigation.navigateUrl('/auth-private/coat', { replace: true })))
				.status === 'committed' && fixture.loaded.at(-1)?.account === 'account-b',
		)

		await replaceOwner(null)
		await drive(fixture.navigation.push({ to: '/auth-login' }))
		const invalid = await drive(
			fixture.navigation.navigateUrl('/auth-private/%ZZ', { replace: true }),
		)

		check(
			'invalid return preserves login',
			invalid.status === 'invalid-input' &&
				fixture.navigation.getSnapshot().route?.to === '/auth-login',
		)
	} finally {
		unmount()
		fixture.navigation.dispose()
		await options.settled()
	}
}
