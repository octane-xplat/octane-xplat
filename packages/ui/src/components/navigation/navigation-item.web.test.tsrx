/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { expect, it, vi } from 'vitest'
vi.mock('../../theme/theme-scheme', () => ({ useThemeScheme: () => 'light' }))
import { NavigationChrome, type NavigationChromeKind } from '../../../tests/navigation-item-cases.tsrx'
import { checkedLinkFixture } from '../../../tests/validated-destination-cases.tsrx'
import { SideNavItem } from './SideNav.web.tsrx'
import { TopNavItem } from './TopNav.web.tsrx'

const kinds: NavigationChromeKind[] = [
	'link',
	'strip',
	'side',
	'top',
	'mega',
	'breadcrumb',
	'dropdown',
	'context',
	'top-menu',
	'mega-menu',
	'overflow',
	'heading',
	'tab',
]

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

for (const kind of kinds) {
	it(`keeps ${kind} links real, checked and owned by the rendering flow`, async () => {
		const fixture = checkedLinkFixture()
		const checked = await fixture.router
			.forStack('library')
			.validateDestination({ to: '/from-data/:id', params: { id: kind }, search: { page: 2 } })

		if (checked.status !== 'valid') {
			throw new Error('Expected valid destination')
		}

		const container = document.createElement('div')
		document.body.append(container)
		const root = createRoot(container)
		const props = { kind, router: fixture.router, destination: checked.destination }
		let observer: ((event: Event) => void) | undefined
		try {
			await act(async () => {
				root.render(NavigationChrome, props)
				await settle()
			})

			if (kind === 'top-menu' || kind === 'mega-menu' || kind === 'overflow') {
				const trigger = Array.from(container.querySelectorAll('button,[role="button"]')).find(
					(node) => node.textContent?.includes(kind === 'overflow' ? '…' : 'Actions'),
				) as HTMLElement

				await act(async () => {
					trigger.click()
					await settle()
				})
			}

			const href = `/app/@library/from-data/${kind}?page=2`
			let link = document.querySelector<HTMLAnchorElement>(`a[href="${href}"]`)!
			expect(link, kind).not.toBeNull()
			let prevented = false
			const observe = (observer = (event: Event) => {
				prevented = event.defaultPrevented
				event.preventDefault()
			})

			document.addEventListener('click', observe)
			act(() =>
				link.dispatchEvent(
					new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }),
				),
			)

			expect(prevented).toBe(false)
			expect(fixture.loads).toBe(0)
			await act(async () => {
				link.click()
				await settle()
			})

			document.removeEventListener('click', observe)
			expect(prevented).toBe(true)
			expect(fixture.loads).toBe(1)
			expect(fixture.router.forStack('library').getSnapshot().route).toMatchObject({
				params: { id: kind },
				search: { page: 2 },
			})

			expect(fixture.router.getSnapshot().route).toBeNull()
			if (['link', 'strip', 'side', 'top', 'mega', 'breadcrumb', 'heading', 'tab'].includes(kind)) {
				link = document.querySelector<HTMLAnchorElement>(`a[href="${href}"]`)!
				expect(link.getAttribute('aria-current')).toBe('page')
				await act(async () => {
					root.render(NavigationChrome, { ...props, disabled: true })
					await settle()
				})

				const target =
					document.querySelector<HTMLAnchorElement>(`a[href="${href}"]`) ??
					container.querySelector<HTMLElement>('[aria-disabled="true"]') ??
					container.querySelector<HTMLButtonElement>('button')!

				await act(async () => {
					target.click()
					await settle()
				})

				expect(fixture.loads).toBe(1)
			}
		} finally {
			if (observer) {
				document.removeEventListener('click', observer)
			}

			await act(async () => {
				root.unmount()
				await settle()
			})

			container.remove()
			fixture.router.dispose()
		}
	})
}

it('keeps external links and action items usable outside routing providers', () => {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	let clicks = 0
	try {
		act(() => root.render(SideNavItem, { label: 'External', href: 'https://example.com/help' }))
		expect(host.querySelector('a')?.href).toBe('https://example.com/help')
		act(() =>
			root.render(TopNavItem, {
				label: 'Action',
				onClick: () => {
					clicks++
				},
			}),
		)

		act(() => host.querySelector('button')!.click())
		expect(clicks).toBe(1)
	} finally {
		act(() => root.unmount())
		host.remove()
	}
})

for (const implicit of [false, true]) {
	it(`allows cancellation and ${implicit ? 'provider-bound' : 'explicit'} opaque navigation`, async () => {
		const fixture = checkedLinkFixture()
		const checked = await fixture.router.forStack('library').validateDestination({
			to: '/from-data/:id',
			params: { id: 'cancelled' },
			search: { page: 2 },
		})

		if (checked.status !== 'valid') {
			throw new Error('Expected checked destination')
		}

		const host = document.createElement('div')
		document.body.append(host)
		const root = createRoot(host)
		try {
			await act(async () => {
				root.render(NavigationChrome, {
					router: fixture.router,
					destination: checked.destination,
					kind: 'side',
					implicit,
					cancel: true,
				})

				await settle()
			})

			await act(async () => {
				host.querySelector('a')!.click()
				await settle()
			})

			expect(fixture.loads).toBe(0)
			await act(async () => {
				root.render(NavigationChrome, {
					router: fixture.router,
					destination: checked.destination,
					kind: 'side',
					implicit,
				})

				await settle()
			})

			await act(async () => {
				host.querySelector('a')!.click()
				await settle()
			})

			expect(fixture.loads).toBe(1)
			expect(fixture.router.forStack('library').getSnapshot().route?.params.id).toBe('cancelled')
		} finally {
			act(() => root.unmount())
			host.remove()
			fixture.router.dispose()
		}
	})
}

it('keeps a prevented menu link open without loading its route', async () => {
	const fixture = checkedLinkFixture()
	const checked = await fixture.router.forStack('library').validateDestination({
		to: '/from-data/:id',
		params: { id: 'cancelled-menu' },
		search: { page: 2 },
	})

	if (checked.status !== 'valid') {
		throw new Error('Expected checked destination')
	}

	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	try {
		await act(async () => {
			root.render(NavigationChrome, {
				router: fixture.router,
				destination: checked.destination,
				kind: 'dropdown',
				cancel: true,
			})

			await settle()
		})

		const link = document.querySelector<HTMLAnchorElement>(
			'a[href="/app/@library/from-data/cancelled-menu?page=2"]',
		)!

		await act(async () => {
			link.click()
			await settle()
		})

		expect(fixture.loads).toBe(0)
		expect(document.querySelector('[role="menu"]')).not.toBeNull()
	} finally {
		act(() => root.unmount())
		host.remove()
		fixture.router.dispose()
	}
})
