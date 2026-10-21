import { Application, File, Frame, GridLayout, Page, knownFolders } from '@nativescript/core'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import { addBackInterceptor, getStack, registerStack } from '@octane-xplat/ui/routing'
import { bindRouterFlow } from '../../../packages/ui/src/router-instance'
import { createNativeModalRouterHost } from '../../../packages/ui/src/native-modal-router-host'
// oxlint-disable-next-line xplat/no-ts-imports-tsrx — isolated compiled fixture
import { qualifyNativeAuthentication } from '../../../packages/ui/tests/authentication-native-example.tsrx'
// oxlint-disable-next-line xplat/no-ts-imports-tsrx — isolated compiled fixture
import { qualifyRouteRetention } from '../../../packages/ui/tests/route-retention-example.tsrx'
// oxlint-disable-next-line xplat/no-ts-imports-tsrx — isolated compiled fixture
import { qualifyPaneRouterExample } from '../../../packages/ui/tests/pane-router-example.tsrx'
import { nativeMotion, sampleViewMotion } from './navigation-motion'
import { requestNavigationSwipe } from './navigation-swipe-events'
import { checkNativeBackEvents } from './navigation-engine-events.mobile'

import { consumeInitialUrl, onDeepLink } from '@octane-xplat/platform'
// oxlint-disable-next-line xplat/no-ts-imports-tsrx — isolated compiled fixture
import {
	runtimeRoutes,
	redirectedRoutes,
	iosTabsRoutes,
	checkedLinkControl,
	loaderFailureControl,
} from './navigation-fixture.mobile.tsrx'

// oxlint-disable-next-line xplat/no-ts-imports-tsrx — isolated compiled fixture
import {
	createRefinedNavigation,
	RefinedNavigationShell,
	refinedObservations,
	DefaultClientShell,
	configureDefaultClient,
	defaultClientObservations,
} from './navigation-refined.mobile.tsrx'

import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'

const results: { name: string; pass: boolean; detail?: string }[] = []
const frame = new Frame()
const page = new Page()
page.id = 'navigation-base-page'
const host = new GridLayout()
let appRoot: ReturnType<typeof createNativeScriptRoot>
page.content = host
page.actionBarHidden = true
const refined = createRefinedNavigation(frame)
const incoming: string[] = []
onDeepLink((url) => incoming.push(url))
// Text-only fixture diagnostics distinguish Android lifecycle delivery paths.
const linkEvents: unknown[] = []
let launchIntent: any
if (Application.android) {
	Application.on(Application.launchEvent, (args: any) => {
		launchIntent = args.android
		linkEvents.push({ event: 'launch', hasUrl: !!args.android?.getDataString?.() })
	})

	Application.android.on('activityNewIntent', (args: any) => {
		linkEvents.push({
			event: 'newIntent',
			sameLaunch: args.intent === launchIntent,
			equalLaunch: !!args.intent?.equals?.(launchIntent),
		})
	})

	Application.on(Application.resumeEvent, () => {
		const intent = Application.android.foregroundActivity?.getIntent?.()
		linkEvents.push({
			event: 'resume',
			sameLaunch: intent === launchIntent,
			equalLaunch: !!intent?.equals?.(launchIntent),
		})
	})
}

const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 50))
async function wait(name: string, condition: () => boolean): Promise<void> {
	const start = Date.now()
	while (!condition()) {
		if (Date.now() - start > 10000) {
			throw new Error(name + ' timed out')
		}

		await pause()
	}
}

function check(name: string, pass: boolean, detail?: string): void {
	results.push({ name, pass, detail })
	console.log('[navigation] ' + name + ': ' + (pass ? 'OK' : 'FAIL'))
	if (!pass) {
		throw new Error(name + ': ' + detail)
	}
}

function collect(view: any, out: any[] = []): any[] {
	if (!view) {
		return out
	}

	out.push(view)
	view.eachChildView?.((child: any) => {
		collect(child, out)
		return true
	})

	return out
}

const texts = (view: any) =>
	collect(view)
		.map((v) => v.text)
		.filter((v) => typeof v === 'string')

async function select(label: string): Promise<void> {
	let view = collect(page).find((v) => v.text === label)
	while (
		view &&
		!view.hasListeners?.('tap') &&
		!view.hasListeners?.('click') &&
		!view.getGestureObservers?.(1)?.length
	) {
		view = view.parent
	}

	check('tab target loaded ' + label, view?.isLoaded === true)
	const eventName = view.hasListeners?.('click') ? 'click' : 'tap'
	const event = { eventName, object: view }
	if (view.hasListeners?.(eventName)) {
		// Native activation can use click/tap Observable listeners or gesture
		// observers, depending on the view. Both paths remain synthetic input.
		view.notify(event)
	} else {
		for (const observer of view.getGestureObservers(1)) {
			observer.callback.call(observer.context, event)
		}
	}

	await pause()
}

function routeId(match: { params: object } | null | undefined): string | undefined {
	return match && 'id' in match.params && typeof match.params.id === 'string'
		? match.params.id
		: undefined
}

type FixtureStack = 'root' | 'first' | 'second' | 'ios-first' | 'ios-second' | 'detail-pane'
type ItemPath = '/nav/:id' | '/runtime/:id' | '/loaded/:id' | '/broken/:id' | '/modal/:id'
const push = (stack: FixtureStack, id: string, to: ItemPath = '/nav/:id') =>
	to === '/runtime/:id'
		? refined.navigation.navigateUrl(
				(stack === 'root' ? '' : '/' + stack) + '/runtime/' + encodeURIComponent(id),
			)
		: refined.navigation.push({ stack, to, params: { id }, transition: 'none' })

const current = (stack: FixtureStack = 'root') =>
	refined.navigation.forStack(stack).getSnapshot().route

function searchTab(stack: FixtureStack): unknown {
	const search = current(stack)?.search
	return search && 'tab' in search ? search.tab : undefined
}

const modalNavigator = () => {
	const modal = refined.platform.modals.getSnapshot().at(-1)
	return modal ? bindRouterFlow(refined.navigation, modal.flow) : undefined
}

async function shown(stack: FixtureStack, id: string, view: any = page): Promise<void> {
	await wait(
		'route ' + id,
		() => routeId(current(stack)) === id && texts(view).includes('route:' + id),
	)
}

function hardwareBack(): boolean {
	const event = {
		eventName: 'activityBackPressed',
		object: Application.android,
		activity: Application.android.foregroundActivity,
		cancel: false,
	}
	Application.android.notify(event)
	return event.cancel
}

