import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { xplatBambooConfig, xplatPortablePreset } from '../src/config.ts'

// The default theme block in @octane-xplat/ui's chrome.css is the source of
// truth for token names; read it by path so bamboo gains no dependency on ui.
const chromePath = fileURLToPath(new URL('../../ui/src/theme/chrome.css', import.meta.url))

function defaultThemeTokens() {
	const css = readFileSync(chromePath, 'utf8').replace(/\/\*.*?\*\//gs, '')
	// The theme rule nests inside @layer, so anchor on a selector list that
	// names :root rather than pairing every header with the next block.
	for (const match of css.matchAll(/([^{}]*:root[^{}]*)\{([^{}]*)\}/g)) {
		const selectors = match[1].split(',').map((selector) => selector.trim())
		if (!selectors.includes(':root') || !selectors.includes('.ns-root')) {
			continue
		}

		const tokens = { color: new Set(), radius: new Set(), space: new Set() }
		for (const declaration of match[2].matchAll(/--(color|radius|space)-([A-Za-z0-9-]+)\s*:/g)) {
			tokens[declaration[1]].add(declaration[2])
		}

		return tokens
	}

	throw new Error(`no ':root, .ns-root' theme block found in ${chromePath}`)
}

const theme = defaultThemeTokens()

for (const [prefix, tokens] of [
	['color', theme.color],
	['radius', theme.radius],
	['space', theme.space],
]) {
	const group = prefix === 'color' ? 'colors' : prefix === 'radius' ? 'radii' : 'spacing'
	test(`preset ${group} cover every --${prefix}-* variable in the ui default theme`, () => {
		const configured = xplatBambooConfig.theme.tokens[group]
		const names = new Set(Object.keys(configured))
		const missing = [...tokens].filter((name) => !names.has(name))
		const extra = [...names].filter((name) => !tokens.has(name))
		assert.deepEqual(
			{ missing, extra },
			{ missing: [], extra: [] },
			`theme.tokens.${group} drifted from chrome.css --${prefix}-* variables`,
		)

		for (const [name, token] of Object.entries(configured)) {
			assert.equal(
				token.value,
				`var(--${prefix}-${name})`,
				`theme.tokens.${group}.${name} should resolve var(--${prefix}-${name})`,
			)
		}
	})
}

test('xplatPortablePreset and xplatBambooConfig share the same theme tokens', () => {
	assert.equal(xplatPortablePreset.theme, xplatBambooConfig.theme)
	assert.deepEqual(xplatPortablePreset.theme.tokens, xplatBambooConfig.theme.tokens)
})
