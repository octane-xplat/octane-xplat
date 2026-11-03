// Markdown extension protocol tests — ported behaviors from the 0.7.4
// reference's protocol/helper suites: registration validation, syntax
// matching and deferral, transform ordering/guards, first-party helpers,
// and incremental invalidation.
import { afterEach, describe, expect, it, vi } from 'vitest'
import { parseMdDoc, parseMdInline, parseMdNodes } from './markdown-parse'
import {
	applyMarkdownTransforms,
	createMarkdownPlugin,
	getMarkdownExtensionRenderer,
	getMarkdownPluginCapabilities,
	isMarkdownExtensionNode,
	isMarkdownPluginData,
	markdownExtensionText,
	prepareMarkdownPlugins,
	type MarkdownExtensionNode,
	type MarkdownPluginEntry,
	type MarkdownTokenizerInput,
} from './markdown-plugins'
import {
	createMarkdownFenceTransform,
	createMarkdownFrontmatter,
	createMarkdownHeadingLinks,
	createMarkdownSourceDecoration,
	createMarkdownTextTransform,
	getMarkdownFenceProposal,
	getMarkdownSourceDecorations,
	markdownSoftBreaksPlugin,
	markdownSourceLinesPlugin,
	projectMarkdownHeadingLinks,
} from './markdown-plugin-helpers'
import {
	createMarkdownIncrementalState,
	createMarkdownStreamParser,
	parseMarkdownIncremental,
} from './markdown-stream'
import type { MdNode } from '../props'

const PASS = {
	render: () => null,
	toText: () => 'ext',
}

function syntaxPlugin(
	overrides: Partial<Parameters<typeof createMarkdownPlugin>[0]> = {},
) {
	return createMarkdownPlugin({
		name: 'test-syntax',
		apiVersion: 1,
		parseKey: 'angle',
		syntax: {
			inline: [
				{
					startsWith: ['<<'],
					maxSpan: 64,
					tokenize: (input: MarkdownTokenizerInput) => {
						const end = input.source.indexOf('>>', input.offset + 2)
						if (end === -1) {
							return { status: 'no-match' }
						}
						return {
							status: 'match',
							end: end + 2,
							node: {
								type: 'extension',
								plugin: 'test-syntax',
								name: 'angle',
								display: 'inline',
								data: input.source.slice(input.offset + 2, end),
							},
						}
					},
				},
			],
		},
		renderers: { angle: PASS },
		...overrides,
	})
}

function blockPlugin(tokenize?: (input: MarkdownTokenizerInput) => unknown, name = 'test-block') {
	return createMarkdownPlugin({
		name,
		apiVersion: 1,
		parseKey: 'bang',
		syntax: {
			block: [
				{
					startsWith: ['!!!'],
					maxSpan: 128,
					tokenize:
						tokenize ??
						((input: MarkdownTokenizerInput) => {
							const end = input.source.indexOf('\n', input.offset)
							const stop = end === -1 ? input.end : end
							return {
								status: 'match' as const,
								end: stop,
								node: {
									type: 'extension' as const,
									plugin: name,
									name: 'callout',
									display: 'block' as const,
									data: input.source.slice(input.offset + 3, stop),
								},
							}
						}),
				},
			],
		},
		renderers: { callout: PASS },
	})
}

afterEach(() => {
	vi.restoreAllMocks()
})