async function run(): Promise<void> {
	await wait('shell loaded', () => page.isLoaded && texts(page).includes('first base'))
	let initial = consumeInitialUrl()
	await wait('cold URL captured', () => {
		initial ??= consumeInitialUrl() ?? incoming.shift() ?? null
		return !!initial
	})

	if (initial) {
		const coldResult = await refined.navigation.navigateUrl(initial)
		check(
			'cold incoming link dispatched',
			coldResult.status === 'committed',
			JSON.stringify(coldResult, (_key, value) => (value instanceof Error ? value.message : value)),
		)

		await wait(
			'cold screen',
			() => routeId(current('root')) === 'cold' && texts(frame.currentPage).includes('route:cold'),
		)

		check(
			'cold incoming link once',
			frame.backStack.length === 1 && incoming.length === 0,
			JSON.stringify({
				depth: frame.backStack.length,
				incomingCount: incoming.length,
				initialStillQueued: consumeInitialUrl() !== null,
				linkEvents,
			}),
		)

		await refined.navigation.back()
		await wait('cold pop', () => current('root') === null && frame.currentPage === page)
	}

	const visiblePanePush = await refined.detailPane.push({
		to: '/refined/:id',
		params: { id: 'visible-pane' },
	})
	check(
		'integrated pane renders in its loaded declaring Page',
		visiblePanePush.status === 'committed' &&
			frame.currentPage === page &&
			collect(page).some((view) => view.text === 'refined:visible-pane' && view.isLoaded),
	)
	check(
		'integrated pane restores its loaded base',
		(await refined.detailPane.back()).status === 'committed' &&
			frame.currentPage === page &&
			collect(page).some((view) => view.text === 'integrated-pane-base' && view.isLoaded),
	)

	push('first', 'one')
	await shown('first', 'one')
	check('named layout', texts(page).includes('navigation layout'))
	push('first', 'two')
	await shown('first', 'two')
	await refined.navigation.forStack('first').back()
	await shown('first', 'one')
	check(
		'named push/pop uses route store',
		refined.navigation.forStack('first').getSnapshot().canGoBack,
	)
	await select('Second')
	push('second', 'other')
	await shown('second', 'other')
	await select('First')
	await shown('first', 'one')
	check('tab switches retain history', routeId(current('second')) === 'other')
	await refined.navigation.forStack('first').back()
	await wait('first base restored', () => texts(page).includes('first base'))

	refined.navigation.addRoutes(runtimeRoutes, { id: 'runtime', conflict: 'replace' })

	push('first', 'runtime', '/runtime/:id')
	await shown('first', 'runtime')
	await wait('runtime loader', () => texts(page).includes('data:runtime-runtime'))
	check('addRoutes loader renders', true)
	await refined.navigation.forStack('first').back()
	const checkedRuntime = await refined.navigation.validateDestination({
		to: '/runtime/:id',
		params: { id: 'checked-link' },
		stack: 'first',
		transition: 'none',
	})
	check(
		'runtime destination validation succeeds without changing the current route',
		checkedRuntime.status === 'valid' && routeId(current('first')) !== 'checked-link',
	)
	if (checkedRuntime.status !== 'valid') {
		throw new Error('Runtime validation failed')
	}
	check(
		'runtime destination href uses the selected native stack',
		refined.navigation.href(checkedRuntime.destination) === '/first/runtime/checked-link',
	)
	checkedLinkControl.set(checkedRuntime.destination)
	await wait('checked runtime link rendered', () => texts(page).includes('Open checked runtime'))
	await select('Open checked runtime')
	await shown('first', 'checked-link')
	check(
		'checked native NavLink renders the runtime loader result',
		texts(page).includes('data:runtime-checked-link') &&
			refined.navigation.forStack('first').getSnapshot().route?.contract === 'runtime',
	)
	await refined.navigation.forStack('first').back()
	checkedLinkControl.set(null)

	const filterFlow = refined.navigation.forStack('first')
	await filterFlow.push({ to: '/search/:id', params: { id: 'coat' }, transition: 'none' })
	await wait('search screen mounted', () => texts(page).includes('search:coat:details'))
	const originalSearchUpdate = refinedObservations.searchUpdates.get('coat')!
	check(
		'native search edit commits',
		(
			await originalSearchUpdate((previous) => ({
				tab: previous.tab === 'details' ? 'activity' : 'details',
			}))
		).status === 'committed',
	)
	await wait('search loader result', () => texts(page).includes('search-data:activity'))
	check(
		'native search edit keeps params and validated search',
		current('first')?.to === '/search/:id' &&
			routeId(current('first')) === 'coat' &&
			searchTab('first') === 'activity',
	)
	await filterFlow.back()
	check('default native search edit replaces instead of growing history', current('first') === null)
	await filterFlow.push({ to: '/search/:id', params: { id: 'coat' }, transition: 'none' })
	await wait('search screen restored', () => texts(page).includes('search:coat:details'))
	await refinedObservations.searchUpdates.get('coat')!({ tab: 'activity' }, { replace: false })
	await filterFlow.back()
	check(
		'native search push restores its prior filters on Back',
		current('first')?.to === '/search/:id' && searchTab('first') === 'details',
	)
	await wait('restored search hook', () => texts(page).includes('search:coat:details'))
	const staleSearchUpdate = refinedObservations.searchUpdates.get('coat')!
	await filterFlow.push({ to: '/search/:id', params: { id: 'hat' }, transition: 'none' })
	check(
		'native stale search callback is cancelled',
		(await staleSearchUpdate({ tab: 'activity' })).status === 'cancelled',
	)
	check(
		'native stale search callback leaves the new record unchanged',
		routeId(current('first')) === 'hat' && searchTab('first') === 'details',
	)
	await filterFlow.back()
	await filterFlow.back()
	for (const kind of [
		'strip',
		'side',
		'top',
		'mega',
		'breadcrumb',
		'heading',
		'tab',
		'menu-surface',
	]) {
		const rootBefore = refined.navigation.getSnapshot().route
		await filterFlow.push({ to: '/chrome/:id', params: { id: kind }, transition: 'none' })
		await wait('chrome ' + kind + ' ready', () => texts(page).includes('Open target'))
		await select('Open target')
		await wait(
			'chrome ' + kind + ' commits',
			() =>
				routeId(current('first')) === 'chrome-' + kind &&
				texts(page).includes('refined:chrome-' + kind),
		)

		check(
			'native ' + kind + ' link keeps its owning flow',
			refined.navigation.getSnapshot().route === rootBefore,
		)

		check(
			'native ' + kind + ' link uses its validated route data',
			current('first')?.to === '/refined/:id' && searchTab('first') === 'details',
		)

		await filterFlow.back()
		await filterFlow.back()
	}

	push('first', 'guarded', '/loaded/:id')
	await shown('first', 'guarded')
	check(
		'guard context and loader render',
		texts(page).includes('guard:true') && texts(page).includes('data:loaded-guarded'),
	)

	await refined.navigation.push({ stack: 'first', to: '/blocked' })
	await pause()
	check('rejected guard leaves route', routeId(current('first')) === 'guarded')
	refined.navigation.addRoutes(redirectedRoutes, { id: 'redirect', conflict: 'replace' })

	await refined.navigation.navigateUrl('/first/redirected')
	await shown('first', 'redirect')
	await refined.navigation.forStack('first').back()
	await shown('first', 'guarded')
	check('redirect skips intermediate entry', true)
	loaderFailureControl.hold()
	const failingRequest = push('first', 'error', '/broken/:id')
	await wait('pending feedback renders in the owning native screen', () =>
		texts(page).includes('navigation:pending'),
	)
	check(
		'pending navigation retains its prepared screen',
		routeId(current('first')) === 'guarded' &&
			refined.navigation.forStack('first').getSnapshot().navigation.status === 'pending',
	)
	loaderFailureControl.release()
	const loaderFailure = await failingRequest
	check(
		'loader rejection returns a structured result',
		loaderFailure.status === 'failed' && loaderFailure.phase === 'loader',
	)
	check(
		'loader rejection retains committed content',
		routeId(current('first')) === 'guarded' && texts(page).includes('route:guarded'),
	)

	await wait('failure feedback renders in the owning native screen', () =>
		texts(page).includes('navigation:failed:loader'),
	)
	check(
		'native loader failure stays out of the root flow',
		refined.navigation.getSnapshot().navigation.status === 'idle',
	)
	refined.navigation.forStack('first').clearFailure()
	await wait(
		'native failure feedback clears reactively',
		() => !texts(page).includes('navigation:failed:loader'),
	)
	check('clearing failure retains its prepared screen', routeId(current('first')) === 'guarded')

	push('root', 'root')
	await wait(
		'root pushed',
		() => routeId(current('root')) === 'root' && texts(frame.currentPage).includes('route:root'),
	)

	push('root', 'modal', '/modal/:id')
	await wait(
		'modal mounted',
		() =>
			routeId(modalNavigator()?.getSnapshot().route) === 'modal' &&
			(frame.currentPage as any)?.modal?.isLoaded === true,
	)

	if (Application.android) {
		const calls: string[] = []
		const old = addBackInterceptor(() => {
			calls.push('old')
			return false
		})

		const newest = addBackInterceptor(() => {
			calls.push('new')
			return true
		})

		check(
			'hardware interceptor consumes',
			hardwareBack() && routeId(modalNavigator()?.getSnapshot().route) === 'modal',
		)

		check('hardware interceptor newest first', calls.join(',') === 'new')
		newest()
		check('hardware dismisses modal first', hardwareBack())

		await wait('modal native dismissal', () => !(frame.currentPage as any)?.modal)
		check('older interceptor resumed', calls.join(',') === 'new,old')
		old()
		check('hardware pops root before named', hardwareBack())
	} else {
		await modalNavigator()!.dismiss()
		await wait(
			'modal dismissed',
			() =>
				(modalNavigator()?.getSnapshot().route ?? null) === null &&
				!(frame.currentPage as any)?.modal,
		)

		check('modal dismissal retains presenter', routeId(current('root')) === 'root')
		await refined.navigation.back()
	}

	await wait('root restored', () => frame.currentPage === page && current('root') === null)
	if (Application.android) {
		check('hardware pops visible named stack', hardwareBack())
		await wait('visible named stack returns to base', () => current('first') === null)
		check(
			'hardware leaves hidden named stack intact',
			routeId(current('second')) === 'other' && !hardwareBack(),
		)

		await select('Second')
		check('hardware pops newly selected named stack', hardwareBack())
		await wait('selected named stack returns to base', () => current('second') === null)
		check('hardware base falls through', !hardwareBack())
	} else {
		await refined.navigation.forStack('second').back()
		await refined.navigation.forStack('first').back()
	}

	check(
		'unknown incoming link rejected',
		(await refined.navigation.navigateUrl('xplatnav://missing')).status === 'not-found',
	)
	check(
		'malformed incoming link rejected',
		(await refined.navigation.navigateUrl('xplatnav://nav/%')).status === 'invalid-input',
	)
	check(
		'runtime incoming link dispatched',
		(await refined.navigation.navigateUrl('xplatnav://first/runtime/link')).status === 'committed',
	)
	await shown('first', 'link')
	await refined.navigation.forStack('first').back()

	if (Application.ios) {
		const swipeProbeTargetResult = await refined.navigation.push({
			to: '/refined/:id',
			params: { id: 'swipe-probe-target' },
			transition: 'none',
		})

		check(
			'initial iOS swipe target commits',
			swipeProbeTargetResult.status === 'committed',
			JSON.stringify(swipeProbeTargetResult),
		)

		const swipeProbeSourceResult = await refined.navigation.push({
			to: '/refined/:id',
			params: { id: 'swipe-probe-source' },
			transition: 'none',
		})

		check(
			'initial iOS swipe source commits',
			swipeProbeSourceResult.status === 'committed',
			JSON.stringify(swipeProbeSourceResult),
		)

		const swipeProbeSource = frame.currentPage
		refined.setFrameAdmission(false)
		await requestNavigationSwipe(frame, 'canonical-root-probe')
		await wait(
			'initial iOS edge guard refusal',
			() => refined.navigation.getSnapshot().navigation.status === 'failed',
		)

		const swipeProbeFailure = refined.navigation.getSnapshot().navigation
		check(
			'initial iOS edge Back checks guards before native navigation',
			frame.currentPage === swipeProbeSource &&
				swipeProbeFailure.status === 'failed' &&
				swipeProbeFailure.result.status === 'forbidden',
		)

		refined.setFrameAdmission(true)
		await refined.navigation.retry()
		await refined.navigation.back()
		check('initial iOS edge probe restores its declaring base', frame.currentPage === page)
		refined.navigation.addRoutes(iosTabsRoutes, { id: 'ios-tabs', conflict: 'replace' })
		await refined.navigation.navigateUrl('/ios-tabs')
		await wait(
			'UITabBar loaded',
			() =>
				!!getStack('ios-first')?.currentPage && !!frame.currentPage?.getViewById('nav-ios-tabs'),
		)

		const tabsRootPage = frame.currentPage
		const tabview = frame.currentPage.getViewById('nav-ios-tabs') as any
		const items = tabview.items
		for (let i = 0; i < 3; i++) {
			tabview.items = [...items]
			tabview.selectedIndex = 1
			await wait('second tab loaded', () => !!getStack('ios-second')?.currentPage)
			tabview.selectedIndex = 0
			await pause()
			push('ios-first', 'ios-' + i)
			await wait('UITabBar push', () => routeId(current('ios-first')) === 'ios-' + i)
			check(
				'UITabBar items stable ' + i,
				tabview.items.every((item: any, index: number) => item === items[index]) &&
					getStack('ios-first')?.backStack.length === 1,
			)

			if (i === 2) {
				await requestNavigationSwipe(getStack('ios-first')!, 'canonical-tab')
			} else {
				await refined.navigation.forStack('ios-first').back()
			}

			await wait('UITabBar pop', () => current('ios-first') === null)
			if (i === 2) {
				check(
					'iOS edge Back stays in the selected named Frame',
					frame.currentPage === tabsRootPage &&
						frame.currentPage.getViewById('nav-ios-tabs') === tabview,
				)
			}
		}

		await refined.navigation.back()
		await wait('UITabBar root pop', () => frame.currentPage === page)
	}

	console.log('[navigation] awaiting warm OS links')
	File.fromPath(knownFolders.documents().path + '/navigation-check.json').writeTextSync(
		JSON.stringify({ awaitingWarmLinks: true, results }),
	)

	for (let i = 1; i <= 2; i++) {
		await wait('warm OS link ' + i, () => incoming.length >= i)
		check(
			'warm incoming dispatch ' + i,
			(await refined.navigation.navigateUrl(incoming[i - 1])).status === 'committed',
		)

		await wait(
			'warm route ' + i,
			() => routeId(current('root')) === 'warm' && frame.backStack.length === i,
		)

		check('warm incoming once ' + i, frame.backStack.length === i)
	}

	const modern = refined.navigation
	const confirmation = (id: string) => {
		const state = refinedObservations.blockers.get(id)
		if (!state || state.status !== 'blocked') {
			throw new Error('Expected confirmation for ' + id)
		}
		return state
	}
	const confirmationBase = frame.currentPage
	check(
		'confirmation target commits',
		(
			await modern.push({
				to: '/refined/:id',
				params: { id: 'confirm-target' },
				transition: 'none',
			})
		).status === 'committed',
	)
	const confirmationTargetPage = frame.currentPage
	refinedObservations.increments.get('confirm-target')!()
	await wait(
		'confirmation target state',
		() => refinedObservations.entries.get('confirm-target')?.count === 1,
	)
	check(
		'confirmation source commits',
		(
			await modern.push({
				to: '/refined/:id',
				params: { id: 'confirm-source' },
				transition: 'none',
			})
		).status === 'committed',
	)
	const confirmationSourcePage = frame.currentPage
	refinedObservations.setDirtyEntry('confirm-target')
	await wait(
		'hidden confirmation subscription',
		() => refinedObservations.dirtyEntries.get('confirm-target') === true,
	)
	check(
		'hidden native retained entry does not block current-flow navigation',
		(
			await modern.push({
				to: '/refined/:id',
				params: { id: 'confirm-transient' },
				transition: 'none',
			})
		).status === 'committed',
	)
	await modern.back()
	refinedObservations.setDirtyEntry('confirm-source')
	await wait(
		'visible dirty entry committed',
		() => refinedObservations.dirtyEntries.get('confirm-source') === true,
	)
	refinedObservations.increments.get('confirm-source')!()
	await wait(
		'confirmation source state',
		() => refinedObservations.entries.get('confirm-source')?.count === 1,
	)
	const confirmationDepth = frame.backStack.length
	const heldPush = modern.push({
		to: '/refined/:id',
		params: { id: 'confirm-other' },
		transition: 'none',
	})
	await wait(
		'native push confirmation',
		() =>
			refinedObservations.blockers.get('confirm-source')?.status === 'blocked' &&
			texts(confirmationSourcePage).includes('confirmation:blocked'),
	)
	check(
		'native confirmation holds before loading or mutating the Frame',
		frame.currentPage === confirmationSourcePage &&
			frame.backStack.length === confirmationDepth &&
			!refinedObservations.loads.has('confirm-other'),
	)
	confirmation('confirm-source').reset()
	check(
		'native confirmation refusal preserves source state without failure feedback',
		(await heldPush).status === 'cancelled' &&
			modern.getSnapshot().navigation.status === 'idle' &&
			refinedObservations.entries.get('confirm-source')?.count === 1,
	)
	const oldRequest = modern.push({ to: '/refined/:id', params: { id: 'confirm-obsolete' } })
	await wait('obsolete native confirmation', () => {
		const state = refinedObservations.blockers.get('confirm-source')
		return state?.status === 'blocked' && state.destination?.params?.id === 'confirm-obsolete'
	})
	const obsoleteControls = confirmation('confirm-source')
	const newRequest = modern.push({ to: '/refined/:id', params: { id: 'confirm-other' } })
	await wait('replacement native confirmation', () => {
		const state = refinedObservations.blockers.get('confirm-source')
		return state?.status === 'blocked' && state.destination?.params?.id === 'confirm-other'
	})
	obsoleteControls.proceed()
	check(
		'obsolete native confirmation cannot approve a newer request',
		(await oldRequest).status === 'cancelled' &&
			frame.currentPage === confirmationSourcePage &&
			!refinedObservations.loads.has('confirm-other') &&
			!refinedObservations.loads.has('confirm-obsolete'),
	)
	confirmation('confirm-source').reset()
	await newRequest
	const confirmationTargetLoads = refinedObservations.loads.get('confirm-target')!
	if (Application.ios) {
		await requestNavigationSwipe(frame, 'canonical-blocker-deny')
	} else {
		console.log('[navigation] awaiting Android Back 6')
	}
	await wait(
		'OS Back confirmation',
		() => refinedObservations.blockers.get('confirm-source')?.status === 'blocked',
	)
	check(
		'OS Back asks for confirmation before native history or target loading',
		frame.currentPage === confirmationSourcePage &&
			frame.backStack.length === confirmationDepth &&
			refinedObservations.loads.get('confirm-target') === confirmationTargetLoads,
	)
	confirmation('confirm-source').reset()
	await wait('refused OS Back settles', () => modern.getSnapshot().navigation.status === 'idle')
	if (Application.ios) {
		await requestNavigationSwipe(frame, 'canonical-blocker-admit')
	} else {
		console.log('[navigation] awaiting Android Back 7')
	}
	await wait(
		'admitted OS Back confirmation',
		() => refinedObservations.blockers.get('confirm-source')?.status === 'blocked',
	)
	refined.setAccount('confirmation-account-b')
	confirmation('confirm-source').proceed()
	await wait(
		'OS Back after confirmation',
		() =>
			frame.currentPage === confirmationTargetPage &&
			modern.getSnapshot().navigation.status === 'idle',
	)
	check(
		'OS confirmation approval loads fresh account data into the retained target once',
		refinedObservations.loads.get('confirm-target') === confirmationTargetLoads + 1 &&
			refinedObservations.entries.get('confirm-target')?.title ===
				'confirmation-account-b:confirm-target' &&
			refinedObservations.entries.get('confirm-target')?.count === 1,
	)
	refinedObservations.setDirtyEntry(null)
	refined.setAccount('account-a')
	await modern.back()
	check(
		'native confirmation probe restores the declaring Frame',
		frame.currentPage === confirmationBase,
	)
	check(
		'refined push committed',
		(await modern.push({ to: '/refined/:id', params: { id: 'coat' }, transition: 'none' }))
			.status === 'committed',
	)
	check(
		'refined current Page rendered before result',
		texts(frame.currentPage).includes('refined:coat'),
	)
	check(
		'refined guard context and loader',
		refinedObservations.entries.get('coat')?.title === 'account-a:coat' &&
			refinedObservations.entries.get('coat')?.checked === true,
	)
	check(
		'refined Page inherits its outlet provider',
		refinedObservations.entries.get('coat')?.provider === 'Avery',
	)
	const coatPage = frame.currentPage
	refinedObservations.increment()
	await wait('refined local update', () => refinedObservations.entries.get('coat')?.count === 1)
	check('refined refresh committed', (await modern.refresh()).status === 'committed')
	check(
		'refined refresh retains Page and local state',
		frame.currentPage === coatPage && refinedObservations.entries.get('coat')?.count === 1,
	)
	check(
		'refined second push',
		(await modern.push({ to: '/refined/:id', params: { id: 'hat' }, transition: 'none' }))
			.status === 'committed',
	)
	check(
		'refined retained match keeps its own data',
		refinedObservations.entries.get('coat')?.id === 'coat' &&
			refinedObservations.entries.get('coat')?.title === 'account-a:coat',
	)
	refinedObservations.changeProvider('Jordan')
	await wait(
		'refined retained provider update',
		() =>
			refinedObservations.entries.get('coat')?.provider === 'Jordan' &&
			refinedObservations.entries.get('hat')?.provider === 'Jordan',
	)
	check(
		'refined providers update hidden and visible Pages',
		refinedObservations.entries.get('coat')?.provider === 'Jordan' &&
			refinedObservations.entries.get('hat')?.provider === 'Jordan',
	)
	const historySource = frame.currentPage
	const historyDepth = frame.backStack.length
	refined.setFrameAdmission(false)
	check('Frame Back refuses a denied retained Page', (await modern.back()).status === 'forbidden')
	check(
		'denied Frame Back leaves native history untouched',
		frame.currentPage === historySource && frame.backStack.length === historyDepth,
	)
	if (Application.android) {
		modern.clearFailure()
		console.log('[navigation] awaiting Android Back 4')
		await wait(
			'Android Back guard refusal',
			() => modern.getSnapshot().navigation.status === 'failed',
		)

		const refusal = modern.getSnapshot().navigation
		check(
			'Android OS Back checks guards before the engine pop',
			refusal.status === 'failed' &&
				refusal.result.status === 'forbidden' &&
				frame.currentPage === historySource &&
				frame.backStack.length === historyDepth,
		)
	}
	if (Application.ios) {
		modern.clearFailure()
		const beforeShortSwipe = refinedObservations.loads.get('coat')
		await requestNavigationSwipe(frame, 'canonical-short')
		check(
			'short iOS edge drag preserves the Page, history and idle navigation',
			frame.currentPage === historySource &&
				frame.backStack.length === historyDepth &&
				modern.getSnapshot().navigation.status === 'idle' &&
				refinedObservations.loads.get('coat') === beforeShortSwipe,
		)

		await requestNavigationSwipe(frame, 'canonical-content')
		check(
			'iOS full-content pop cannot bypass canonical preparation',
			frame.currentPage === historySource &&
				frame.backStack.length === historyDepth &&
				modern.getSnapshot().navigation.status === 'idle' &&
				refinedObservations.loads.get('coat') === beforeShortSwipe,
		)

		await requestNavigationSwipe(frame, 'canonical-deny')
		await wait(
			'iOS edge Back guard refusal',
			() => modern.getSnapshot().navigation.status === 'failed',
		)

		const refusal = modern.getSnapshot().navigation
		check(
			'iOS OS edge Back checks guards before the engine pop',
			refusal.status === 'failed' &&
				refusal.result.status === 'forbidden' &&
				frame.currentPage === historySource &&
				frame.backStack.length === historyDepth,
		)
	}
	refined.setFrameAdmission(true)
	refined.setAccount('history-account-b')
	const refinedBack = await modern.retry()
	check('refined Back committed', refinedBack.status === 'committed')
	const refinedBackFinished = refinedBack.status === 'committed' ? await refinedBack.finished : null
	check(
		'refined Back reports disabled motion',
		refinedBackFinished?.status === 'skipped' && refinedBackFinished.reason === 'disabled',
	)
	check(
		'refined Back restores retained Page',
		frame.currentPage === coatPage && refinedObservations.entries.get('coat')?.count === 1,
	)
	check(
		'Frame Back refreshes data from the current account context',
		refinedObservations.entries.get('coat')?.title === 'history-account-b:coat',
	)
	refined.setAccount('account-a')
	if (Application.ios) {
		await modern.push({ to: '/refined/:id', params: { id: 'swipe-source' }, transition: 'none' })
		refined.setAccount('swipe-account-b')
		await requestNavigationSwipe(frame, 'canonical-admit')
		await wait(
			'admitted iOS edge Back',
			() => frame.currentPage === coatPage && modern.getSnapshot().navigation.status === 'idle',
		)

		check(
			'iOS OS edge Back restores retained state with fresh account data',
			refinedObservations.entries.get('coat')?.count === 1 &&
				refinedObservations.entries.get('coat')?.title === 'swipe-account-b:coat',
		)

		refined.setAccount('account-a')
	}
	const factoriesBefore = nativeMotion.factories
	nativeMotion.events.length = 0
	const animated = await modern.push({
		to: '/refined/:id',
		params: { id: 'animated' },
		transition: 'native-detail',
	})
	check(
		'registered native transition commits its rendered Page',
		animated.status === 'committed' && texts(frame.currentPage).includes('refined:animated'),
	)
	const animation = animated.status === 'committed' ? await animated.finished : null
	check(
		'registered native transition completes at the engine receipt',
		animation?.status === 'completed',
	)
	check(
		'native transition factory creates one effect per entry',
		nativeMotion.factories === factoriesBefore + 1,
	)
	check(
		'custom native forward animator executes',
		Application.android
			? nativeMotion.events.some((event) => event === 'android-end:enter')
			: nativeMotion.events.includes('ios:1'),
		JSON.stringify(nativeMotion.events),
	)
	const animatedBack = await modern.back()
	check(
		'custom transition Back restores the retained Page',
		animatedBack.status === 'committed' &&
			frame.currentPage === coatPage &&
			refinedObservations.entries.get('coat')?.count === 1,
	)
	check(
		'native engine reverses the selected effect without recreating it',
		nativeMotion.factories === factoriesBefore + 1 &&
			(Application.android
				? nativeMotion.events.some((event) => event === 'android-end:popExit')
				: nativeMotion.events.includes('ios:2')),
		JSON.stringify(nativeMotion.events),
	)

	nativeMotion.directions.length = 0
	const motionModal = await refined.navigation.push({
		stack: 'root',
		to: '/modal/:id',
		params: { id: 'motion-modal' },
		transition: 'native-view',
	})
	check('native modal view motion commits before settling', motionModal.status === 'committed')
	const motionModalFlow = refined.platform.modals.getSnapshot().at(-1)!.flow
	const motionModalTarget = refined.platform.getModalView(motionModalFlow)!
	check(
		'native modal content starts at custom values',
		motionModalTarget.opacity < 1 || motionModalTarget.translateX !== 0,
		JSON.stringify({
			opacity: motionModalTarget.opacity,
			translateX: motionModalTarget.translateX,
		}),
	)
	await wait(
		'native modal view motion samples intermediate values',
		() => {
			const v = sampleViewMotion(motionModalTarget)
			return v.opacity > 0 && v.opacity < 1
		},
	)
	check(
		'native modal view motion completes',
		motionModal.status === 'committed' &&
			(await motionModal.finished).status === 'completed',
	)
	check(
		'native modal view motion restores neutral values',
		sampleViewMotion(motionModalTarget).opacity === 1 &&
			sampleViewMotion(motionModalTarget).translateX === 0,
	)
	check(
		'native modal motion direction is forward',
		nativeMotion.directions.at(-1) === 'forward:push',
		JSON.stringify(nativeMotion.directions),
	)
	check(
		'native modal dismisses after view motion',
		(await modalNavigator()!.dismiss()).status === 'committed',
	)
	await wait('motion modal closed', () => !(frame.currentPage as any)?.modal)

	const interruptedModal = await refined.navigation.push({
		stack: 'root',
		to: '/modal/:id',
		params: { id: 'motion-interrupted' },
		transition: 'native-view',
	})
	check('interrupted modal commits', interruptedModal.status === 'committed')
	const interruptedFlow = refined.platform.modals.getSnapshot().at(-1)!.flow
	const interruptedTarget = refined.platform.getModalView(interruptedFlow)!
	const interruptedDismiss = modalNavigator()!.dismiss()
	check(
		'modal dismissal interrupts view motion',
		interruptedModal.status === 'committed' &&
			(await interruptedModal.finished).status === 'skipped',
	)
	check(
		'modal interruption restores neutral values',
		sampleViewMotion(interruptedTarget).opacity === 1 &&
			sampleViewMotion(interruptedTarget).translateX === 0,
		JSON.stringify(sampleViewMotion(interruptedTarget)),
	)
	check('interrupted modal dismissal commits', (await interruptedDismiss).status === 'committed')
	await wait('interrupted modal closed', () => !(frame.currentPage as any)?.modal)

	check(
		'Frame history redirect source commits',
		(
			await modern.push({
				to: '/refined/:id',
				params: { id: 'history-source' },
				transition: 'none',
			})
		).status === 'committed',
	)
	const redirectSource = frame.currentPage
	const redirectDepth = frame.backStack.length
	refined.setFrameRedirect('failure')
	const rejectedHistory = await modern.back()
	check(
		'failed Frame history redirect reports rendering failure',
		rejectedHistory.status === 'failed' && rejectedHistory.phase === 'commit',
	)
	check(
		'failed Frame history redirect preserves native history',
		frame.currentPage === redirectSource && frame.backStack.length === redirectDepth,
	)
	check(
		'failed Frame history redirect preserves retained local state',
		refinedObservations.entries.get('coat')?.count === 1,
	)
	refined.setFrameRedirect('record')
	const redirectedHistory = await modern.retry()
	check(
		'Frame history redirect commits',
		redirectedHistory.status === 'committed' && redirectedHistory.redirected,
	)
	check(
		'Frame history redirect retains the Page with fresh screen state',
		frame.currentPage === coatPage && refinedObservations.entries.get('history-cap')?.count === 0,
	)
	check(
		'Frame history redirect retains providers and prepared data',
		refinedObservations.entries.get('history-cap')?.provider === 'Jordan' &&
			refinedObservations.entries.get('history-cap')?.title === 'account-a:history-cap',
	)
	refined.setFrameRedirect('none')
	check(
		'history handoff receiver starts with an owned entry',
		(await refined.detailPane.push({ to: '/refined/:id', params: { id: 'history-receiver' } }))
			.status === 'committed',
	)
	await modern.push({ to: '/refined/:id', params: { id: 'coat' }, transition: 'none' })
	await modern.push({ to: '/refined/:id', params: { id: 'handoff-source' }, transition: 'none' })
	const handoffPage = frame.currentPage
	const handoffDepth = frame.backStack.length
	refined.setFrameRedirect('other')
	const otherHandoff = await modern.back()
	check(
		'Frame Back redirects to the named pane',
		otherHandoff.status === 'committed' &&
			otherHandoff.redirected &&
			routeId(refined.detailPane.getSnapshot().route) === 'history-other',
	)
	check(
		'cross-pane history redirect preserves the source Page and depth',
		frame.currentPage === handoffPage &&
			frame.backStack.length === handoffDepth &&
			routeId(modern.getSnapshot().route) === 'handoff-source',
	)
	check(
		'cross-pane history redirect reuses one loader result',
		refinedObservations.loads.get('history-other') === 1 &&
			refinedObservations.entries.get('history-other')?.title === 'account-a:history-other',
	)
	check(
		'history redirect replaces only the receiving pane entry',
		(await refined.detailPane.back()).status === 'committed' &&
			refined.detailPane.getSnapshot().route === null,
	)
	refined.setFrameRedirect('modal')
	const modalHandoff = await modern.back()
	const historyModal = refined.platform.modals.getSnapshot().at(-1)!
	const historyModalView = refined.platform.getModalView(historyModal.flow)!
	check(
		'Frame Back can redirect into a new modal',
		modalHandoff.status === 'committed' &&
			modalHandoff.redirected &&
			historyModalView.isLoaded &&
			texts(historyModalView).includes('refined:history-modal'),
	)
	check(
		'history modal presents over the admitted source Page',
		frame.currentPage === handoffPage &&
			frame.backStack.length === handoffDepth &&
			refinedObservations.loads.get('history-modal') === 1,
	)
	refined.setFrameRedirect('none')
	check(
		'history redirect modal dismisses back to its source',
		(await refinedObservations.navigators.get('history-modal')!.dismiss()).status === 'committed' &&
			!historyModalView.isLoaded &&
			frame.currentPage === handoffPage,
	)
	await modern.back()
	await modern.back()
	check(
		'history handoff leaves the original Back chain usable',
		routeId(modern.getSnapshot().route) === 'history-cap' && frame.currentPage === coatPage,
	)
	const beforeReplace = frame.backStack.length
	check(
		'refined replace committed',
		(await modern.replace({ to: '/refined/:id', params: { id: 'cap' }, transition: 'none' }))
			.status === 'committed',
	)
	check(
		'refined replace preserves history depth',
		frame.backStack.length === beforeReplace && texts(frame.currentPage).includes('refined:cap'),
	)
	check(
		'refined reset committed',
		(await modern.reset({ to: '/refined/:id', params: { id: 'glove' }, transition: 'none' }))
			.status === 'committed',
	)
	check(
		'refined reset clears history',
		frame.backStack.length === 0 && !modern.getSnapshot().canGoBack,
	)
	const modalPresenterPage = frame.currentPage
	check(
		'refined modal open committed',
		(
			await modern.push({
				to: '/refined/:id',
				params: { id: 'modal-one' },
				presentation: 'modal',
				transition: 'none',
			})
		).status === 'committed',
	)
	const modalFlow = refined.platform.modals.getSnapshot().at(-1)!.flow
	const modalView = refined.platform.getModalView(modalFlow)!
	const modalNavigation = refinedObservations.navigators.get('modal-one')!
	if (Application.ios) {
		check(
			'iOS routed modal disables direct SDK drag dismissal',
			(modalView as any).viewController?.modalInPresentation === true,
		)
	}
	check(
		'refined modal native surface shown',
		modalView.isLoaded && texts(modalView).includes('refined:modal-one'),
	)
	check(
		'refined modal keeps its presenter Frame',
		frame.currentPage === modalPresenterPage &&
			frame.backStack.length === 0 &&
			routeId(modern.getSnapshot().route) === 'glove',
	)
	check(
		'refined modal typed data and providers',
		refinedObservations.entries.get('modal-one')?.title === 'account-a:modal-one' &&
			refinedObservations.entries.get('modal-one')?.provider === 'Jordan' &&
			modalNavigation.getSnapshot().modal,
	)
	check(
		'refined modal base Back stays at base',
		(await modalNavigation.back()).status === 'at-base' && modalView.isLoaded,
	)
	refinedObservations.increments.get('modal-one')!()
	await wait(
		'refined modal local state',
		() => refinedObservations.entries.get('modal-one')?.count === 1,
	)
	check(
		'refined modal inner push committed',
		(await modalNavigation.push({ to: '/refined/:id', params: { id: 'modal-two' } })).status ===
			'committed',
	)
	check(
		'refined modal uses one surface for two screens',
		refined.platform.modals.getSnapshot().length === 1 &&
			refined.platform.getModalView(modalFlow) === modalView &&
			texts(modalView).includes('refined:modal-two'),
	)
	refinedObservations.changeProvider('Modal')
	await wait(
		'refined modal retained providers',
		() =>
			refinedObservations.entries.get('modal-one')?.provider === 'Modal' &&
			refinedObservations.entries.get('modal-two')?.provider === 'Modal' &&
			refinedObservations.entries.get('glove')?.provider === 'Modal',
	)
	check(
		'refined modal and presenter providers stay live',
		refinedObservations.entries.get('modal-one')?.count === 1 &&
			refinedObservations.entries.get('glove')?.provider === 'Modal',
	)
	check(
		'refined modal inner Back committed',
		(await refinedObservations.navigators.get('modal-two')!.back()).status === 'committed',
	)
	check(
		'refined modal Back restores local state',
		routeId(modalNavigation.getSnapshot().route) === 'modal-one' &&
			refinedObservations.entries.get('modal-one')?.count === 1 &&
			modalView.isLoaded,
	)
	check('refined modal refresh committed', (await modalNavigation.refresh()).status === 'committed')
	check(
		'refined modal refresh retains surface and state',
		refined.platform.getModalView(modalFlow) === modalView &&
			refinedObservations.entries.get('modal-one')?.count === 1,
	)
	check(
		'refined nested modal open committed',
		(
			await modalNavigation.push({
				to: '/refined/:id',
				params: { id: 'modal-nested' },
				presentation: 'modal',
				transition: 'none',
			})
		).status === 'committed',
	)
	const nestedFlow = refined.platform.modals.getSnapshot().at(-1)!
	const nestedView = refined.platform.getModalView(nestedFlow.flow)!
	check(
		'refined nested modal owns its presenter flow',
		nestedFlow.presenterFlow === modalFlow &&
			nestedView.isLoaded &&
			texts(nestedView).includes('refined:modal-nested'),
	)
	refined.setAccount('nested-account-b')
	const parentLoads = refinedObservations.loads.get('modal-one')!
	const nestedDismissed = await refinedObservations.navigators.get('modal-nested')!.dismiss()
	check(
		'nested dismissal refreshes parent data without remounting its screen',
		refinedObservations.entries.get('modal-one')?.title === 'nested-account-b:modal-one' &&
			refinedObservations.entries.get('modal-one')?.count === 1 &&
			refinedObservations.loads.get('modal-one') === parentLoads + 1,
	)
	refined.setAccount('account-a')
	check(
		'refined nested dismiss returns parent match',
		nestedDismissed.status === 'committed' && routeId(nestedDismissed.route) === 'modal-one',
	)
	check(
		'refined nested dismiss keeps parent surface',
		refined.platform.modals.getSnapshot().length === 1 &&
			refined.platform.getModalView(modalFlow) === modalView &&
			!nestedView.isLoaded,
	)
	check(
		'refined modal reset committed',
		(await modalNavigation.reset({ to: '/refined/:id', params: { id: 'modal-base' } })).status ===
			'committed',
	)
	check(
		'refined modal reset establishes a new base',
		!modalNavigation.getSnapshot().canGoBack &&
			modalNavigation.getSnapshot().modal &&
			routeId(modalNavigation.getSnapshot().route) === 'modal-base',
	)
	refinedObservations.setDirtyEntry('modal-base')
	await wait(
		'dirty modal entry committed',
		() => refinedObservations.dirtyEntries.get('modal-base') === true,
	)
	const heldDismissal = modalNavigation.dismiss()
	await wait(
		'modal confirmation',
		() => refinedObservations.blockers.get('modal-base')?.status === 'blocked',
	)
	check(
		'native modal owns its dismissal confirmation',
		modalView.isLoaded && texts(modalView).includes('confirmation:blocked'),
	)
	confirmation('modal-base').reset()
	check(
		'refused modal confirmation keeps the same presentation',
		(await heldDismissal).status === 'cancelled' &&
			modalView.isLoaded &&
			refined.platform.getModalView(modalFlow) === modalView,
	)
	refinedObservations.setDirtyEntry(null)
	await wait(
		'modal confirmation condition cleared',
		() => refinedObservations.dirtyEntries.get('modal-base') === false,
	)
	const presenterLoads = refinedObservations.loads.get('glove')!
	refined.setFrameAdmission(false)
	if (Application.ios) {
		await requestNavigationSwipe(frame, 'canonical-modal-down')
		check(
			'iOS downward drag cannot dismiss a protected native routed modal',
			modalView.isLoaded &&
				refined.platform.modals.getSnapshot().length === 1 &&
				frame.currentPage === modalPresenterPage &&
				refinedObservations.loads.get('glove') === presenterLoads,
		)
	}
	const deniedDismissal = await modalNavigation.dismiss()
	check(
		'native modal dismissal checks the presenter guard',
		deniedDismissal.status === 'forbidden' &&
			modalView.isLoaded &&
			frame.currentPage === modalPresenterPage &&
			refined.platform.modals.getSnapshot().length === 1,
	)
	check(
		'denied modal dismissal does not load the presenter',
		refinedObservations.loads.get('glove') === presenterLoads,
	)
	if (Application.android) {
		modalNavigation.clearFailure()
		console.log('[navigation] awaiting Android Back 5')
		await wait(
			'Android modal Back guard refusal',
			() => modalNavigation.getSnapshot().navigation.status === 'failed',
		)

		const refusal = modalNavigation.getSnapshot().navigation
		check(
			'Android OS Back checks the routed modal presenter guard before closing',
			refusal.status === 'failed' &&
				refusal.result.status === 'forbidden' &&
				modalView.isLoaded &&
				refined.platform.modals.getSnapshot().length === 1 &&
				refinedObservations.loads.get('glove') === presenterLoads,
		)
	}
	refined.setFrameAdmission(true)
	refined.setAccount('dismiss-account-b')
	const modalDismissed = await modalNavigation.retry()
	check(
		'modal dismissal retry refreshes the presenter once with current account context',
		refinedObservations.entries.get('glove')?.title === 'dismiss-account-b:glove' &&
			refinedObservations.loads.get('glove') === presenterLoads + 1,
	)
	refined.setAccount('account-a')
	check(
		'refined modal dismiss returns presenter match',
		modalDismissed.status === 'committed' && routeId(modalDismissed.route) === 'glove',
	)
	check(
		'refined modal dismiss confirms native closure',
		refined.platform.modals.getSnapshot().length === 0 &&
			!modalView.isLoaded &&
			frame.currentPage === modalPresenterPage,
	)
	check(
		'refined closed modal cannot escape to root',
		(
			await modalNavigation.push({
				to: '/refined/:id',
				params: { id: 'closed-escape' },
				stack: 'root',
			})
		).status === 'cancelled' && frame.currentPage === modalPresenterPage,
	)
	check(
		'refined replacement modal opens',
		(
			await modern.push({
				to: '/refined/:id',
				params: { id: 'modal-old' },
				presentation: 'modal',
				transition: 'none',
			})
		).status === 'committed',
	)
	const oldModalFlow = refined.platform.modals.getSnapshot().at(-1)!.flow
	const oldModalView = refined.platform.getModalView(oldModalFlow)!
	check(
		'refined root modal replacement committed',
		(
			await modern.push({
				to: '/refined/:id',
				params: { id: 'modal-new' },
				presentation: 'modal',
				transition: 'none',
			})
		).status === 'committed',
	)
	check(
		'refined root modal replacement keeps the new owner',
		refined.platform.modals.getSnapshot().length === 1 &&
			!oldModalView.isLoaded &&
			refinedObservations.mounts.get('modal-new') === 1 &&
			refinedObservations.entries.get('modal-new')?.provider === 'Modal',
	)
	check(
		'refined replacement modal dismiss committed',
		(await refinedObservations.navigators.get('modal-new')!.dismiss()).status === 'committed',
	)
	check(
		'refined replacement leaves presenter intact',
		frame.currentPage === modalPresenterPage &&
			frame.backStack.length === 0 &&
			texts(frame.currentPage).includes('refined:glove'),
	)
	check(
		'failed takeover modal opens',
		(
			await modern.push({
				to: '/refined/:id',
				params: { id: 'failure-presenter' },
				presentation: 'modal',
				transition: 'none',
			})
		).status === 'committed',
	)
	const failureFlow = refined.platform.modals.getSnapshot().at(-1)!.flow
	const failureView = refined.platform.getModalView(failureFlow)!
	{
		const failedTakeover = await modern.push({
			to: '/render-failure/:id',
			params: { id: 'failure-candidate' },
			transition: 'none',
		})

		check(
			'failed takeover reports commit failure without Frame mutation',
			failedTakeover.status === 'failed' &&
				failedTakeover.phase === 'commit' &&
				frame.currentPage === modalPresenterPage &&
				frame.backStack.length === 0,
		)

		check(
			'failed takeover retains the presented modal',
			refined.platform.modals.getSnapshot().length === 1 &&
				failureView.isLoaded &&
				texts(failureView).includes('refined:failure-presenter'),
		)
	}
	check(
		'failed takeover modal can still dismiss',
		(await refinedObservations.navigators.get('failure-presenter')!.dismiss()).status ===
			'committed' && !failureView.isLoaded,
	)
	const detailPane = refined.detailPane
	check(
		'integrated pane push committed',
		(await detailPane.push({ to: '/refined/:id', params: { id: 'named-source' } })).status ===
			'committed',
	)
	check(
		'integrated pane history stays independent from root',
		routeId(detailPane.getSnapshot().route) === 'named-source' &&
			routeId(modern.getSnapshot().route) === 'glove' &&
			frame.currentPage === modalPresenterPage,
	)
	refinedObservations.increments.get('named-source')!()
	await wait(
		'integrated pane state',
		() => refinedObservations.entries.get('named-source')?.count === 1,
	)
	const namedSource = refinedObservations.navigators.get('named-source')!
	check(
		'integrated pane modal opens',
		(
			await namedSource.push({
				to: '/refined/:id',
				params: { id: 'named-modal' },
				presentation: 'modal',
				transition: 'none',
			})
		).status === 'committed',
	)
	const namedModal = refined.platform.modals.getSnapshot().at(-1)!
	const namedView = refined.platform.getModalView(namedModal.flow)!
	check(
		'integrated pane modal owns its presenter',
		namedModal.presenterFlow === 'detail-pane' &&
			namedView.isLoaded &&
			texts(namedView).includes('refined:named-modal'),
	)
	refinedObservations.changeProvider('Pane')
	await wait(
		'integrated pane modal providers',
		() =>
			refinedObservations.entries.get('named-source')?.provider === 'Pane' &&
			refinedObservations.entries.get('named-modal')?.provider === 'Pane',
	)
	const namedDismissal = await refinedObservations.navigators.get('named-modal')!.dismiss()
	check(
		'integrated pane dismissal returns pane match',
		namedDismissal.status === 'committed' && routeId(namedDismissal.route) === 'named-source',
	)
	check(
		'integrated pane retains state and background Frame',
		refinedObservations.entries.get('named-source')?.count === 1 &&
			!namedView.isLoaded &&
			frame.currentPage === modalPresenterPage,
	)
	check('integrated pane Back committed', (await detailPane.back()).status === 'committed')
	check(
		'integrated pane Back reaches its own base',
		detailPane.getSnapshot().route === null && routeId(modern.getSnapshot().route) === 'glove',
	)
	check(
		'integrated pane takeover modal opens',
		(
			await detailPane.push({
				to: '/refined/:id',
				params: { id: 'named-takeover' },
				presentation: 'modal',
				transition: 'none',
			})
		).status === 'committed',
	)
	const takeoverView = refined.platform.getModalView(
		refined.platform.modals.getSnapshot().at(-1)!.flow,
	)!
	check(
		'root takeover after pane modal committed',
		(await modern.push({ to: '/refined/:id', params: { id: 'root-takeover' }, transition: 'none' }))
			.status === 'committed',
	)
	check(
		'root takeover closes pane modal and retains pane base',
		!takeoverView.isLoaded &&
			refined.platform.modals.getSnapshot().length === 0 &&
			detailPane.getSnapshot().route === null &&
			refinedObservations.mounts.get('root-takeover') === 1,
	)
	check(
		'root takeover Back restores presenter',
		(await modern.back()).status === 'committed' && frame.currentPage === modalPresenterPage,
	)
	if (Application.android) {
		check(
			'refined OS Back modal opens',
			(
				await detailPane.push({
					to: '/refined/:id',
					params: { id: 'os-modal-one' },
					presentation: 'modal',
					transition: 'none',
				})
			).status === 'committed',
		)

		const osFlow = refined.platform.modals.getSnapshot().at(-1)!.flow
		const osView = refined.platform.getModalView(osFlow)!
		const osModal = refinedObservations.navigators.get('os-modal-one')!
		check(
			'refined OS Back inner screen opens',
			(await osModal.push({ to: '/refined/:id', params: { id: 'os-modal-two' } })).status ===
				'committed',
		)

		console.log('[navigation] awaiting Android Back 1')
		await wait(
			'real Android Back inside modal',
			() => routeId(osModal.getSnapshot().route) === 'os-modal-one',
		)

		check(
			'refined OS Back pops modal step',
			osView.isLoaded && texts(osView).includes('refined:os-modal-one'),
		)

		check(
			'refined OS Back retains background Frame',
			frame.currentPage === modalPresenterPage && frame.backStack.length === 0,
		)

		console.log('[navigation] awaiting Android Back 2')
		await wait(
			'real Android Back dismisses modal base',
			() => refined.platform.modals.getSnapshot().length === 0,
		)

		check(
			'refined OS Back closes modal at base',
			!osView.isLoaded && frame.currentPage === modalPresenterPage,
		)

		check(
			'refined OS Back root push',
			(await modern.push({ to: '/refined/:id', params: { id: 'os-root' }, transition: 'none' }))
				.status === 'committed',
		)

		console.log('[navigation] awaiting Android Back 3')
		await wait(
			'real Android Back in root Frame',
			() => routeId(modern.getSnapshot().route) === 'glove',
		)

		check(
			'refined OS Back restores retained root Page',
			frame.currentPage === modalPresenterPage && frame.backStack.length === 0,
		)
	}
	const beforeRemount = frame.currentPage
	refined.setAccount('account-b')
	refinedObservations.remountOwner()
	await wait(
		'keyed owner commits after Frame restoration',
		() => refinedObservations.remountResult !== null,
	)
	check(
		'keyed owner navigation commits',
		refinedObservations.remountResult?.status === 'committed',
		JSON.stringify(refinedObservations.remountResult),
	)
	check(
		'keyed owner uses fresh account context',
		refinedObservations.entries.get('remounted-1')?.title === 'account-b:remounted-1',
	)
	check(
		'keyed owner releases old views and owned history',
		frame.currentPage !== beforeRemount && modern.getSnapshot().canGoBack === false,
	)

	check(
		'modal before keyed owner remount opens',
		(
			await modern.push({
				to: '/refined/:id',
				params: { id: 'before-key-modal' },
				presentation: 'modal',
				transition: 'none',
			})
		).status === 'committed',
	)
	const beforeKeyModal = refined.platform.getModalView(
		refined.platform.modals.getSnapshot().at(-1)!.flow,
	)!
	refined.setAccount('account-c')
	refinedObservations.remountOwner()
	await wait(
		'keyed owner replaces modal ownership',
		() =>
			refinedObservations.remountResult !== null &&
			refined.platform.modals.getSnapshot().length === 0,
	)
	check(
		'keyed owner navigation commits after modal cleanup',
		refinedObservations.remountResult?.status === 'committed',
		JSON.stringify(refinedObservations.remountResult),
	)
	check('keyed owner unloads the previous modal', !beforeKeyModal.isLoaded)
	check(
		'keyed modal remount uses fresh account data',
		refinedObservations.entries.get('remounted-2')?.title === 'account-c:remounted-2' &&
			!modern.getSnapshot().canGoBack,
	)

	refinedObservations.closeOwner()
	await wait('refined owner returns initial Page', () => frame.currentPage === page).catch(
		(error) => {
			throw new Error(
				String(error) +
					' ' +
					JSON.stringify({
						ownerPresent: refinedObservations.ownerPresent,
						ownerEvents: refinedObservations.ownerEvents,
						current: frame.currentPage?.id,
						expected: page.id,
						depth: frame.backStack.length,
						texts: texts(frame.currentPage),
					}),
			)
		},
	)
	check('refined owner teardown returns its declaring Page', frame.currentPage === page)
	check(
		'refined owner teardown restores source content',
		texts(page).includes('First') && texts(page).includes('Second'),
	)
	modern.dispose()
	refinedObservations.showPanes(true)
	await wait('rendered pane outlet mounted', () =>
		refined.panePlatform.views.getSnapshot().has('root'),
	)
	const panes = refined.panes
	check(
		'pane push committed',
		(await panes.push({ to: '/pane/:id', params: { id: 'coat' } })).status === 'committed',
	)
	check('pane rendered before result', texts(page).includes('pane:coat'))
	refinedObservations.paneEntries.get('coat')!.increment()
	await wait('pane local state', () => refinedObservations.paneEntries.get('coat')?.count === 1)
	check(
		'pane second push committed',
		(await panes.push({ to: '/pane/:id', params: { id: 'hat' } })).status === 'committed',
	)
	refinedObservations.changeProvider('Morgan')
	await wait(
		'pane provider updates',
		() =>
			refinedObservations.paneEntries.get('coat')?.provider === 'Morgan' &&
			refinedObservations.paneEntries.get('hat')?.provider === 'Morgan',
	)
	check(
		'pane retains state and live providers',
		refinedObservations.paneEntries.get('coat')?.count === 1 &&
			refinedObservations.paneEntries.get('coat')?.title === 'coat:1',
	)
	refined.setPaneAdmission(false)
	check('pane Back refuses a denied retained entry', (await panes.back()).status === 'forbidden')
	check(
		'denied pane Back retains its current screen',
		routeId(panes.getSnapshot().route) === 'hat' && texts(page).includes('pane:hat'),
	)
	refined.setPaneAdmission(true)
	check('pane Back retry committed', (await panes.retry()).status === 'committed')
	check(
		'pane Back restores retained state',
		refinedObservations.paneEntries.get('coat')?.count === 1 && texts(page).includes('pane:coat'),
	)
	check(
		'pane Back loads fresh data',
		refinedObservations.paneEntries.get('coat')?.title === 'coat:3',
	)

	nativeMotion.directions.length = 0
	const motionPane = await panes.push({
		to: '/pane/:id',
		params: { id: 'motion' },
		transition: 'native-view',
	})
	check('pane view motion commits before settling', motionPane.status === 'committed')
	const motionPaneLabel = collect(page).find((view) => view.text === 'pane:motion')
	const motionPaneTarget = motionPaneLabel?.parent?.parent
	check(
		'pane view motion starts at custom values on the owned wrapper',
		!!motionPaneTarget && motionPaneTarget.opacity < 1,
		JSON.stringify({ opacity: motionPaneTarget?.opacity }),
	)
	await wait(
		'pane view motion samples intermediate values',
		() => {
			const v = sampleViewMotion(motionPaneTarget)
			return v.opacity > 0 && v.opacity < 1
		},
	)
	check(
		'pane view motion completes',
		motionPane.status === 'committed' && (await motionPane.finished).status === 'completed',
	)
	check(
		'pane view motion restores neutral values',
		sampleViewMotion(motionPaneTarget).opacity === 1 &&
			sampleViewMotion(motionPaneTarget).translateX === 0,
	)
	check(
		'pane view motion direction is forward',
		nativeMotion.directions.at(-1) === 'forward:push',
		JSON.stringify(nativeMotion.directions),
	)
	const motionPaneBack = await panes.back()
	check('pane Back commits during incoming motion', motionPaneBack.status === 'committed')
	const backPaneLabel = collect(page).find((view) => view.text === 'pane:coat')
	const backPaneTarget = backPaneLabel?.parent?.parent
	check(
		'pane Back animates the incoming retained pane in reverse',
		nativeMotion.directions.at(-1) === 'back:back' &&
			!!backPaneTarget &&
			sampleViewMotion(backPaneTarget).translateX < 0,
		JSON.stringify({
			directions: nativeMotion.directions,
			...(backPaneTarget ? sampleViewMotion(backPaneTarget) : {}),
		}),
	)
	check(
		'pane Back view motion completes',
		motionPaneBack.status === 'committed' &&
			(await motionPaneBack.finished).status === 'completed',
	)
	check(
		'pane Back view motion restores neutral values',
		sampleViewMotion(backPaneTarget).opacity === 1 &&
			sampleViewMotion(backPaneTarget).translateX === 0,
	)
	check('pane refresh committed', (await panes.refresh()).status === 'committed')
	check(
		'pane refresh preserves state',
		refinedObservations.paneEntries.get('coat')?.count === 1 &&
			refinedObservations.paneEntries.get('coat')?.title === 'coat:6',
		`count=${refinedObservations.paneEntries.get('coat')?.count} title=${refinedObservations.paneEntries.get('coat')?.title}`,
	)
	check(
		'second pane push committed',
		(await panes.forStack('other').push({ to: '/pane/:id', params: { id: 'other' } })).status ===
			'committed',
	)
	check(
		'pane histories remain independent',
		routeId(panes.getSnapshot().route) === 'coat' &&
			routeId(panes.forStack('other').getSnapshot().route) === 'other',
	)
	check(
		'pane replace committed',
		(await panes.replace({ to: '/pane/:id', params: { id: 'cap' } })).status === 'committed',
	)
	check(
		'pane replace preserves depth',
		refined.panePlatform.views.getSnapshot().get('root')?.entries.length === 2,
	)
	check(
		'pane reset committed',
		(await panes.reset({ to: '/pane/:id', params: { id: 'glove' } })).status === 'committed',
	)
	check(
		'pane reset removes history',
		!panes.getSnapshot().canGoBack &&
			refined.panePlatform.views.getSnapshot().get('root')?.entries.length === 1,
	)
	refinedObservations.showPanes(false)
	await wait('pane owner removed', () => !refined.panePlatform.views.getSnapshot().has('root'))
	check(
		'pane owner removal releases entries',
		!refined.panePlatform.views.getSnapshot().has('other'),
	)
	panes.dispose()
	appRoot.render(DefaultClientShell as any, {})
	await wait('default client shell replaces explicit owners', () =>
		texts(page).includes('default-client-base'),
	)
	const client = await configureDefaultClient()
	await wait('default client outlet mounted', () => defaultClientObservations.ready)

	check(
		'generated baked route commits',
		(await client.navigation.push({ to: '/baked', transition: 'none' })).status === 'committed',
	)
	check('generated baked data renders', texts(frame.currentPage).includes('Baked routing:2'))
	check(
		'baked route Back returns declaring content',
		(await client.navigation.back()).status === 'committed' && frame.currentPage === page,
	)
	check(
		'generated Markdown route commits',
		(await client.navigation.push({ to: '/baked-help', transition: 'none' })).status ===
			'committed',
	)
	check('generated Markdown content renders', texts(frame.currentPage).includes('Baked route help'))
	check(
		'Markdown Back returns declaring content',
		(await client.navigation.back()).status === 'committed' && frame.currentPage === page,
	)

	const leftBase = page.getViewById('default-base-left')
	defaultClientObservations.bases.get('left')!.increment()
	await wait(
		'default tab base local state',
		() => defaultClientObservations.bases.get('left')?.count === 1,
	)
	const clientPaneResult = await client.navigation.push({
		to: '/client/:id',
		params: { id: 'tab-coat' },
		stack: 'left',
	})
	check(
		'default Tabs named pane commits without a Frame push',
		clientPaneResult.status === 'committed' && frame.currentPage === page,
		JSON.stringify(
			clientPaneResult.status === 'failed'
				? {
						phase: clientPaneResult.phase,
						error: String(clientPaneResult.error),
						stack:
							clientPaneResult.error instanceof Error ? clientPaneResult.error.stack : undefined,
					}
				: clientPaneResult,
		),
	)
	const tabCoat = page.getViewById('client-tab-coat')
	const tabEntry = defaultClientObservations.entries.get('tab-coat')!
	check(
		'default Tabs pane inherits providers and owning flow',
		tabEntry.provider === 'Default owner' &&
			tabEntry.navigator.getSnapshot().canGoBack &&
			client.platform.host.getSnapshot('left').route?.stack === 'left' &&
			!!tabCoat?.isLoaded,
	)
	tabEntry.increment()
	await wait(
		'default tab route local state',
		() => defaultClientObservations.entries.get('tab-coat')?.count === 1,
	)
	defaultClientObservations.selectTab('right')
	await wait('default tab selection right', () => defaultClientObservations.selectedTab === 'right')
	check(
		'default Tabs retain inactive pane identity and state',
		page.getViewById('client-tab-coat') === tabCoat &&
			defaultClientObservations.entries.get('tab-coat')?.count === 1,
	)
	defaultClientObservations.selectTab('left')
	await wait('default tab selection left', () => defaultClientObservations.selectedTab === 'left')
	check(
		'default Tabs pane modal opens with its source presenter',
		(await client.navigation.navigateUrl('/left/client-modal/tab-modal')).status === 'committed' &&
			client.platform.modals.getSnapshot().at(-1)?.presenterFlow === 'left' &&
			frame.currentPage === page,
	)
	check(
		'default Tabs pane modal dismiss preserves its retained pane',
		(await defaultClientObservations.entries.get('tab-modal')!.navigator.dismiss()).status ===
			'committed' &&
			page.getViewById('client-tab-coat') === tabCoat &&
			defaultClientObservations.entries.get('tab-coat')?.count === 1,
	)
	check(
		'default Tabs pane Back restores its retained base',
		(await tabEntry.navigator.back()).status === 'committed' &&
			page.getViewById('default-base-left') === leftBase &&
			defaultClientObservations.bases.get('left')?.count === 1 &&
			frame.currentPage === page,
	)
	check(
		'default client commits a validated incoming URL',
		(await client.navigation.navigateUrl('/client/coat')).status === 'committed',
	)
	const clientCoat = frame.currentPage
	const clientEntry = defaultClientObservations.entries.get('coat')!
	check(
		'default client preserves source providers and guard data',
		clientEntry.title === 'default-account:coat' &&
			clientEntry.provider === 'Default owner' &&
			clientEntry.guarded &&
			texts(clientCoat).includes('client:coat'),
	)
	clientEntry.increment()
	await wait(
		'default client local state',
		() => defaultClientObservations.entries.get('coat')?.count === 1,
	)
	check(
		'default client second Page commits',
		(await client.navigation.navigateUrl('/client/hat')).status === 'committed',
	)
	check(
		'default client owner-bound Back commits',
		(await defaultClientObservations.entries.get('hat')!.navigator.back()).status === 'committed',
	)
	check(
		'default client Back retains Page identity and state',
		frame.currentPage === clientCoat && defaultClientObservations.entries.get('coat')?.count === 1,
	)
	check(
		'default client modal commits',
		(await client.navigation.navigateUrl('/client-modal/glove')).status === 'committed',
	)
	const clientModal = defaultClientObservations.entries.get('glove')!
	const clientModalFlow = client.platform.modals.getSnapshot().at(-1)!.flow
	check(
		'default client modal owns its navigator and presenter',
		clientModal.navigator.getSnapshot().modal &&
			clientModal.provider === 'Default owner' &&
			client.platform.getModalView(clientModalFlow)?.isLoaded === true &&
			frame.currentPage === clientCoat,
	)
	check(
		'default client dismiss commits',
		(await clientModal.navigator.dismiss()).status === 'committed',
	)
	check(
		'default client modal disposal preserves its presenter',
		client.platform.modals.getSnapshot().length === 0 &&
			frame.currentPage === clientCoat &&
			(await clientModal.navigator.back()).status === 'cancelled',
	)
	check(
		'default client returns to declaring Page',
		(await client.navigation.back()).status === 'committed' && frame.currentPage === page,
	)
	check(
		'default incoming URL commits',
		(await client.navigation.navigateUrl('xplat://client/typed')).status === 'committed',
	)
	const typed = defaultClientObservations.entries.get('typed')!
	check(
		'default hooks share prepared data and Back state',
		typed.title === 'default-account:typed' && typed.routeId === 'typed' && typed.back,
	)
	check(
		'default modal incoming URL commits',
		(await client.navigation.navigateUrl('xplat://client-modal/typed-modal')).status ===
			'committed',
	)
	const typedModal = defaultClientObservations.entries.get('typed-modal')!
	check(
		'default modal hook owns its presentation',
		typedModal.modal && typedModal.routeId === 'typed-modal',
	)
	await typedModal.navigator.dismiss()
	check(
		'default dismiss retains presenter',
		routeId(client.navigation.getSnapshot().route) === 'typed' && frame.currentPage !== page,
	)
	await typed.navigator.back()
	await wait(
		'default Back returns to base',
		() => client.navigation.getSnapshot().route === null && frame.currentPage === page,
	)
	check('default base has no Back history', !client.navigation.getSnapshot().canGoBack)
	client.navigation.dispose()
	appRoot.unmount()
	await checkNativeBackEvents(frame, page, check, wait)
	await qualifyPaneRouterExample({
		mount(Component, props) {
			appRoot = createNativeScriptRoot(host)
			// The universal compiler adds the renderer brand during the build;
			// the shared fixture callback deliberately has a renderer-neutral type.
			appRoot.render(Component as unknown as Parameters<typeof appRoot.render>[0], props)
			return () => appRoot.unmount()
		},
		find: (id) => host.getViewById(id),
		check,
		wait,
	})
	const authentication = createNativeModalRouterHost({
		getFrame: (flow) => (flow === 'root' ? frame : undefined),
	})
	await qualifyNativeAuthentication({
		host: authentication,
		mount(Component, props) {
			appRoot = createNativeScriptRoot(host)
			// The universal compiler supplies the component's renderer brand.
			appRoot.render(Component as unknown as Parameters<typeof appRoot.render>[0], props)
			return () => appRoot.unmount()
		},
		modals: () => authentication.modals.getSnapshot().length,
		check,
		wait,
		settled: () =>
			wait(
				'authentication owner returns to base Page',
				() => frame.currentPage === page && authentication.modals.getSnapshot().length === 0,
			),
	})
	for (const pane of [false, true]) {
		const retentionPhase = (name: string) => {
			File.fromPath(
				knownFolders.documents().path + '/navigation-retention-phase.json',
			).writeTextSync(JSON.stringify({ name }))
		}

		const retention = createNativeModalRouterHost({
			getFrame: (flow) => (flow === 'root' ? frame : undefined),
		})

		await qualifyRouteRetention({
			host: retention,
			pane,
			mount(Component, props) {
				appRoot = createNativeScriptRoot(host)
				appRoot.render(Component as unknown as Parameters<typeof appRoot.render>[0], props)
				return () => appRoot.unmount()
			},
			offset(scroll) {
				const view = scroll.native as any
				if (view.ios) {
					return Number(view.ios.contentOffset.y)
				}
				const native = view.android
				return native.getScrollY() / native.getResources().getDisplayMetrics().density
			},
			range(scroll) {
				const view = scroll.native as any
				if (view.ios) {
					return Math.max(
						0,
						Number(view.ios.contentSize.height) - Number(view.ios.bounds.size.height),
					)
				}
				const native = view.android
				return (
					Math.max(0, native.computeVerticalScrollRange() - native.getHeight()) /
					native.getResources().getDisplayMetrics().density
				)
			},
			describe(scroll) {
				const view = scroll.native as any
				return {
					type: view?.constructor?.name,
					scroll: typeof view?.scrollTo,
					size: view?.getActualSize?.(),
					offset: view?.scrollTop,
					range: Math.max(0, Number(view?.scrollHeight ?? 0) - Number(view?.clientHeight ?? 0)),
					keys: Object.keys(view ?? {}).slice(0, 12),
				}
			},
			focused(input) {
				const field = input.native as any
				if (!field.ios) {
					return !!field.android?.hasFocus()
				}
				const value = field.ios.isFirstResponder
				return typeof value === 'function' ? !!value.call(field.ios) : !!value
			},
			check(name, pass) {
				retentionPhase(name)
				check(name, pass)
			},
			wait(name, condition) {
				retentionPhase(name)
				return wait(name, condition)
			},
			settled: () =>
				wait(
					'retention owner returns to base Page',
					() => frame.currentPage === page && retention.modals.getSnapshot().length === 0,
				),
		})
	}
	check('suite complete', true)
}

