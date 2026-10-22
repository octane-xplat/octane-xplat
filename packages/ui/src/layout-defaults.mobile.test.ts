import { describe, expect, it, vi } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
	createObjectContainer,
	createObjectDriver,
	createUniversalRoot,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
	isIOS: false,
	isAndroid: true,
	Utils: { openUrl: vi.fn() },
	Application: { ios: {}, android: {}, on: vi.fn(), off: vi.fn() },
	Color: class Color {},
}))

// Leaves that pull in native plugin internals are stubbed — this test only
// checks the className root's emitted props.
vi.mock('./Icon.tsrx', () => ({ Icon: () => null }))
vi.mock('./pan.tsrx', () => ({ usePan: () => undefined }))
vi.mock('./route', () => ({ pushDeepLink: () => false }))
vi.mock('./keyboard-inset', () => ({ useKeyboardInset: () => 0 }))

import { Banner } from './Banner.tsrx'
import { Alert } from './Alert.tsrx'
import { Row } from './Row.tsrx'
import { Center } from './Center.tsrx'
import { Breadcrumb } from './Breadcrumb.tsrx'
import { KeyboardAvoiding } from './KeyboardAvoiding.tsrx'
import { Citation } from './Citation.tsrx'
import { ChatMessage } from './ChatMessage.tsrx'

const LAYOUT_KEYS = [
	'flexDirection',
	'alignItems',
	'justifyContent',
	'flexWrap',
	'alignSelf',
	'flexGrow',
	'flexShrink',
	'gap',
]

function renderRoot(component: any, props: any) {
	const container = createObjectContainer('nativescript')
	const root = createUniversalRoot(container, createObjectDriver('nativescript'))
	try {
		root.render(component, props)
		return container.children[0]
	} finally {
		root.unmount()
	}
}

function flatStyle(style: any): Record<string, any> {
	if (!style) {
		return {}
	}
	if (Array.isArray(style)) {
		return Object.assign({}, ...style.map(flatStyle))
	}
	return style
}

function flatClasses(className: any): string[] {
	if (!className) {
		return []
	}
	if (Array.isArray(className)) {
		return className.flatMap(flatClasses)
	}
	if (typeof className === 'string') {
		return className.split(/\s+/)
	}
	return [className].filter(Boolean)
}

// The object driver checks emitted props, not NativeScript's CSS cascade.
// Inline layout defaults were moved to vx-* classes in #39 so user classes
// can override them on native.
describe('layout defaults are class-based (#39)', () => {
	const cases: Array<[string, any, any, string]> = [
		['Banner', Banner, {}, 'vx-banner'],
		['Alert', Alert, { tone: 'info' }, 'vx-alert'],
		['Row', Row, {}, 'vx-row'],
		['Center', Center, {}, 'vx-center'],
		['Breadcrumb', Breadcrumb, { items: [{ title: 'A' }, { title: 'B' }] }, 'vx-breadcrumb'],
		['KeyboardAvoiding', KeyboardAvoiding, {}, 'vx-keyboard-avoiding'],
		['Citation', Citation, { variant: 'name', source: { title: 'Spec' } }, 'vx-citation'],
		[
			'Citation (link)',
			Citation,
			{ variant: 'name', source: { title: 'Spec', url: 'https://x' } },
			'vx-citation',
		],
		['ChatMessage', ChatMessage, { message: { role: 'assistant', content: 'hi' } }, 'vx-chatmsg'],
	]
	for (const [name, component, props, vxClass] of cases) {
		it(`${name} emits no inline layout defaults on its className root`, () => {
			const view = renderRoot(component, { ...props, className: 'user-cls' })
			const classes = flatClasses(view.props.className)
			expect(classes).toContain(vxClass)
			expect(classes).toContain('user-cls')
			const style = flatStyle(view.props.style)
			// ChatMessage keeps its sender-conditional justifyContent and the
			// row that native's manual avatar order depends on (see RETAINED).
			const allowed = name === 'ChatMessage' ? ['justifyContent', 'flexDirection'] : []
			for (const key of LAYOUT_KEYS) {
				if (allowed.includes(key)) {
					continue
				}

				expect(style[key], `${name} inline ${key}`).toBeUndefined()
			}
		})
	}

	it('explicit style layout values are still emitted inline', () => {
		const view = renderRoot(Banner, {
			style: { flexDirection: 'column', gap: 2 },
		})
		const style = flatStyle(view.props.style)
		expect(style.flexDirection).toBe('column')
		expect(style.gap).toBe(2)
	})
})

