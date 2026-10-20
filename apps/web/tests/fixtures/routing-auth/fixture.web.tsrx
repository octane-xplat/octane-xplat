/** @jsxImportSource @octane-xplat/jsx/dom */
import { createAuthenticationExample } from '../../../../../packages/ui/tests/authentication-routing-example.web.tsrx'

type Example = Awaited<ReturnType<typeof createAuthenticationExample>>
let example: Example
let ready = false
async function reset(url = '/', account: { id: string } | null = null) {
	ready = false
	await example?.dispose()
	history.replaceState(null, '', url)
	example = await createAuthenticationExample()
	if (account) {
		await example.changeSession(account)
	}

	const result = await example.router.navigateUrl(url, { replace: true })
	ready = true
	return result.status
}

const api = {
	get ready() {
		return ready
	},
	get state() {
		return {
			account: example.account(),
			outcomes: [...example.outcomes],
			returned: [...example.returned],
			cancelled: [...example.cancelled],
			loads: example.loads(),
			route: example.router.getSnapshot().route?.to ?? null,
		}
	},
	reset,
	complete: (index: number, result: Parameters<Example['complete']>[1]) =>
		example.complete(index, result),
	open: (id: string) => example.router.navigateUrl('/private/' + encodeURIComponent(id)),
	modal: (returnTo: string) =>
		example.router.push({ to: '/login', search: { returnTo }, presentation: 'modal' }),
	async expire() {
		await example.changeSession(null)
		return example.router.navigateUrl(location.pathname + location.search, { replace: true })
	},
	switchAccount: (id: string) => example.changeSession({ id }),
	returnFromOldOwner: () => example.returnFromRetiringOwner({ id: 'account-a' }, '/private/coat'),
	returnUrl: (url: string) => example.router.navigateUrl(url, { replace: true }),
	dispose: () => example.dispose(),
}

declare global {
	interface Window {
		__routingAuth: typeof api
	}
}

window.__routingAuth = api
void reset(location.pathname + location.search)