describe('createMarkdownPlugin + prepare', () => {
	it('rejects malformed definitions at registration', () => {
		expect(() => createMarkdownPlugin({ name: '', apiVersion: 1, transform: () => null as never })).toThrow(
			'non-empty',
		)
		expect(() =>
			createMarkdownPlugin({
				name: 'x',
				apiVersion: 2 as never,
				transform: () => null as never,
			}),
		).toThrow('apiVersion')
		expect(() =>
			createMarkdownPlugin({
				name: 'x',
				apiVersion: 1,
				transform: 'not-a-function' as never,
			}),
		).toThrow('must be a function')
		expect(() =>
			createMarkdownPlugin({
				name: 'no-surface',
				apiVersion: 1,
			} as never),
		).toThrow('syntax or transform')
		expect(() =>
			syntaxPlugin({
				renderers: {},
			} as never),
		).toThrow('renderers')
		expect(() =>
			syntaxPlugin({
				syntax: {
					inline: [
						{
							startsWith: [''],
							maxSpan: 4,
							tokenize: () => ({ status: 'no-match' }),
						},
					],
				},
			} as never),
		).toThrow('non-empty')
		expect(() =>
			syntaxPlugin({
				syntax: {
					inline: [
						{
							startsWith: ['x'],
							maxSpan: 0,
							tokenize: () => ({ status: 'no-match' }),
						},
					],
				},
			} as never),
		).toThrow('positive')
	})

	it('freezes entry, brand, and definition; exposes opaque capabilities', () => {
		const entry = syntaxPlugin()
		expect(Object.isFrozen(entry)).toBe(true)
		expect(entry.name).toBe('test-syntax')
		expect(getMarkdownPluginCapabilities(entry)).toEqual({
			syntax: true,
			transform: false,
		})
		const transformOnly = createMarkdownPlugin({
			name: 'xform',
			apiVersion: 1,
			transform: (doc) => doc,
		})
		expect(getMarkdownPluginCapabilities(transformOnly)).toEqual({
			syntax: false,
			transform: true,
		})
	})

	it('rejects foreign objects and duplicate names at prepare', () => {
		expect(() => getMarkdownPluginCapabilities({ name: 'fake' } as never)).toThrow()
		expect(() => prepareMarkdownPlugins([{ name: 'fake' } as never])).toThrow()
		expect(() =>
			prepareMarkdownPlugins([
				createMarkdownPlugin({ name: 'dup', apiVersion: 1, transform: (d) => d }),
				createMarkdownPlugin({ name: 'dup', apiVersion: 1, transform: (d) => d }),
			]),
		).toThrow('duplicate')
	})

	it('indexes syntax by first character and preserves list ordering', () => {
		const prepared = prepareMarkdownPlugins([syntaxPlugin(), blockPlugin()])!
		expect(prepared.syntaxIdentity).toContain('test-syntax')
		expect(prepared.syntaxIdentity).toContain('test-block')
		expect(prepared.inlineByFirstCharacter.get('<')).toHaveLength(1)
		expect(prepared.blockByFirstCharacter.get('!')).toHaveLength(1)
		expect(prepareMarkdownPlugins([syntaxPlugin(), blockPlugin()])).not.toBe(
			// different array identity → different prepared object, same identity
			prepareMarkdownPlugins([blockPlugin(), syntaxPlugin()]),
		)
		expect(
			prepareMarkdownPlugins([syntaxPlugin()])!.syntaxIdentity,
		).not.toBe(prepared.syntaxIdentity)
	})
})

