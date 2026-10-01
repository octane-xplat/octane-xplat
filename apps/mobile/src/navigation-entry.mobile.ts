import { Application, File, Frame, GridLayout, Page, knownFolders } from '@nativescript/core'
import { createNativeScriptRoot } from '@nativescript-community/octane'
import {
	addBackInterceptor,
	addRoutes,
	canGoBack,
	currentModalRoute,
	defineRoutes,
	getStack,
	popRoute,
	pushDeepLink,
	pushRoute,
	redirect,
	registerStack,
	routeFor,
} from '@octane-xplat/ui'

import { consumeInitialUrl, onDeepLink } from '@octane-xplat/platform'
// oxlint-disable-next-line xplat/no-ts-imports-tsrx — isolated compiled fixture
import { NavigationScreen, NavigationShell } from './navigation-fixture.mobile.tsrx'
import { NavigationTabs } from './navigation-tabs'
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/chrome.css'

const results: { name: string; pass: boolean; detail?: string }[] = []
const frame = new Frame()
const page = new Page()
const host = new GridLayout()
page.content = host
page.actionBarHidden = true
createNativeScriptRoot(host).render(NavigationShell as any, {})
frame.navigate({ create: () => page })
registerStack('root', frame)
const incoming: string[] = []
onDeepLink((url) => incoming.push(url))
Application.run({ create: () => frame })

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
	while (view && !view.getGestureObservers?.(1)?.length) {
		view = view.parent
	}

	check('tab target loaded ' + label, view?.isLoaded === true)
	for (const observer of view.getGestureObservers(1)) {
		observer.callback.call(observer.context, { eventName: 'tap', object: view })
	}

	await pause()
}

const push = (stack: string, id: string, name = 'nav/:id') =>
	pushRoute({ stack, name, params: { id } })

async function shown(stack: string, id: string, view: any = page): Promise<void> {
	await wait(
		'route ' + id,
		() => routeFor(stack)?.params.id === id && texts(view).includes('route:' + id),
	)
}