Application.run({
	create: () => {
		// Window-dependent layout effects require UIApplication to exist. Construct
		// the rendered root at native launch, rather than during module evaluation.
		appRoot = createNativeScriptRoot(host)
		appRoot.render(RefinedNavigationShell as any, { fixture: refined })
		frame.navigate({ create: () => page })
		registerStack('root', frame)
		setTimeout(() => {
			void run()
				.catch((error) => results.push({ name: 'suite error', pass: false, detail: String(error) }))
				.finally(() => {
					const report = {
						target: Application.android ? 'android' : 'ios',
						results,
						pass: results.every((r) => r.pass),
					}

					File.fromPath(knownFolders.documents().path + '/navigation-check.json').writeTextSync(
						JSON.stringify(report),
					)

					if (Application.android) {
						// Android limits individual log lines. Keep each chunk below
						// that limit even with escaped strings and Unicode text.
						const characters = Array.from(JSON.stringify(report))
						const total = Math.ceil(characters.length / 400)
						for (let index = 0; index < total; index++) {
							console.log(
								'[navigation] result-chunk ' +
									JSON.stringify({
										index,
										total,
										data: characters.slice(index * 400, (index + 1) * 400).join(''),
									}),
							)
						}
					} else {
						console.log('[navigation] result ' + JSON.stringify(report))
					}
				})
		}, 100)
		return frame
	},
})