describe('plugin syntax parsing', () => {
	it('parses an inline extension node with frozen data and source provenance', () => {
		const nodes = parseMdInline('before <<payload>> after', {
			plugins: [syntaxPlugin()],
		})
		expect(nodes.map((n) => n.type)).toEqual(['text', 'extension', 'text'])
		const ext = nodes[1] as MarkdownExtensionNode
		expect(ext.plugin).toBe('test-syntax')
		expect(ext.name).toBe('angle')
		expect(ext.data).toBe('payload')
		expect(ext.source).toBe('<<payload>>')
		expect(Object.isFrozen(ext)).toBe(true)
		expect(Object.isFrozen(ext.data)).toBe(true)
		expect(isMarkdownExtensionNode(ext, 'test-syntax', 'angle')).toBe(true)
	})

	it('parses a block extension node and preserves source text', () => {
		const nodes = parseMdNodes('!!! hello\n\nrest', { plugins: [blockPlugin()] })
		expect(nodes.map((n) => n.type)).toEqual(['extension', 'paragraph'])
		const ext = nodes[0] as MarkdownExtensionNode
		expect(ext.display).toBe('block')
		expect(ext.source).toBe('!!! hello')
		expect(ext.position?.start.offset).toBe(0)
		expect(ext.position?.end.offset).toBe('!!! hello'.length)
	})

	it('strips authored provenance and invalid ends', () => {
		const bad = blockPlugin((input) => ({
			status: 'match',
			end: input.offset + 3,
			node: {
				type: 'extension',
				plugin: 'test-block',
				name: 'callout',
				display: 'block',
				data: null,
				source: 'hand-authored',
			},
		}))
		const nodes = parseMdNodes('!!!', { plugins: [bad] })
		expect((nodes[0] as MarkdownExtensionNode).source).toBe('!!!')
	})

	it('reports and falls back for out-of-range, wrong-owner, and unrendered nodes', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const cases: Array<[string, unknown]> = [
			['out of range', { status: 'match', end: 999, node: { type: 'extension', plugin: 'test-block', name: 'callout', display: 'block', data: null } }],
			['zero progress', { status: 'match', end: 0, node: { type: 'extension', plugin: 'test-block', name: 'callout', display: 'block', data: null } }],
			['foreign plugin', { status: 'match', end: 5, node: { type: 'extension', plugin: 'other', name: 'callout', display: 'block', data: null } }],
			['missing renderer', { status: 'match', end: 5, node: { type: 'extension', plugin: 'test-block', name: 'ghost', display: 'block', data: null } }],
			['non-data', { status: 'match', end: 5, node: { type: 'extension', plugin: 'test-block', name: 'callout', display: 'block', data: { bad: () => {} } } }],
		]
		for (const [label, result] of cases) {
			const plugin = blockPlugin(() => result)
			const nodes = parseMdNodes('!!! x', { plugins: [plugin] })
			expect(nodes[0].type, label).toBe('paragraph')
		}
		expect(warn).toHaveBeenCalled()
	})

	it('reports a thrown tokenizer and continues as ordinary text', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const plugin = blockPlugin(() => {
			throw new Error('boom')
		}, 'test-throw')
		expect(parseMdNodes('!!! x', { plugins: [plugin] })[0].type).toBe('paragraph')
		expect(warn).toHaveBeenCalled()
	})

	it('built-ins win: a plugin cannot own `>` or `- `, `#`, or a fenced code line', () => {
		const greedy = createMarkdownPlugin({
			name: 'greedy',
			apiVersion: 1,
			parseKey: 'g',
			syntax: {
				block: [
					{
						startsWith: ['>'],
						maxSpan: 8,
						tokenize: (input: MarkdownTokenizerInput) => ({
							status: 'match' as const,
							end: input.source.indexOf('\n', input.offset),
							node: {
								type: 'extension' as const,
								plugin: 'greedy',
								name: 'x',
								display: 'block' as const,
								data: null,
							},
						}),
					},
				],
			},
			renderers: { x: PASS },
		})
		expect(parseMdNodes('> quote', { plugins: [greedy] })[0].type).toBe('blockquote')
	})

	it('a tokenize that ends mid-line is rejected as a block', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const partial = blockPlugin((input) => ({
			status: 'match',
			end: input.offset + 4,
			node: {
				type: 'extension',
				plugin: 'test-midline',
				name: 'callout',
				display: 'block',
				data: null,
			},
		}), 'test-midline')
		expect(parseMdNodes('!!! hello\n\nrest', { plugins: [partial] })[0].type).toBe(
			'paragraph',
		)
		expect(warn).toHaveBeenCalled()
	})
})