// Guard: the className root of a native component must not carry literal
// layout values inline — they belong in the element's vx-* class so user
// classes win the native cascade. Deliberately retained cases are listed
// below with the reason (web-must-not-change rule from #39).
const RETAINED: Record<string, string> = {
	'ChatLayout.tsrx:flexGrow':
		'vx-chatlayout is display:flex on web; flex-grow:1 would change web sizing',
	'ChatTokenizedText.tsrx:alignItems':
		'second vx-chattext root shares the class without a modifier; alignItems:center left inline',
	'Dialog.tsrx:flexDirection':
		'vx-dialog-header rule is flex-direction:row; the column element keeps its inline value',
	'FormField.tsrx:flexDirection':
		'vx-field--hl needs row but web computes column via .vx-field; a new rule would change web',
	'ChatTokenizedText.tsrx:flexWrap':
		'the plain and tokenized roots share vx-chattext; a class rule would also wrap the tokenized root on native',
	'ChatMessage.tsrx:flexDirection':
		'native orders the user avatar manually; .vx-chatmsg--user row-reverse would double-reverse',
}

function* jsxTags(src: string): Generator<string> {
	let i = 0
	const n = src.length
	while (i < n) {
		const m = /<[a-zA-Z][\w.]*/.exec(src.slice(i))
		if (!m) {
			return
		}

		const s = i + m.index
		let j = i + m.index + m[0].length
		let depth = 0
		let q: string | null = null
		while (j < n) {
			const c = src[j]
			if (q) {
				if (c === q) {
					q = null
				} else if (c === '\\') {
					j++
				}
			} else if (c === '"' || c === "'" || c === '`') {
				q = c
			} else if (c === '{') {
				depth++
			} else if (c === '}') {
				depth--
			} else if (c === '>' && depth === 0) {
				break
			}

			j++
		}

		yield src.slice(s, j + 1)
		i = j + 1
	}
}

describe('native className roots carry no literal layout values', () => {
	const dir = __dirname
	const files = readdirSync(dir).filter(
		(f) =>
			f.endsWith('.tsrx') && !/\.(web|macos|gtk|linux|windows|test|parity|check)\.tsrx$/.test(f),
	)
	const offenders: string[] = []
	for (const file of files) {
		const src = readFileSync(join(dir, file), 'utf8')
		// class locals built from props.className (e.g. Citation's cls)
		const locals = new Set<string>()
		for (const m of src.matchAll(/const\s+(\w+)\s*=\s*cx\(([^)]*props\.className[^)]*)\)/gs)) {
			locals.add(m[1])
		}

		for (const tag of jsxTags(src)) {
			const cn = /className\s*=\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/s.exec(tag)
			if (!cn) {
				continue
			}

			const expr = cn[1]
			const carries =
				expr.includes('props.className') ||
				[...locals].some((l) => new RegExp(`\\b${l}\\b`).test(expr))

			if (!carries) {
				continue
			}

			for (const k of LAYOUT_KEYS) {
				const lit = new RegExp(`${k}\\s*:\\s*("[^"]*"|'[^']*'|\\d+(?:\\.\\d+)?)`)
				if (lit.test(tag)) {
					const key = RETAINED[`${file}:${k}`] ?? RETAINED[file]
					if (!key) {
						offenders.push(`${file}: ${k} literal on className root`)
					}
				}
			}
		}
	}
	it('has no offenders outside the retained list', () => {
		expect(offenders).toEqual([])
	})
})

// The native CSS transform strips from each web-only start to the next end
// non-greedily, so a missing end silently drops shared rules on native.
describe('web-only CSS markers', () => {
	for (const name of ['tokens.css', 'chrome.css']) {
		it(`${name} markers strictly alternate start/end`, () => {
			const css = readFileSync(join(__dirname, 'theme', name), 'utf8')
			const kinds = [...css.matchAll(/xplat-web-only:(start|end)/g)].map((m) => m[1])
			expect(kinds.length % 2).toBe(0)
			kinds.forEach((kind, i) => expect(kind).toBe(i % 2 === 0 ? 'start' : 'end'))
		})
	}
})
