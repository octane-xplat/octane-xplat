/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { act, createRoot } from 'octane'
import { afterEach, expect, it, vi } from 'vitest'
import { InternationalizationProvider } from './InternationalizationProvider.web.tsrx'
import {
	useLocale,
	useDirection,
	useTranslator,
	frFR,
	resolveInternationalization,
	getLocaleDirection,
} from './internationalization'

import { Pagination } from './Pagination.web.tsrx'
import { useAnnounce } from './use-announce.web'

const cleanups: (() => void)[] = []
afterEach(() => {
	cleanups.splice(0).forEach((fn) => fn())
	vi.unstubAllGlobals()
})

function Read() @{
	const locale = useLocale()
	const direction = useDirection()
	const translate = useTranslator()

	<p>
		{locale}/{direction}/{translate('@astryx.selector.placeholder')}
	</p>
}

it('updates the parent scope while nested scopes and outside readers remain isolated', () => {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	cleanups.push(() => {
		root.unmount()
		host.remove()
	})

	const render = (locale: string) =>
		act(() =>
			root.render(
				<>
					<Read />
					<InternationalizationProvider locale={locale} messages={{ 'fr-FR': frFR }}>
						<Read />
						<InternationalizationProvider
							locale="en"
							dir="rtl"
							overrides={{ en: { '@astryx.selector.placeholder': 'Choose...' } }}
						>
							<Read />
						</InternationalizationProvider>
					</InternationalizationProvider>
				</>,
			),
		)

	render('en')
	expect(host.textContent).toBe('en/ltr/Select…en/ltr/Select…en/rtl/Choose...')
	render('fr-FR')
	expect(host.textContent).toBe('en/ltr/Select…fr-FR/ltr/Sélectionner…en/rtl/Choose...')
})

it('resolves parent overrides before exact catalogs and falls back to English', () => {
	const value = resolveInternationalization({
		locale: 'fr-ca',
		messages: { 'fr-CA': { test: 'catalog' } },
		overrides: { fr: { test: 'override' } },
	})

	expect(value.locale).toBe('fr-CA')
	expect(value.translate('test')).toBe('override')
	expect(value.translate('@astryx.pagination.next')).toBe('Next page')
	expect(value.translate('missing')).toBe('missing')
	expect(getLocaleDirection('ar')).toBe('rtl')
	expect(getLocaleDirection('not a locale')).toBe('ltr')
})

it('mirrors chevrons and permits Enter/Space while guarding disabled boundaries', () => {
	const host = document.createElement('div')
	document.body.append(host)
	const root = createRoot(host)
	cleanups.push(() => {
		root.unmount()
		host.remove()
	})

	const change = vi.fn()
	act(() =>
		root.render(
			<InternationalizationProvider locale="en" dir="rtl">
				<Pagination page={1} pageCount={3} onPageChange={change} />
			</InternationalizationProvider>,
		),
	)

	const prev = host.querySelector('[aria-label="Previous page"]')!
	const next = host.querySelector('[aria-label="Next page"]')!
	expect(prev.textContent).toBe('›')
	expect(next.textContent).toBe('‹')
	for (const key of ['Enter', ' ']) {
		act(() => next.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })))
	}

	expect(change.mock.calls).toEqual([[2], [2]])
	act(() => prev.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))
	expect(change).toHaveBeenCalledTimes(2)
})

it('clears pending live-region messages and keeps polite and assertive channels separate (DOM only)', () => {
	const frames = new Map<number, FrameRequestCallback>()
	let serial = 0
	vi.stubGlobal('requestAnimationFrame', (fn: FrameRequestCallback) => {
		frames.set(++serial, fn)
		return serial
	})

	vi.stubGlobal('cancelAnimationFrame', (id: number) => frames.delete(id))
	const flush = () => {
		const pending = [...frames.values()]
		frames.clear()
		pending.forEach((fn) => fn(0))
	}

	const announce = useAnnounce()
	announce('old')
	announce('')
	flush()
	expect(document.querySelector('[data-xplat-live-region="polite"]')?.textContent).toBe('')
	announce('saved')
	announce('error', 'assertive')
	flush()
	expect(document.querySelector('[data-xplat-live-region="polite"]')?.textContent).toBe('saved')
	expect(document.querySelector('[data-xplat-live-region="assertive"]')?.textContent).toBe('error')
	announce('')
	announce('', 'assertive')
})