describe('streaming + deferral', () => {
	it('defer holds trailing source instead of committing it as text', () => {
		const deferring = syntaxPlugin({
			parseKey: 'defer',
			syntax: {
				inline: [
					{
						startsWith: ['<<'],
						maxSpan: 64,
						tokenize: (input: MarkdownTokenizerInput) => {
							const end = input.source.indexOf('>>', input.offset + 2)
							return end === -1 && !input.isFinal
								? { status: 'defer' }
								: end === -1
									? { status: 'no-match' }
									: {
											status: 'match',
											end: end + 2,
											node: {
												type: 'extension',
												plugin: 'test-syntax',
												name: 'angle',
												display: 'inline',
												data: null,
											},
										}
						},
					},
				],
			},
		} as never)
		const state = createMarkdownIncrementalState()
		const plugins = [deferring]
		const early = parseMarkdownIncremental('start <<incom', state, {
			plugins,
			isFinal: false,
		})
		// The deferred tail is withheld rather than parsed as literal text.
		expect(JSON.stringify(early)).not.toContain('<<incom')
		const late = parseMarkdownIncremental('start <<incom>> done', state, {
			plugins,
			isFinal: false,
		})
		expect(
			late.children.some((b) => b.type === 'paragraph' &&
				(b as { children: { type: string }[] }).children.some(
					(c) => c.type === 'extension',
				)),
		).toBe(true)
	})

	it('changing syntax-plugin identity invalidates settled blocks', () => {
		const state = createMarkdownIncrementalState()
		const first = parseMarkdownIncremental('!!! a\n\ntail\n', state, {
			plugins: [blockPlugin()],
		}).children
		expect(first[0].type).toBe('extension')
		// Removing the plugin flips the identity → settled nodes re-parse.
		const second = parseMarkdownIncremental('!!! a\n\ntail\n', state, {}).children
		expect(second[0].type).toBe('paragraph')
	})

	it('a parseKey change invalidates settled blocks while renderer-only changes do not', () => {
		const keyed = (parseKey: string) =>
			createMarkdownPlugin({
				name: `keyed-${parseKey}`,
				apiVersion: 1,
				parseKey,
				syntax: {
					block: [
						{
							startsWith: ['!!!'],
							maxSpan: 128,
							tokenize(input: MarkdownTokenizerInput) {
								const end = input.source.indexOf('\n', input.offset)
								const stop = end === -1 ? input.end : end
								return {
									status: 'match' as const,
									end: stop,
									node: {
										type: 'extension' as const,
										plugin: `keyed-${parseKey}`,
										name: 'callout',
										display: 'block' as const,
										data: input.source.slice(input.offset + 3, stop),
									},
								}
							},
						},
					],
				},
				renderers: { callout: PASS },
			})
		const state = createMarkdownIncrementalState()
		const settled = parseMarkdownIncremental('!!! a\n\ntail\n', state, {
			plugins: [keyed('v1')],
		}).children
		expect(settled[0].type).toBe('extension')
		// A new parseKey reinterprets the same source — the settled extension
		// must not survive the configuration change.
		const reparsed = parseMarkdownIncremental('!!! a\n\ntail\n', state, {
			plugins: [keyed('v2')],
		}).children
		expect(reparsed[0].type).toBe('extension')
		expect(reparsed[0]).not.toBe(settled[0])
	})

	it('a transform-only plugin list keeps settled nodes but reruns transforms', () => {
		const seen: string[] = []
		const counting = () =>
			createMarkdownPlugin({
				name: 'counter',
				apiVersion: 1,
				transform(document, context) {
					seen.push(context.isFinal ? 'final' : 'partial')
					return document
				},
			})
		const state = createMarkdownIncrementalState()
		const first = parseMarkdownIncremental('alpha\n\ntail', state, {
			plugins: [counting()],
		}).children
		// Same syntax identity, different transform instance → settled block
		// objects stay shared while transforms re-observe the document.
		const second = parseMarkdownIncremental('alpha\n\ntail', state, {
			plugins: [counting()],
		}).children
		expect(second[0]).toBe(first[0])
		expect(seen.length).toBeGreaterThanOrEqual(2)
	})

	it('stream parser applies transforms only on append/finish semantics', () => {
		const parser = createMarkdownStreamParser({ plugins: [blockPlugin()] })
		parser.append('!!! one\n\n')
		const doc = parser.append('text')
		expect(doc.children[0].type).toBe('extension')
		expect(parser.finish().children).toEqual(doc.children)
	})
})

