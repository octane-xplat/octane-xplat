// @vitest-environment jsdom
/** @jsxImportSource @octane-xplat/jsx/dom */
import { act, createRoot } from 'octane'
import { expect, it } from 'vitest'
import { CheckedLinks, checkedLinkFixture } from '../../tests/validated-destination-cases.tsrx'

it('renders a checked runtime destination as a real anchor and preserves ownership through to', async () => {
	const fixture = checkedLinkFixture()
	const checked = await fixture.router
		.forStack('library')
		.validateDestination({ to: '/from-data/:id', params: { id: 'coat' }, search: { page: 2 } })

	if (checked.status !== 'valid') {
		throw new Error('Expected valid destination')
	}

	const container = document.createElement('div')
	document.body.append(container)
	const root = createRoot(container)
	const props = { router: fixture.router, destination: checked.destination }
	try {
		act(() => root.render(CheckedLinks, props))
		const link = container.querySelector('a')!
		expect(link.textContent).toBe('Open checked')
		expect(link.getAttribute('href')).toBe('/app/@library/from-data/coat?page=2')
		let prevented = false
		container.addEventListener('click', (event) => {
			prevented = event.defaultPrevented
			event.preventDefault()
		})

		act(() =>
			link.dispatchEvent(
				new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }),
			),
		)

		expect(prevented).toBe(false)
		expect(fixture.loads).toBe(0)
		await act(async () => {
			link.click()
			await new Promise((resolve) => setTimeout(resolve, 0))
		})

		expect(prevented).toBe(true)
		expect(fixture.router.forStack('library').getSnapshot().route).toMatchObject({
			contract: 'runtime',
			params: { id: 'coat' },
			data: 'coat:2',
		})

		expect(fixture.router.getSnapshot().route).toBeNull()
		expect(link.getAttribute('aria-current')).toBe('page')
		expect(link.classList.contains('selected')).toBe(true)
		act(() => root.render(CheckedLinks, { ...props, disabled: true }))
		await act(async () => {
			link.click()
			await new Promise((resolve) => setTimeout(resolve, 0))
		})

		expect(fixture.loads).toBe(1)
		act(() => root.render(CheckedLinks, { ...props, cancel: true }))
		await act(async () => {
			link.click()
			await new Promise((resolve) => setTimeout(resolve, 0))
		})

		expect(fixture.loads).toBe(1)
		act(() => {
			fixture.registration.dispose()
			root.render(CheckedLinks, props)
		})

		expect(link.getAttribute('href')).toBe('/app/@library/from-data/coat?page=2')
		await act(async () => {
			link.click()
			await new Promise((resolve) => setTimeout(resolve, 0))
		})

		expect(fixture.loads).toBe(1)
	} finally {
		act(() => root.unmount())
		container.remove()
		fixture.router.dispose()
	}
})
