import { expect, it, vi } from 'vitest'
import { openUrl } from '@octane-xplat/platform'
import { router } from './default-router.macos'
import { followHref } from './nav-href.macos'

vi.mock('@octane-xplat/platform', async (original) => ({ ...await original<typeof import('@octane-xplat/platform')>(), openUrl: vi.fn() }))
vi.mock('./default-router.macos', () => ({ router: { navigateUrl: vi.fn() } }))

it('opens normalized external URLs through the platform instead of creating native windows', () => {
	vi.mocked(openUrl).mockClear(); vi.mocked(router.navigateUrl).mockClear()
	const previous = (globalThis as any).__xplatAppKitOpenWindow
	const createWindow = vi.fn()
	;(globalThis as any).__xplatAppKitOpenWindow = createWindow
	try {
		followHref(' https://example.com/\nhelp ')
		followHref('mailto:help@example.com')
		expect(openUrl).toHaveBeenNthCalledWith(1, 'https://example.com/help')
		expect(openUrl).toHaveBeenNthCalledWith(2, 'mailto:help@example.com')
		expect(router.navigateUrl).not.toHaveBeenCalled()
		expect(createWindow).not.toHaveBeenCalled()
	} finally { (globalThis as any).__xplatAppKitOpenWindow = previous }
})

it('rejects unsafe/empty destinations and routes relative paths through the canonical router', () => {
	vi.mocked(openUrl).mockClear(); vi.mocked(router.navigateUrl).mockClear()
	for (const href of ['', '  ', 'JaVaScRiPt:alert(1)', 'vbscript:bad', 'data:text/html,test']) followHref(href)
	expect(openUrl).not.toHaveBeenCalled()
	expect(router.navigateUrl).not.toHaveBeenCalled()
	followHref(' /notes?tag=a%2Fb#draft ')
	expect(router.navigateUrl).toHaveBeenCalledWith('/notes?tag=a%2Fb#draft')
	expect(openUrl).not.toHaveBeenCalled()
})