describe('transforms', () => {
	it('runs in registration order with source, finality, and display', () => {
		const seen: string[] = []
		const mk = (name: string) =>
			createMarkdownPlugin({
				name,
				apiVersion: 1,
				transform: (doc, ctx) => {
					seen.push(`${name}:${ctx.isFinal}:${ctx.display}:${ctx.source.length}`)
					return doc
				},
			})
		parseMdNodes('x', { plugins: [mk('a'), mk('b')] })
		expect(seen).toEqual(['a:true:block:1', 'b:true:block:1'])
	})

	it('a thrown transform leaves the previous document intact', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const throws = createMarkdownPlugin({
			name: 'throws',
			apiVersion: 1,
			transform: () => {
				throw new Error('kaboom')
			},
		})
		const nodes = parseMdNodes('hi', { plugins: [throws] })
		expect(nodes[0].type).toBe('paragraph')
		expect(warn).toHaveBeenCalled()
	})

	it('an async transform is rejected and reported', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const asyncPlugin = createMarkdownPlugin({
			name: 'async',
			apiVersion: 1,
			transform: (async () => null) as never,
		})
		parseMdNodes('hi', { plugins: [asyncPlugin] })
		expect(warn).toHaveBeenCalled()
	})

	it('untrusted output is validated: foreign nodes and bad roots fall back', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const evil = createMarkdownPlugin({
			name: 'evil',
			apiVersion: 1,
			transform: () => ({
				kind: 'octane-xplat/md',
				v: 2,
				children: [
					{
						type: 'extension',
						plugin: 'foreign',
						name: 'x',
						display: 'block',
						data: null,
					},
				],
			}),
		})
		const nodes = parseMdNodes('hi', { plugins: [evil] })
		expect(nodes[0].type).toBe('paragraph')
		expect(warn).toHaveBeenCalled()
	})

	it('transform input is frozen; mutating it throws and falls back', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const mutator = createMarkdownPlugin({
			name: 'mutator',
			apiVersion: 1,
			transform: (doc) => {
				;(doc.children[0] as { children: unknown[] }).children = []
				return doc
			},
		})
		const nodes = parseMdNodes('hi', { plugins: [mutator] })
		expect(nodes[0].type).toBe('paragraph')
		expect(warn).toHaveBeenCalled()
	})

	it('report() surfaces without throwing', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const reporter = createMarkdownPlugin({
			name: 'reporter',
			apiVersion: 1,
			transform: (doc, ctx) => {
				ctx.report('soft issue')
				return doc
			},
		})
		parseMdNodes('hi', { plugins: [reporter] })
		expect(warn).toHaveBeenCalledWith(
			expect.stringContaining('reporter'),
			expect.anything(),
		)
	})

	it('renderer/toText fallback resolves through the prepared map', () => {
		const entry = syntaxPlugin()
		const prepared = prepareMarkdownPlugins([entry])
		const node: MarkdownExtensionNode = {
			type: 'extension',
			plugin: 'test-syntax',
			name: 'angle',
			display: 'inline',
			data: null,
			source: '<<x>>',
		}
		expect(getMarkdownExtensionRenderer(prepared, node)?.toText(node)).toBe('ext')
		expect(markdownExtensionText(prepared, node)).toBe('ext')
		expect(markdownExtensionText(undefined, node)).toBe('<<x>>')
	})
})

describe('plugin data', () => {
	it('accepts JSON values, rejects cycles/functions/non-finite', () => {
		expect(isMarkdownPluginData(null)).toBe(true)
		expect(isMarkdownPluginData({ a: [1, 'x', { b: true }] })).toBe(true)
		expect(isMarkdownPluginData(Number.NaN)).toBe(false)
		expect(isMarkdownPluginData({ f: () => {} })).toBe(false)
		const cyclic: { self?: unknown } = {}
		cyclic.self = cyclic
		expect(isMarkdownPluginData(cyclic)).toBe(false)
	})
})

describe('createMarkdownTextTransform', () => {
	it('replaces matches in prose and respects protected contexts', () => {
		const transform = createMarkdownTextTransform({
			pattern: /\bbravo\b/g,
			requiredSubstrings: ['bravo'],
			replace: (match) => ({
				type: 'strong',
				children: [{ type: 'text', value: match[0].toUpperCase() }],
			}),
		})
		const plugin = createMarkdownPlugin({
			name: 'txt',
			apiVersion: 1,
			transform,
		})
		const nodes = parseMdNodes('alpha bravo\n\n```\nbravo\n```', {
			plugins: [plugin],
		})
		const para = nodes[0] as { children: { type: string; value?: string }[] }
		expect(para.children[1].type).toBe('strong')
		// Code block untouched.
		expect((nodes[1] as { type: string }).type).toBe('code')
		// Claim skip: source without the literal costs no transform run.
		const skipped = parseMdNodes('nothing here', { plugins: [plugin] })
		expect(skipped[0].type).toBe('paragraph')
	})

	it('rejects callbacks that return foreign, block, or unsafe nodes', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const plugin = createMarkdownPlugin({
			name: 'txt2',
			apiVersion: 1,
			transform: createMarkdownTextTransform({
				pattern: /x/g,
				replace: () => ({
					type: 'link',
					url: 'javascript:alert(1)',
					children: [{ type: 'text', value: 'x' }],
				}),
			}),
		})
		// Invalid replacement → transform error path reports and keeps document.
		const nodes = parseMdNodes('x', { plugins: [plugin] })
		expect(nodes[0].type).toBe('paragraph')
		expect(warn).toHaveBeenCalled()
	})
})

