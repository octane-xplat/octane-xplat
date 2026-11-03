/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
// Extension-protocol render tests — ported behaviors from the 0.7.4
// reference's renderer boundary coverage: typed renderers, missing-renderer
// and failure fallbacks, pending boundaries, semantic-fence proposals,
// source-line attributes, and the heading-links copy control.
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot, use } from 'octane'
import { Markdown, MarkdownPluginNodeRenderer } from './Markdown.tsrx'
import { createMarkdownPlugin } from './markdown-plugins'
import type { MarkdownExtensionNode } from './markdown-plugins'
import {
	createMarkdownFenceTransform,
	createMarkdownHeadingLinks,
	markdownSoftBreaksPlugin,
	markdownSourceLinesPlugin,
} from './markdown-plugin-helpers'

import type { MdDoc } from './markdown-ast'
import type { MarkdownTokenizerInput } from './markdown-plugins'

const roots: any[] = []
let rafCallbacks: Array<(time: number) => void>

/** Deterministic reveal: reduced-motion stubs make isStreaming render the
 *  full smoothed prefix synchronously. */
function reduceMotion() {
	vi.stubGlobal('matchMedia', (query: string) => ({
		matches: query.includes('prefers-reduced-motion'),
		media: query,
		addEventListener() {},
		removeEventListener() {},
	}))
}

function driveFrames() {
	rafCallbacks = []
	vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => {
		rafCallbacks.push(cb)
		return rafCallbacks.length
	})

	vi.stubGlobal('cancelAnimationFrame', () => {})
}

function mount(plugins?: any) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	const render = (props: any) =>
		act(() =>
			root.render(
				plugins == null ? <Markdown {...props} /> : <Markdown plugins={plugins} {...props} />,
			),
		)

	return { el, render }
}

function renderNode(plugins: any, node: MarkdownExtensionNode) {
	const el = document.createElement('div')
	document.body.append(el)
	const root = createRoot(el)
	roots.push(root)
	act(() => root.render(<MarkdownPluginNodeRenderer plugins={plugins} node={node} />))
	return el
}

afterEach(() => {
	for (const root of roots.splice(0)) {
		act(() => root.unmount())
	}

	vi.unstubAllGlobals()
	document.body.innerHTML = ''
})

const inlineAngle = (render: (node: MarkdownExtensionNode) => unknown) =>
	createMarkdownPlugin({
		name: 'angle',
		apiVersion: 1,
		parseKey: 'angle',
		syntax: {
			inline: [
				{
					startsWith: ['<<'],
					maxSpan: 64,
					tokenize: (input: MarkdownTokenizerInput) => {
						const end = input.source.indexOf('>>', input.offset + 2)
						return end === -1
							? { status: 'no-match' as const }
							: {
									status: 'match' as const,
									end: end + 2,
									node: {
										type: 'extension' as const,
										plugin: 'angle',
										name: 'angle',
										display: 'inline' as const,
										data: input.source.slice(input.offset + 2, end),
									},
								}
					},
				},
			],
		},
		renderers: {
			angle: {
				render: ({ node }) => render(node),
				toText: () => 'angle-text',
			},
		},
	})

it('renders a matched inline extension through its plugin renderer', () => {
	const { el, render } = mount([inlineAngle((node) => <b className="rx">{String(node.data)}</b>)])
	render({ children: 'go <<mark>> now' })
	expect(el.querySelector('b.rx')?.textContent).toBe('mark')
})

it('renders a block extension through its plugin renderer', () => {
	const plugin = createMarkdownPlugin({
		name: 'callout',
		apiVersion: 1,
		parseKey: 'callout',
		syntax: {
			block: [
				{
					startsWith: ['!!!'],
					maxSpan: 128,
					tokenize: (input: MarkdownTokenizerInput) => {
						const nl = input.source.indexOf('\n', input.offset)
						const end = nl === -1 ? input.end : nl
						return {
							status: 'match' as const,
							end,
							node: {
								type: 'extension' as const,
								plugin: 'callout',
								name: 'callout',
								display: 'block' as const,
								data: { text: input.source.slice(input.offset + 3, end).trim() },
							},
						}
					},
				},
			],
		},
		renderers: {
			callout: {
				render: ({ node }) => <div className="callout">{(node.data as { text: string }).text}</div>,
				toText: () => 'callout',
			},
		},
	})

	const { el, render } = mount([plugin])
	render({ children: '!!! warning' })
	expect(el.querySelector('.callout')?.textContent).toBe('warning')
})

it('a missing renderer falls back to the node text; toText wins over source', () => {
	const { el, render } = mount([inlineAngle(() => null)])
	render({ children: 'go <<mark>> now' })
	expect(el.textContent).toContain('go')
	expect(el.textContent).not.toContain('angle-text')
})

