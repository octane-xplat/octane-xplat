import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, expect, it } from 'vitest'
import { computeCascade, registerStylesheet, unregisterStylesheet } from '@octane-xplat/css-engine'

const sheet = 'workshop-native-theme-test'
beforeAll(() =>
	registerStylesheet(
		sheet,
		readFileSync(new URL('../src/native/chrome.css', import.meta.url), 'utf8'),
	),
)

afterAll(() => unregisterStylesheet(sheet))

function node(classes, parent = null, type = 'masonview') {
	const n = {
		cssType: type,
		cssClasses: new Set(classes),
		cssPseudoClasses: new Set(),
		parent,
		children: [],
		props: {},
		computedStyle: {},
		computedCustomProps: new Map(),
		getChildIndex(child) {
			return this.children.indexOf(child)
		},
		getChildAt(index) {
			return this.children[index]
		},
		getChildrenCount() {
			return this.children.length
		},
	}
	parent?.children.push(n)
	return n
}

function restyle(n) {
	const result = computeCascade(n)
	n.computedStyle = result.style
	n.computedCustomProps = result.customProps
	for (const child of n.children) {
		restyle(child)
	}
}

it.each(['ns-macos', 'ns-gtk'])('switches the %s root palette light → dark → light', (platform) => {
	const root = node(['xw-root', 'ns-root', platform, 'ns-light'])
	const label = node(['xw-action-label'], root, 'label')
	const stage = node(['xw-stage'], root)
	for (const [scheme, background, foreground] of [
		['light', '#ffffff', '#171717'],
		['dark', '#171717', '#fafafa'],
		['light', '#ffffff', '#171717'],
	]) {
		root.cssClasses.delete(scheme === 'dark' ? 'ns-light' : 'ns-dark')
		root.cssClasses.add(`ns-${scheme}`)
		restyle(root)
		expect(root.computedStyle.backgroundColor).toBe(background)
		expect(label.computedStyle.color).toBe(foreground)
		expect(stage.computedStyle.color).toBeUndefined()
		expect(stage.computedStyle.fontSize).toBeUndefined()
	}
})

it('keeps the NativeScript ancestor class path working', () => {
	const page = node(['ns-dark'])
	const root = node(['xw-root'], page)
	const label = node(['xw-action-label'], root, 'label')
	restyle(page)
	expect(root.computedStyle.backgroundColor).toBe('#171717')
	expect(label.computedStyle.color).toBe('#fafafa')
})
