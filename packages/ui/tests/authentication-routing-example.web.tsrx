/** @jsxImportSource @octane-xplat/jsx/dom */
// Controlled SDK promises and real router owners; no authentication provider traffic.
import { createRoot, flushSync, useLayoutEffect, useMemo, useState } from 'octane'
import { createRouter } from '../src/routing/router-instance'
import { createBrowserRouterHost } from '../src/routing/browser-router-host.web'
import { ClientRouteOutlet } from '../src/routing/ClientRouteOutlet.web.tsrx'
import { defineRoute } from '../src/routing/define-route'
import { defineRoutes } from '../src/routing/route-table'
import { DestinationRedirect } from '../src/routing/routing-core'
import { useRouter } from '../src/routing/router-hooks.tsrx'
import type { Renderable } from '../src/props'

type Account = { id: string }
type SignInResult = { kind: 'success'; account: Account } | { kind: 'expired' }

export async function createAuthenticationExample(
	batch: (update: () => void | Promise<void>) => Promise<void> = async (update) => {
		let result: void | Promise<void>
		flushSync(() => {
			result = update()
		})

		await result!
	},
) {
	let account: Account | null = null
	let authority = 0
	let privateLoads = 0
	let changeSession!: (next: Account | null, returnTo?: string) => void
	const completions: ((result: SignInResult) => void)[] = []
	const outcomes: string[] = []
	const returned: string[] = []
	const cancelled: string[] = []
	const platform = createBrowserRouterHost()
	const route = defineRoute.withContext<{ account: Account | null }>()
	function Home(): Renderable {
		return <p id="public-home">Public home</p>
	}

	function loginSearch(raw: { returnTo?: unknown }) {
		return { returnTo: typeof raw.returnTo === 'string' ? raw.returnTo : '/' }
	}

	function Login(props: { search: { returnTo: string } }): Renderable {
		const navigation = useRouter(router)
		const lifetime = useMemo(() => ({ active: true, attempt: 0 }), [])
		const [message, setMessage] = useState('ready')
		useLayoutEffect(
			() => () => {
				lifetime.active = false
				lifetime.attempt++
			},
			[],
		)

		const signIn = () => {
			const attempt = ++lifetime.attempt
			const version = authority
			setMessage('pending')
			const sdk = new Promise<SignInResult>((resolve) => completions.push(resolve))
			void sdk.then((result) => {
				if (!lifetime.active || lifetime.attempt !== attempt || authority !== version) {
					outcomes.push('cancelled')
					return
				}

				if (result.kind === 'expired') {
					setMessage('expired')
					outcomes.push('expired')
					return
				}

				// Changing the outlet authority ends this navigator's lifetime. Hand the
				// return URL to the replacement owner instead of navigating here.
				outcomes.push('success')
				changeSession(result.account, props.search.returnTo)
			})
		}

		const cancel = async () => {
			const result = navigation.getSnapshot().modal
				? await navigation.dismiss()
				: await navigation.replace({ to: '/' })

			cancelled.push(result.status)
		}

		return (
			<div id="login">
				<output id="sign-in-status">{message}</output>
				<button id="sign-in" disabled={message === 'pending'} onClick={signIn}>
					Sign in
				</button>
				<button id="cancel-sign-in" onClick={cancel}>
					Cancel sign-in
				</button>
			</div>
		)
	}

	const router = createRouter({
		catalog: defineRoutes([
			route({ path: '/' }).screen(Home),
			route({
				path: '/login',
				validateSearch: loginSearch,
			}).screen(Login),
			route({
				path: '/private/:id',
				beforeLoad({ context, params }) {
					if (!context.account) {
						throw new DestinationRedirect({
							to: '/login',
							search: { returnTo: '/private/' + encodeURIComponent(params.id) },
						})
					}

					return { account: context.account }
				},
				loader({ context, params }) {
					privateLoads++
					return { account: context.account.id, id: params.id }
				},
			}).screen(({ data }) => (
				<p id="private-item">
					{data.account}:{data.id}
				</p>
			)),
		]),
		host: platform.host,
		context: () => ({ account: account ? { ...account } : null }),
	})

	platform.attach(router)

	function App(): Renderable {
		const [state, setState] = useState<{ version: number; returnTo?: string }>({ version: 0 })
		changeSession = (next, returnTo) => {
			account = next
			authority++
			setState({ version: authority, returnTo })
		}

		return (
			<ClientRouteOutlet
				host={platform}
				authority={state.version}
				resumeUrl={state.returnTo}
				onResume={(result) => returned.push(result.status)}
			>
				<p id="owner-base">New owner</p>
			</ClientRouteOutlet>
		)
	}

	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	await batch(() => root.render(App))
	let disposed = false
	const dispose = async () => {
		if (disposed) {
			return
		}

		disposed = true
		try {
			await batch(() => root.unmount())
		} finally {
			router.dispose()
			for (const resolve of completions) {
				resolve({ kind: 'expired' })
			}

			container.remove()
		}
	}

	return {
		dispose,
		router,
		container,
		outcomes,
		returned,
		cancelled,
		loads: () => privateLoads,
		account: () => account,
		changeSession: (next: Account | null, returnTo?: string) =>
			batch(() => changeSession(next, returnTo)),
		async returnFromRetiringOwner(next: Account, returnTo: string) {
			let request!: ReturnType<typeof router.navigateUrl>
			await batch(() => {
				changeSession(next)
				request = router.navigateUrl(returnTo, { replace: true })
			})

			return await request
		},
		click: (id: string) =>
			batch(() => {
				const button = document.getElementById(id) as HTMLButtonElement | null
				if (!button) {
					throw new Error('Missing authentication control: ' + id)
				}

				button.click()
			}),
		complete: (index: number, result: SignInResult) =>
			batch(async () => {
				if (!completions[index]) {
					throw new Error('Missing sign-in attempt: ' + index)
				}

				completions[index](result)
			}),
	}
}