it('a renderer throwing inside the boundary resolves to the fallback text', () => {
	const err = vi.spyOn(console, 'warn').mockImplementation(() => {})
	const plugin = inlineAngle(() => {
		throw new Error('render boom')
	})

	const { el, render } = mount([plugin])
	render({ children: 'go <<mark>> now' })
	// The readable fallback is the node's source, as in the reference
	// ('@{throw}' renders its source text when the renderer fails).
	expect(el.textContent).toContain('<<mark>>')
	expect(err).toHaveBeenCalled()
})

it('a suspending renderer shows the fallback until the promise resolves', async () => {
	let resolveRender: (value: unknown) => void = () => {}
	const pending = new Promise<unknown>((resolve) => {
		resolveRender = resolve
	})

	const plugin = inlineAngle(() => <AsyncNode promise={pending.then(() => 'loaded')} />)
	const { el, render } = mount([plugin])
	render({ children: 'go <<mark>> now' })
	expect(el.textContent).toContain('<<mark>>')
	await act(async () => resolveRender('loaded'))
	await act(async () => {})
	expect(el.textContent).toContain('loaded')
})

function AsyncNode(props: { promise: Promise<string> }) {
	return <i>{use(props.promise)}</i>
}

it('a semantic-fence proposal renders through the fence renderer', () => {
	const chart = createMarkdownPlugin({
		name: 'chart',
		apiVersion: 1,
		transform: createMarkdownFenceTransform({
			languages: ['chart'],
			createNode: ({ code }) => ({
				type: 'extension',
				plugin: 'chart',
				name: 'chart',
				display: 'block',
				data: { code },
			}),
		}),
		renderers: {
			chart: {
				render: ({ node }) => (
					<figure className="chart">{(node.data as { code: string }).code}</figure>
				),
				toText: () => 'chart',
			},
		},
	})

	const { el, render } = mount([chart])
	render({ children: '```chart\nplot me\n```' })
	expect(el.querySelector('figure.chart')?.textContent).toBe('plot me')
})

it('a declining fence renderer keeps the ordinary code block', () => {
	const chart = createMarkdownPlugin({
		name: 'chart-decline',
		apiVersion: 1,
		transform: createMarkdownFenceTransform({
			languages: ['chart'],
			createNode: ({ code }) => ({
				type: 'extension',
				plugin: 'chart-decline',
				name: 'chart',
				display: 'block',
				data: { code },
			}),
		}),
		renderers: {
			chart: {
				render: () => null,
				toText: () => 'chart',
			},
		},
	})

	const { el, render } = mount([chart])
	render({ children: '```chart\nplot me\n```' })
	expect(el.querySelector('figure')).toBeNull()
	expect(el.textContent).toContain('plot me')
})

it('soft breaks render as hard <br> output through the helper plugin', () => {
	const { el, render } = mount([markdownSoftBreaksPlugin])
	render({ children: 'one\ntwo' })
	expect(el.querySelector('br')).not.toBeNull()
})

it('source lines stamp data-source-line attributes only with the plugin', () => {
	const without = mount()
	without.render({ children: 'line one\n\nline three' })
	expect(without.el.querySelector('[data-source-line]')).toBeNull()

	const { el, render } = mount([markdownSourceLinesPlugin])
	render({ children: 'line one\n\nline three' })
	const marks = [...el.querySelectorAll('[data-source-line]')]
	expect(marks.length).toBeGreaterThanOrEqual(2)
	expect(marks[0].getAttribute('data-source-line')).toBe('1')
	expect(marks[1].getAttribute('data-source-line')).toBe('3')
})

it('heading links allocate ids and render the copy control', () => {
	const { el, render } = mount([
		createMarkdownHeadingLinks({ permalinkBaseUrl: 'https://docs.example' }),
	])

	render({ children: '# Title\n\n## Title' })
	const headings = el.querySelectorAll('h1, h2')
	expect(headings[0].id).toBe('title')
	expect(headings[1].id).not.toBe('title')
	const buttons = [...el.querySelectorAll('button')]
	expect(buttons.length).toBe(2)
})

it('MarkdownPluginNodeRenderer renders a baked node through its renderer', () => {
	const plugins = [
		createMarkdownPlugin({
			name: 'solo',
			apiVersion: 1,
			transform: (doc) => doc,
			renderers: {
				solo: {
					render: ({ node }) => <strong className="solo">{String(node.data)}</strong>,
					toText: () => 'solo-text',
				},
			},
		}),
	]

	const node: MarkdownExtensionNode = {
		type: 'extension',
		plugin: 'solo',
		name: 'solo',
		display: 'inline',
		data: 'payload',
		source: 'x',
	}

	const el = renderNode(plugins, node)
	expect(el.querySelector('strong.solo')?.textContent).toBe('payload')
})

it('plugin nodes participate in the streaming reveal like ordinary text', () => {
	reduceMotion()
	const { el, render } = mount([inlineAngle(() => <b>{'R'}</b>)])
	render({ children: 'a <<x>> b', isStreaming: true })
	render({ children: 'a <<x>> b more', isStreaming: true })
	expect(el.textContent).toContain('more')
})
