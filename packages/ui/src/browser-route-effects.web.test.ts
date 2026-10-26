// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { createBrowserRouteEffects } from './browser-route-effects.web'

let effects: ReturnType<typeof createBrowserRouteEffects>
let root: HTMLDivElement
beforeEach(() => {
	root = document.createElement('div')
	document.body.append(root)
	vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
	effects = createBrowserRouteEffects(window)
})

afterEach(() => {
	effects.dispose()
	root.remove()
	vi.restoreAllMocks()
})

it('honors explicit autofocus and ignores disabled autofocus controls', () => {
	root.innerHTML = '<h1>Details</h1><input autofocus disabled><input autofocus id="intended">'
	effects.restore(undefined, { root })
	expect(document.activeElement).toBe(root.querySelector('#intended'))
	root.querySelector('#intended')!.remove()
	effects.restore(undefined, { root })
	expect(document.activeElement).toBe(root.querySelector('h1'))
})

it('marks script-driven route focus so the programmatic ring stays suppressed', () => {
	root.innerHTML = '<h1>Details</h1><button>Next</button>'
	const heading = root.querySelector('h1')!
	effects.restore(undefined, { root })
	expect(document.activeElement).toBe(heading)
	expect(heading.getAttribute('data-xplat-programmatic-focus')).toBe('')
	root.querySelector('button')!.focus()
	expect(heading.hasAttribute('data-xplat-programmatic-focus')).toBe(false)
	expect(heading.hasAttribute('tabindex')).toBe(false)
})

it('leaves author-owned tabindex changes intact when temporary heading focus ends', () => {
	root.innerHTML = '<h1>Details</h1><button>Continue</button>'
	const heading = root.querySelector('h1')!
	effects.restore(undefined, { root })
	expect(heading.getAttribute('tabindex')).toBe('-1')
	heading.tabIndex = 0
	root.querySelector('button')!.focus()
	expect(heading.getAttribute('tabindex')).toBe('0')
	effects.dispose()
	expect(heading.getAttribute('tabindex')).toBe('0')
})

it('uses a main landmark or document body without automatically focusing a form control', () => {
	root.innerHTML = '<main><input></main>'
	effects.restore(undefined, { root })
	expect(document.activeElement).toBe(root.querySelector('main'))
	root.innerHTML = '<input>'
	effects.restore(undefined, { root })
	expect(document.activeElement).toBe(document.body)
	effects.clearFocus()
	expect(document.body.hasAttribute('tabindex')).toBe(false)
})
