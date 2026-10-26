import { describe, expect, it } from 'vitest'
import {
	defineTheme,
	defaultThemeTokens,
	getRegisteredTheme,
	isDefinedTheme,
	parseLightDark,
	resolveThemeToken,
	resolveThemeTokens,
	resolveTokenValue,
} from './defined-theme'
import { generateThemeCss } from './theme-css'

const forest = defineTheme({
	name: 'forest-test',
	tokens: {
		'--color-accent': ['#15803D', '#86EFAC'],
		'--color-background-card': ['#FFFFFF', '#0F3D24'],
		'--radius-container': '8px',
		'--shadow-demo': '0 1px 2px light-dark(#00000011, #ffffff22)',
	},
	localTokens: { '--demo-local': ['#111111', '#eeeeee'] },
})

describe('defineTheme', () => {
	it('carries name + merged token/localToken maps and registers', () => {
		expect(isDefinedTheme(forest)).toBe(true)
		expect(forest.tokens['--demo-local']).toEqual(['#111111', '#eeeeee'])
		expect(getRegisteredTheme('forest-test')).toBe(forest)
	})

	it('flattens extends before applying overrides', () => {
		const child = defineTheme({
			name: 'forest-child',
			extends: forest,
			tokens: { '--color-accent': ['#000000', '#111111'] },
		})
		expect(child.tokens['--color-accent']).toEqual(['#000000', '#111111'])
		expect(child.tokens['--radius-container']).toBe('8px')
	})
})

describe('token resolution', () => {
	it('picks tuple arms and whole-value light-dark() per mode', () => {
		expect(resolveTokenValue(['L', 'D'], 'light')).toBe('L')
		expect(resolveTokenValue(['L', 'D'], 'dark')).toBe('D')
		expect(parseLightDark('light-dark(#fff, #000)')).toEqual(['#fff', '#000'])
		expect(resolveTokenValue('light-dark(#fff, #000)', 'dark')).toBe('#000')
		// embedded light-dark inside a compound value is not a top-level pick
		expect(parseLightDark('0 1px 2px light-dark(#a, #b)')).toBeNull()
	})

	it('merges defaults under theme tokens and resolves var() references', () => {
		const tokens = resolveThemeTokens(forest, { mode: 'light' })
		expect(tokens['--color-accent']).toBe('#15803D')
		expect(tokens['--color-background-card']).toBe('#FFFFFF')
		// untouched token falls back to the astryx default (light arm)
		expect(tokens['--color-text-primary']).toBe('#0A1317')
		// var() reference resolves through the merged map
		expect(tokens['--text-heading-1-size']).toBe(tokens['--font-size-2xl'])
		expect(resolveThemeToken('--color-accent', { theme: forest, mode: 'dark' })).toBe('#86EFAC')
	})

	it('resolves without a theme — defaults only', () => {
		const tokens = resolveThemeTokens(undefined, { mode: 'dark' })
		expect(tokens['--color-accent']).toBe('#2694FE')
		expect(Object.keys(defaultThemeTokens).length).toBeGreaterThan(200)
	})
})

describe('generateThemeCss', () => {
	it('emits one light-dark() scope rule on web', () => {
		const css = generateThemeCss(forest, { target: 'web' })
		expect(css).toContain('.xds-theme-forest-test {')
		expect(css).toContain('--color-accent: light-dark(#15803D, #86EFAC);')
		expect(css).toContain('--shadow-demo: 0 1px 2px light-dark(#00000011, #ffffff22);')
		// scope element carries the theme's body text color + font (upstream :scope rule)
		expect(css).toContain('color: var(--color-text-primary);')
		expect(css).toContain('font-family: var(--font-family-body);')
	})

	it('splits arms into class selectors on native', () => {
		const css = generateThemeCss(forest, { target: 'native' })
		expect(css).toContain('.dark .xds-theme-forest-test')
		expect(css).toContain('.xds-theme-forest-test.dark')
		expect(css).toContain('.xds-light .xds-theme-forest-test')
		expect(css).toContain('--color-accent: #86EFAC;')
		// embedded light-dark in the compound shadow resolves to its arm
		expect(css).toContain('--shadow-demo: 0 1px 2px #ffffff22;')
		// scope text declarations resolve to literals (NS var() in font-family
		// is unreliable) — forest lacks the tokens so the Astryx defaults land
		expect(css).toContain('color: #0A1317;')
		expect(css).toContain('color: #DFE2E5;')
		expect(css).toContain('font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;')
	})
})