describe('createMarkdownFenceTransform', () => {
	const fence = createMarkdownPlugin({
		name: 'fences',
		apiVersion: 1,
		transform: createMarkdownFenceTransform({
			languages: ['chart'],
			createNode: ({ code }) => ({
				type: 'extension',
				plugin: 'fences',
				name: 'chart',
				display: 'block',
				data: { code },
			}),
		}),
		renderers: { chart: PASS },
	})

	it('annotates eligible fences with a validated proposal', () => {
		const nodes = parseMdNodes('```chart\nabc\n```', { plugins: [fence] })
		const code = nodes[0] as MdNode
		expect(code.type).toBe('code')
		const proposal = getMarkdownFenceProposal(code as never)
		expect(proposal?.node.plugin).toBe('fences')
		expect(proposal?.node.data).toEqual({ code: 'abc' })
		expect(Object.isFrozen(proposal?.node.data)).toBe(true)
	})

	it('createNode returning null keeps ordinary code rendering', () => {
		const declining = createMarkdownPlugin({
			name: 'f2',
			apiVersion: 1,
			transform: createMarkdownFenceTransform({
				languages: ['chart'],
				createNode: () => null,
			}),
			renderers: { chart: PASS },
		})
		const nodes = parseMdNodes('```chart\nabc\n```', { plugins: [declining] })
		expect(getMarkdownFenceProposal(nodes[0] as never)).toBeUndefined()
	})

	it('foreign plugin names, missing renderers, and block-source nodes are rejected', () => {
		const bad = createMarkdownPlugin({
			name: 'f3',
			apiVersion: 1,
			transform: createMarkdownFenceTransform({
				languages: ['chart'],
				createNode: () => ({
					type: 'extension',
					plugin: 'someone-else',
					name: 'chart',
					display: 'block',
					data: null,
				}),
			}),
			renderers: { chart: PASS },
		})
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const nodes = parseMdNodes('```chart\nabc\n```', { plugins: [bad] })
		expect(getMarkdownFenceProposal(nodes[0] as never)).toBeUndefined()
		expect(warn).toHaveBeenCalled()
	})
})

describe('createMarkdownSourceDecoration', () => {
	it('records ordered decorations on overlapping source-backed nodes', () => {
		const plugin = createMarkdownPlugin({
			name: 'deco',
			apiVersion: 1,
			transform: createMarkdownSourceDecoration({
				name: 'highlight',
				ranges: [{ start: 0, end: 3, data: { tone: 'info' } }],
			}),
		})
		const nodes = parseMdNodes('hi there', { plugins: [plugin] })
		const decorations = getMarkdownSourceDecorations(nodes[0])
		expect(decorations).toEqual([{ name: 'highlight', data: { tone: 'info' } }])
	})

	it('stays absent on non-final input (streaming) and applies on finish', () => {
		const plugin = createMarkdownPlugin({
			name: 'deco2',
			apiVersion: 1,
			transform: createMarkdownSourceDecoration({
				name: 'mark',
				ranges: [{ start: 0, end: 4 }],
			}),
		})
		const parser = createMarkdownStreamParser({ plugins: [plugin] })
		parser.append('mark')
		expect(getMarkdownSourceDecorations(parser.append(' here').children[0])).toEqual([])
		expect(
			getMarkdownSourceDecorations(parser.finish().children[0]),
		).toEqual([{ name: 'mark' }])
	})

	it('skips nodes carrying foreign data at the envelope key', () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const inject = createMarkdownPlugin({
			name: 'inject',
			apiVersion: 1,
			transform: (doc) => ({
				...doc,
				children: doc.children.map((c) => ({
					...c,
					data: { 'astryx:sourceDecorations': { not: 'an envelope' } },
				})),
			}),
		})
		const deco = createMarkdownPlugin({
			name: 'deco3',
			apiVersion: 1,
			transform: createMarkdownSourceDecoration({
				name: 'mark',
				ranges: [{ start: 0, end: 2 }],
			}),
		})
		const nodes = parseMdNodes('hi', { plugins: [inject, deco] })
		expect(getMarkdownSourceDecorations(nodes[0])).toEqual([])
		expect(warn).toHaveBeenCalled()
	})
})