function hardwareBack(): boolean {
	const event = { eventName: 'activityBackPressed', object: Application.android, cancel: false }
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
		check('cold incoming link dispatched', pushDeepLink(initial))
		await wait(
			'cold screen',
			() =>
				routeFor('root')?.params.id === 'cold' && texts(frame.currentPage).includes('route:cold'),
		)

		check('cold incoming link once', frame.backStack.length === 1 && incoming.length === 0)
		popRoute()
		await wait('cold pop', () => routeFor('root') === null && frame.currentPage === page)
	}

	push('first', 'one')
	await shown('first', 'one')
	check('named layout', texts(page).includes('navigation layout'))
	push('first', 'two')
	await shown('first', 'two')
	popRoute('first')
	await shown('first', 'one')
	check('named push/pop uses route store', canGoBack('first'))
	await select('Second')
	push('second', 'other')
	await shown('second', 'other')
	await select('First')
	await shown('first', 'one')
	check('tab switches retain history', routeFor('second')?.params.id === 'other')
	popRoute('first')
	await wait('first base restored', () => texts(page).includes('first base'))

	addRoutes(
		defineRoutes([
			{ path: 'runtime/:id', screen: NavigationScreen, loader: (p) => 'runtime-' + p.id },
		]),
	)

	push('first', 'runtime', 'runtime/:id')
	await shown('first', 'runtime')
	await wait('runtime loader', () => texts(page).includes('data:runtime-runtime'))
	check('addRoutes loader renders', true)
	popRoute('first')
	push('first', 'guarded', 'loaded/:id')
	await shown('first', 'guarded')
	check(
		'guard context and loader render',
		texts(page).includes('guard:true') && texts(page).includes('data:loaded-guarded'),
	)

	pushRoute({ stack: 'first', name: 'blocked', params: {} })
	await pause()
	check('rejected guard leaves route', routeFor('first')?.params.id === 'guarded')
	addRoutes(
		defineRoutes([
			{
				path: 'redirected',
				screen: NavigationScreen,
				beforeLoad: () => redirect({ stack: 'first', name: 'nav/:id', params: { id: 'redirect' } }),
			},
		]),
	)

	pushRoute({ stack: 'first', name: 'redirected', params: {} })
	await shown('first', 'redirect')
	popRoute('first')
	await shown('first', 'guarded')
	check('redirect skips intermediate entry', true)
	push('first', 'error', 'broken/:id')
	await shown('first', 'error')
	check('loader rejection reaches screen', texts(page).includes('error:expected loader failure'))
	popRoute('first')
	await shown('first', 'guarded')

	push('root', 'root')
	await wait(
		'root pushed',
		() => routeFor('root')?.params.id === 'root' && texts(frame.currentPage).includes('route:root'),
	)

	push('root', 'modal', 'modal/:id')
	await wait(
		'modal mounted',
		() =>
			currentModalRoute()?.params.id === 'modal' &&
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
			hardwareBack() && currentModalRoute()?.params.id === 'modal',
		)

		check('hardware interceptor newest first', calls.join(',') === 'new')
		newest()
		check(
			'hardware dismisses modal first',
			hardwareBack() && currentModalRoute() === null && routeFor('root')?.params.id === 'root',
		)

		await wait('modal native dismissal', () => !(frame.currentPage as any)?.modal)
		check('older interceptor resumed', calls.join(',') === 'new,old')
		old()
		check('hardware pops root before named', hardwareBack())
	} else {
		popRoute()
		await wait(
			'modal dismissed',
			() => currentModalRoute() === null && !(frame.currentPage as any)?.modal,
		)

		check('modal dismissal retains presenter', routeFor('root')?.params.id === 'root')
		popRoute()
	}

	await wait('root restored', () => frame.currentPage === page && routeFor('root') === null)
	if (Application.android) {
		check(
			'hardware pops most recent named stack',
			hardwareBack() && routeFor('first') === null && routeFor('second')?.params.id === 'other',
		)

		check('hardware pops remaining named stack', hardwareBack() && routeFor('second') === null)
		check('hardware base falls through', !hardwareBack())
	} else {
		popRoute('second')
		popRoute('first')
	}

	check('unknown incoming link rejected', !pushDeepLink('xplatnav://missing'))
	check('malformed incoming link rejected', !pushDeepLink('xplatnav://nav/%'))
	check('runtime incoming link dispatched', pushDeepLink('xplatnav://first/runtime/link'))
	await shown('first', 'link')
	popRoute('first')

	if (Application.ios) {
		addRoutes(defineRoutes([{ path: 'ios-tabs', screen: NavigationTabs }]))
		pushRoute({ stack: 'root', name: 'ios-tabs', params: {} })
		await wait('UITabBar loaded', () => !!getStack('ios-first')?.currentPage)
		const tabview = frame.currentPage.getViewById('nav-ios-tabs') as any
		const items = tabview.items
		for (let i = 0; i < 3; i++) {
			tabview.items = [...items]
			tabview.selectedIndex = 1
			await wait('second tab loaded', () => !!getStack('ios-second')?.currentPage)
			tabview.selectedIndex = 0
			await pause()
			push('ios-first', 'ios-' + i)
			await wait('UITabBar push', () => routeFor('ios-first')?.params.id === 'ios-' + i)
			check(
				'UITabBar items stable ' + i,
				tabview.items.every((item: any, index: number) => item === items[index]) &&
					getStack('ios-first')?.backStack.length === 1,
			)

			popRoute('ios-first')
			await wait('UITabBar pop', () => routeFor('ios-first') === null)
		}

		popRoute()
		await wait('UITabBar root pop', () => frame.currentPage === page)
	}

	console.log('[navigation] awaiting warm OS links')
	File.fromPath(knownFolders.documents().path + '/navigation-check.json').writeTextSync(
		JSON.stringify({ awaitingWarmLinks: true, results }),
	)

	for (let i = 1; i <= 2; i++) {
		await wait('warm OS link ' + i, () => incoming.length >= i)
		check('warm incoming dispatch ' + i, pushDeepLink(incoming[i - 1]))
		await wait('warm route ' + i, () => routeFor('root')?.params.id === 'warm')
		check('warm incoming once ' + i, frame.backStack.length === i)
	}

	check('suite complete', true)
}

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

			console.log('[navigation] result ' + JSON.stringify(report))
		})
}, 100)