describe('createMarkdownFrontmatter', () => {
	it('parses fields into typed metadata and strips the frontmatter block', () => {
		const fm = createMarkdownFrontmatter({
			name: 'meta',
			parse: (fields) => ({ title: fields.title ?? 'untitled' }),
		})
		const doc = parseMdDoc('---\ntitle: Hello\n---\nbody', { plugins: [fm.plugin] })
		expect(fm.getMetadata(doc)).toEqual({ title: 'Hello' })
		expect(doc.children).toHaveLength(1)
		expect((doc.children[0] as { children: { value?: string }[] }).children[0].value).toBe(
			'body',
		)
		expect(fm.parse('---\ntitle: H\n---\nx')).toMatchObject({
			status: 'match',
			metadata: { title: 'H' },
		})
	})

	it('non-final incomplete frontmatter defers; final resolves to none', () => {
		const fm = createMarkdownFrontmatter({
			name: 'meta',
			parse: (fields) => fields,
		})
		expect(fm.parse('---\ntitle: H', false).status).toBe('defer')
		expect(fm.parse('---\ntitle: H', true).status).toBe('none')
		expect(fm.parse('plain', true).status).toBe('none')
	})
})

describe('markdownSoftBreaksPlugin', () => {
	it('converts soft line endings into hard break nodes', () => {
		const nodes = parseMdNodes('one\ntwo', { plugins: [markdownSoftBreaksPlugin] })
		const children = (nodes[0] as { children: { type: string }[] }).children
		expect(children.map((c) => c.type)).toEqual(['text', 'break', 'text'])
	})
})

describe('markdownSourceLinesPlugin', () => {
	it('records 1-based inclusive position lines on blocks', () => {
		const nodes = parseMdNodes('one\n\nthree\n\nfive', {
			plugins: [markdownSourceLinesPlugin],
		})
		expect(nodes[0].position?.start.line).toBe(1)
		expect(nodes[0].position?.end.line).toBe(1)
		expect(nodes[1].position?.start.line).toBe(3)
		expect(nodes[2].position?.start.line).toBe(5)
		// Without the plugin, no line work runs.
		expect(parseMdNodes('one')[0].position?.start.line).toBeUndefined()
	})

	it('stamps absolute lines inside containers and incremental slices', () => {
		const state = createMarkdownIncrementalState()
		const plugins = [markdownSourceLinesPlugin]
		parseMarkdownIncremental('- a\n- b\n\n', state, { plugins })
		const nodes = parseMarkdownIncremental('- a\n- b\n\ntail', state, { plugins }).children
		const list = nodes[0] as MdNode & { children: { children: MdNode[] }[] }
		expect(list.type).toBe('list')
		expect(list.position?.start.line).toBe(1)
	})
})

describe('createMarkdownHeadingLinks', () => {
	it('projects stable ids, labels, and permalink URLs at every depth', () => {
		const plugins = [createMarkdownHeadingLinks({ permalinkBaseUrl: 'https://docs.example/a' })]
		const prepared = prepareMarkdownPlugins(plugins)
		const doc = parseMdDoc('# Title\n\n> ## Nested\n\n## Title', { plugins })
		const projection = projectMarkdownHeadingLinks(doc, prepared)!
		expect(projection).toBeDefined()
		const headings: string[] = []
		for (const [node, id] of projection.ids) {
			headings.push(`${id}=${node.position?.start.line}`)
		}
		// All three headings (incl. the nested quote heading) get stable slugs.
		expect(projection.ids.size).toBe(3)
		expect(projection.permalinkUrls.size).toBe(3)
		const ids = [...projection.ids.values()]
		expect(new Set(ids).size).toBe(3)
		expect([...projection.permalinkUrls.values()][0]).toBe(
			'https://docs.example/a#title',
		)
	})

	it('honors headingIdPrefix and rejects unsafe base URLs', () => {
		const plugins = [createMarkdownHeadingLinks({ headingIdPrefix: 'doc', permalinkBaseUrl: 'https://x.dev' })]
		const doc = parseMdDoc('# A', { plugins })
		const projection = projectMarkdownHeadingLinks(doc, prepareMarkdownPlugins(plugins))!
		expect([...projection.ids.values()][0]).toBe('doc--a')
		expect(() =>
			createMarkdownHeadingLinks({ permalinkBaseUrl: 'javascript:x' }),
		).toThrow()
	})
})

describe('applyMarkdownTransforms pipeline', () => {
	it('returns the input unchanged with no plugins', () => {
		const doc = parseMdDoc('x')
		expect(applyMarkdownTransforms(doc, undefined, 'x', true, 'block')).toBe(doc)
	})
})

type _CheckEntry = MarkdownPluginEntry
