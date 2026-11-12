// Reference-backed fixtures for the Remark adapter — ported from Meta
// Platforms' Astryx `packages/core/src/Markdown/remark.test.tsx`, MIT license
// (tag v0.7.4, revision 704757fd827c6fa00a71af80b06d5da99d155e45), adapted to
// the renderer-free transform contract.

import { describe, expect, it } from 'vitest'
import { mdDoc, type MdDoc } from './markdown-ast.ts'
import { parseMdDoc, parseMdInline } from './markdown-parse.ts'
import {
  createMarkdownPlugin,
  type MarkdownExtensionNode,
  type MarkdownPluginEntry,
  type MarkdownSyntaxPluginDefinition,
  type MarkdownTransformContext,
} from './markdown-plugins.ts'

import {
  createMarkdownRemarkTransform,
  type MarkdownRemarkPlugin,
  type MarkdownRemarkRoot,
} from './markdown-remark.ts'

type MutableNode = {
  type: string
  children?: MutableNode[]
  [key: string]: unknown
}

/** Minimal unist-style walk, matching how real Remark plugins traverse. */
function visit(node: MutableNode, visitor: (node: MutableNode) => void): void {
  visitor(node)
  if (Array.isArray(node.children)) {
    for (const entry of Array.from(node.children)) {
      visit(entry, visitor)
    }
  }
}

function asTree(tree: MarkdownRemarkRoot): MutableNode {
  return tree as unknown as MutableNode
}

function mutateFirst(
  tree: MarkdownRemarkRoot,
  type: string,
  mutate: (node: MutableNode) => void,
): void {
  let done = false

  visit(asTree(tree), (node) => {
    if (!done && node.type === type) {
      done = true
      mutate(node)
    }
  })
}

/** A realistic transform-only plugin in Unified's attacher shape: wraps a
 *  prose term in `strong` without touching protected contexts. */
const remarkStrongTerm: MarkdownRemarkPlugin<[{ term: string }]> =
  ({ term }) =>
  (tree, file) => {
    let matches = 0

    visit(asTree(tree), (node) => {
      if (!Array.isArray(node.children) || node.type === 'strong') {
        return
      }

      node.children = node.children.flatMap((candidate) => {
        if (candidate.type !== 'text' || typeof candidate.value !== 'string') {
          return [candidate]
        }

        const parts = (candidate.value as string).split(term)

        if (parts.length === 1) {
          return [candidate]
        }

        matches += parts.length - 1
        return parts.flatMap((part, index) =>
          index === 0
            ? part === ''
              ? []
              : [{ type: 'text', value: part }]
            : [
                { type: 'strong', children: [{ type: 'text', value: term }] },
                ...(part === '' ? [] : [{ type: 'text', value: part }]),
              ],
        )
      })
    })

    if (matches > 0) {
      file.message(`wrapped ${matches} term(s)`)
    }
  }

type NoteNode = MarkdownExtensionNode<'notes', 'note', { readonly body: string }, 'block'>

const notePlugin = createMarkdownPlugin<'notes', NoteNode>({
  name: 'notes',
  apiVersion: 1,
  parseKey: 'v1',
  syntax: {
    block: [
      {
        startsWith: [':::note'],
        maxSpan: 200,
        tokenize({ source, offset, end, isFinal }) {
          const close = source.indexOf('\n:::', offset + 7)

          if (close < 0 || close + 4 > end) {
            return isFinal ? { status: 'no-match' } : { status: 'defer' }
          }

          return {
            status: 'match',
            end: close + 4,
            node: {
              type: 'extension',
              plugin: 'notes',
              name: 'note',
              display: 'block',
              data: { body: source.slice(offset + 7, close).trim() },
            },
          }
        },
      },
    ],
  },
  renderers: {
    note: {
      render: () => null,
      toText: (node) => node.data.body,
    },
  },
} satisfies MarkdownSyntaxPluginDefinition<'notes', NoteNode>)

function deepFreeze<T>(value: T, seen = new Set<object>()): T {
  if (value != null && typeof value === 'object' && !seen.has(value)) {
    seen.add(value)
    for (const nested of Object.values(value)) {
      deepFreeze(nested, seen)
    }

    Object.freeze(value)
  }

  return value
}

interface RunResult {
  readonly root: MdDoc
  readonly result: MdDoc
  readonly reports: string[]
}

function runAdapter(
  source: string,
  plugin: MarkdownRemarkPlugin<[]>,
  options: {
    display?: 'inline' | 'block'
    sourceIds?: ReadonlySet<string>
    plugins?: ReadonlyArray<MarkdownPluginEntry>
    math?: boolean
  } = {},
): RunResult {
  const display = options.display ?? 'block'
  const parsed =
    display === 'inline'
      ? mdDoc([
          {
            type: 'paragraph',
            children: parseMdInline(source, {
              sourceIds: options.sourceIds,
              math: options.math,
            }),
          },
        ])
      : parseMdDoc(source, {
          sourceIds: options.sourceIds,
          math: options.math,
          plugins: options.plugins,
        })

  const root = deepFreeze(parsed)
  const reports: string[] = []
  const context: MarkdownTransformContext = {
    source,
    isFinal: true,
    display,
    report: (message) => reports.push(message),
  }

  const result = createMarkdownRemarkTransform(plugin)(root, context)

  return { root, result, reports }
}

const everyNodeSource = [
  '# Heading with `code` and *emphasis*',
  '',
  'Prose with **strong**, ~~struck~~, [a link](/docs), ![alt](/logo.png), a',
  'citation [ref], $x + y$ inline math, and a hard break.  ',
  'Second line.',
  '',
  '![standalone](/hero.png)',
  '',
  '> Quoted prose',
  '>',
  '> - nested item',
  '',
  '1) First',
  '2) Second',
  '',
  '- [ ] open task',
  '- [x] done task',
  '',
  '| Left | Right |',
  '| :--- | ----: |',
  '| a    | b     |',
  '',
  '```ts title="example.ts" {1,3}',
  'const value = 1;',
  '```',
  '',
  '```',
  'no language, no meta',
  '```',
  '',
  '$$',
  'a^2 + b^2',
  '$$',
  '',
  '---',
  '',
  ':::note',
  'An owned extension node.',
  ':::',
].join('\n')

describe('remark adapter — supported round trip', () => {
  it('returns the identical document when every supported node is untouched', () => {
    const root = deepFreeze(
      parseMdDoc(everyNodeSource, {
        math: true,
        sourceIds: new Set(['ref']),
        plugins: [notePlugin],
      }),
    )

    const reports: string[] = []
    const transform = createMarkdownRemarkTransform(() => () => undefined)
    const result = transform(root, {
      source: everyNodeSource,
      isFinal: true,
      display: 'block',
      report: (message) => reports.push(message),
    })

    // Identity, not just equality: every node round-tripped without loss,
    // so the adapter reuses the canonical tree instead of allocating a copy.
    expect(result).toBe(root)
    expect(reports).toEqual([])
  })

  it('exposes the supported subset as a mutable mdast tree', () => {
    const seen: string[] = []

    runAdapter(
      everyNodeSource,
      () => (tree) => {
        visit(asTree(tree), (node) => {
          seen.push(node.type)
        })
      },
      { sourceIds: new Set(['ref']), plugins: [notePlugin], math: true },
    )

    expect(new Set(seen)).toEqual(
      new Set([
        'root',
        'heading',
        'paragraph',
        'text',
        'inlineCode',
        'inlineMath',
        'emphasis',
        'strong',
        'delete',
        'link',
        'image',
        'break',
        'blockquote',
        'list',
        'listItem',
        'table',
        'tableRow',
        'tableCell',
        'code',
        'math',
        'citation',
        'extension',
        'thematicBreak',
      ]),
    )
  })

  it('applies a compatible transform and keeps protected contexts literal', () => {
    const { result, reports } = runAdapter(
      'Use Astryx with `Astryx code` and Astryx prose.',
      () => remarkStrongTerm({ term: 'Astryx' }) as never,
    )

    const paragraph = result.children[0] as { children: { type: string; value?: string }[] }
    const strongs = paragraph.children.filter((node) => node.type === 'strong')

    expect(strongs).toHaveLength(2)

    // The plugin's own walk skips non-text nodes, so the code span's value
    // survives untouched while surrounding text splits into strong runs.
    const code = paragraph.children.find((node) => node.type === 'inlineCode')

    expect(code?.value).toBe('Astryx code')
    expect(reports).toEqual([])
  })

  it('lets a mutation land when the plugin only removes a node', () => {
    const { result } = runAdapter('# One\n\n## Two\n\nBody.', () => (tree) => {
      const root = asTree(tree)
      const index = root.children?.findIndex((node) => node.type === 'heading')

      if (index != null && index >= 0) {
        root.children?.splice(index, 1)
      }
    })

    expect(result.children.map((node) => node.type)).toEqual(['heading', 'paragraph'])
  })

  it('gives every invocation a fresh tree and isolated file data', () => {
    const { root, result } = runAdapter('Alpha prose.', () => (tree, file) => {
      expect(Object.isFrozen(asTree(tree))).toBe(false)
      file.data.seen = (file.data.seen as number | undefined) ?? 0
      file.data.seen = (file.data.seen as number) + 1
      expect(file.data.seen).toBe(1)
      mutateFirst(tree, 'text', (node) => {
        node.value = 'mutated'
      })
    })

    expect(result).not.toBe(root)
    expect(JSON.stringify(root)).toContain('Alpha')
    expect(JSON.stringify(result)).toContain('mutated')
  })
})

describe('remark adapter — fenced code metadata', () => {
  it('round-trips a parsed fence untouched, metadata included', () => {
    const { root, result } = runAdapter(
      '```ts title="example.ts"\nconst v = 1;\n```',
      () => () => undefined,
    )

    expect(result).toBe(root)

    const code = result.children[0] as { lang: string; meta?: string; value: string }

    expect(code.lang).toBe('ts')
    expect(code.meta).toBe('title="example.ts"')
  })

  it('carries metadata into and back out of a transform', () => {
    const { result } = runAdapter('```\nplain\n```', () => (tree) => {
      mutateFirst(tree, 'code', (node) => {
        node.lang = 'ts'
        node.meta = 'line=1'
      })
    })

    const code = result.children[0] as { lang: string; meta?: string }

    expect(code.lang).toBe('ts')
    expect(code.meta).toBe('line=1')
  })

  it('rejects metadata Octane cannot represent', () => {
    const { root, result, reports } = runAdapter('```\nx\n```', () => (tree) => {
      mutateFirst(tree, 'code', (node) => {
        node.meta = 42
      })
    })

    expect(result).toBe(root)
    expect(reports.join('\n')).toMatch(/string or null "meta"/)
  })
})

describe('remark adapter — the constrained file fails closed', () => {
  const unsupportedKeys = [
    'path',
    'cwd',
    'history',
    'basename',
    'dirname',
    'extname',
    'stem',
    'stored',
    'result',
    'map',
    'contents',
  ]

  it.each(unsupportedKeys)('rejects reading file.%s', (key) => {
    const { root, result, reports } = runAdapter('Body.', () => (tree, file) => {
      void (file as unknown as Record<string, unknown>)[key]
    })

    expect(result).toBe(root)
    expect(reports.join('\n')).toMatch(new RegExp(`no "${key}" in this profile`))
  })

  it('rejects reading an arbitrary key without echoing its name', () => {
    const { result, root, reports } = runAdapter('Body.', () => (tree, file) => {
      void (file as unknown as Record<string, unknown>)['plugin-chosen-key']
    })

    expect(result).toBe(root)
    expect(reports.join('\n')).toContain('"unknown"')
    expect(reports.join('\n')).not.toContain('plugin-chosen-key')
  })

  it.each(['path', 'value'])('rejects writing file.%s', (key) => {
    const { root, result, reports } = runAdapter('Body.', () => (tree, file) => {
      ;(file as unknown as Record<string, unknown>)[key] = 'x'
    })

    expect(result).toBe(root)
    expect(reports.join('\n')).toMatch(/cannot be assigned/)
  })

  it('lets a plugin feature-detect instead of failing', () => {
    const { result, root } = runAdapter('Body.', () => (tree, file) => {
      if ('path' in file) {
        throw new Error('must not reach')
      }

      expect(Object.keys(file)).toEqual([
        'value',
        'data',
        'messages',
        'message',
        'fail',
        'toString',
      ])

      expect(file.value).toBe('Body.')
      expect(file.toString()).toBe('Body.')
    })

    expect(result).toBe(root)
  })
})

describe('remark adapter — a plugin cannot talk its way out of a failure', () => {
  it('fails the run when the plugin swallows its own fail()', () => {
    const { root, result, reports } = runAdapter('Body.', () => (tree, file) => {
      try {
        file.fail('plugin-authored reason with secret text')
      } catch {
        // Swallowing the refusal does not clear the run's verdict.
      }
    })

    expect(result).toBe(root)
    expect(reports.join('\n')).toContain('unsupported')
    expect(reports.join('\n')).not.toContain('secret text')
  })

  it('keeps the verdict when the plugin swallows fail() then throws its own error', () => {
    const { root, result, reports } = runAdapter('Body.', () => (tree, file) => {
      try {
        file.fail('first verdict')
      } catch {
        // swallowed
      }

      throw new Error('plugin message must not echo')
    })

    expect(result).toBe(root)
    expect(reports.join('\n')).toContain('unsupported')
    expect(reports.join('\n')).not.toContain('plugin message')
  })

  it('fails the attach when the plugin touches the processor', () => {
    const { root, result, reports } = runAdapter('Body.', function (this: {
      data(key: string): void
    }) {
      this.data('micromarkExtensions')
      return () => undefined
    } as never)

    expect(result).toBe(root)
    expect(reports.join('\n')).toMatch(/processor registration/)
  })

  it('reports exactly one fixed diagnostic that cannot carry plugin text', () => {
    const { reports } = runAdapter('Body.', () => () => {
      throw new Error('plugin-authored text must not echo')
    })

    expect(reports).toHaveLength(1)
    expect(reports[0]).toContain('Remark adapter:')
    expect(reports[0]).not.toContain('plugin-authored')
  })
})

describe('remark adapter — rejection matrix', () => {
  interface RejectionCase {
    name: string
    plugin: MarkdownRemarkPlugin<[]>
    reason: RegExp
    source?: string
    sourceIds?: ReadonlySet<string>
    plugins?: ReadonlyArray<MarkdownPluginEntry>
    display?: 'inline' | 'block'
  }

  const rejectionCases: RejectionCase[] = [
    {
      name: 'an asynchronous transformer',
      plugin: () => (async () => undefined) as never,
      reason: /asynchronous transformer/,
    },
    {
      name: 'a callback-style transformer',
      plugin: () => ((_tree: unknown, _file: unknown, _next: unknown) => undefined) as never,
      reason: /callback-style/,
    },
    {
      name: 'a parser or compiler plugin that registers processor state',
      plugin: function parserPlugin(this: { data(key: string): void }) {
        this.data('micromarkExtensions')
        return () => undefined
      } as never,
      reason: /processor registration/,
    },
    {
      name: 'a plugin that returns no transformer',
      plugin: () => undefined,
      reason: /transform-only plugin/,
    },
    {
      name: 'a plugin that returns a promise from its attacher',
      // eslint-disable-next-line unicorn/no-thenable -- Adversarial thenable fixture verifies synchronous plugin rejection.
      plugin: (() => ({ then: () => undefined })) as never,
      reason: /asynchronous plugin/,
    },
    {
      name: 'raw HTML',
      plugin: () => (tree) => {
        void asTree(tree).children?.push({ type: 'html', value: '<b>x</b>' })
      },
      reason: /raw HTML/,
    },
    {
      name: 'an unsupported node kind',
      plugin: () => (tree) => {
        void asTree(tree).children?.push({
          type: 'footnoteDefinition',
          identifier: 'a',
          children: [],
        })
      },
      reason: /"footnoteDefinition" is outside the supported MDAST subset/,
    },
    {
      name: 'a forged source position',
      plugin: () => (tree) => {
        void asTree(tree).children?.push({
          type: 'paragraph',
          children: [{ type: 'text', value: 'forged' }],
          position: { start: { offset: 0 }, end: { offset: 4 } },
        })
      },
      reason: /cannot carry a source position/,
    },
    {
      name: 'a shifted source position',
      plugin: () => (tree) => {
        mutateFirst(tree, 'paragraph', (node) => {
          node.position = { start: { offset: 999 }, end: { offset: 1200 } }
        })
      },
      reason: /position must stay exactly as Core authored it/,
    },
    {
      name: 'a removed source position',
      plugin: () => (tree) => {
        mutateFirst(tree, 'paragraph', (node) => {
          delete node.position
        })
      },
      reason: /position must stay exactly as Core authored it/,
    },
    {
      name: 'a changed source heading depth',
      source: '# Title\n\nBody.',
      plugin: () => (tree) => {
        mutateFirst(tree, 'heading', (node) => {
          node.depth = 4
        })
      },
      reason: /heading's depth cannot change/,
    },
    {
      name: 'a retyped source node',
      plugin: () => (tree) => {
        mutateFirst(tree, 'paragraph', (node) => {
          node.type = 'blockquote'
        })
      },
      reason: /cannot be retyped/,
    },
    {
      name: 'a duplicated source node',
      plugin: () => (tree) => {
        const root = asTree(tree)
        const first = root.children?.[0]

        if (first != null) {
          root.children?.push(first)
        }
      },
      reason: /cannot be duplicated/,
    },
    {
      name: 'an authored Octane extension node',
      plugin: () => (tree) => {
        void asTree(tree).children?.push({
          type: 'extension',
          plugin: 'notes',
          name: 'note',
          display: 'block',
          data: { body: 'forged' },
        })
      },
      reason: /"extension" node cannot be authored or changed/,
    },
    {
      name: 'a rewritten Octane citation',
      source: 'Prose with a citation [ref].',
      sourceIds: new Set(['ref']),
      plugin: () => (tree) => {
        mutateFirst(tree, 'citation', (node) => {
          node.sourceId = 'other'
        })
      },
      reason: /"citation" node cannot be authored or changed/,
    },
    {
      name: "an edited Octane extension node's data",
      source: ':::note\nOwned body.\n:::',
      plugins: [notePlugin],
      plugin: () => (tree) => {
        mutateFirst(tree, 'extension', (node) => {
          node.data = { body: 'rewritten' }
        })
      },
      reason: /"extension" node cannot be authored or changed/,
    },
    {
      name: 'a raw-markup data channel',
      plugin: () => (tree) => {
        mutateFirst(tree, 'paragraph', (node) => {
          node.data = { hName: 'section' }
        })
      },
      reason: /raw-markup data channel "hName"/,
    },
    {
      name: 'a block node inside phrasing content',
      plugin: () => (tree) => {
        mutateFirst(tree, 'paragraph', (node) => {
          node.children = [{ type: 'code', lang: null, value: 'x' }]
        })
      },
      reason: /cannot be a child of/,
    },
    {
      name: 'a link nested inside a link',
      source: '[outer](/a)',
      plugin: () => (tree) => {
        mutateFirst(tree, 'link', (node) => {
          node.children = [
            { type: 'link', url: '/b', title: null, children: [{ type: 'text', value: 'x' }] },
          ]
        })
      },
      reason: /a link cannot be nested inside another link/,
    },
    {
      name: 'a ragged transformed table',
      source: '| a | b |\n| - | - |\n| 1 | 2 |',
      plugin: () => (tree) => {
        mutateFirst(tree, 'tableRow', (node) => {
          node.children = node.children?.slice(0, 1)
        })
      },
      reason: /ragged rows/,
    },
    {
      name: 'a loose list item',
      source: '- one\n- two',
      plugin: () => (tree) => {
        mutateFirst(tree, 'listItem', (node) => {
          node.spread = true
        })
      },
      reason: /loose list item/,
    },
    {
      name: 'a link title',
      source: '[text](/x)',
      plugin: () => (tree) => {
        mutateFirst(tree, 'link', (node) => {
          node.title = 'hover'
        })
      },
      reason: /no Octane representation/,
    },
    {
      name: 'an unsafe link destination',
      source: '[x](/a)',
      plugin: () => (tree) => {
        mutateFirst(tree, 'link', (node) => {
          node.url = 'javascript:alert(1)'
        })
      },
      reason: /link destination was rejected/,
    },
    {
      name: 'block output from an inline entry point',
      display: 'inline',
      source: 'just text',
      plugin: () => (tree) => {
        void asTree(tree).children?.push({ type: 'thematicBreak' })
      },
      reason: /one paragraph of phrasing content/,
    },
  ]

  it.each(rejectionCases)('keeps the last valid document on %s', (testCase) => {
    const { root, result, reports } = runAdapter(testCase.source ?? 'Body text.', testCase.plugin, {
      sourceIds: testCase.sourceIds,
      plugins: testCase.plugins,
      display: testCase.display,
    })

    expect(result).toBe(root)
    expect(reports.join('\n')).toMatch(testCase.reason)
  })

  it('keeps later plugins running after one adapted plugin fails', () => {
    const failing = createMarkdownRemarkTransform(() => () => {
      throw new Error('broken')
    })

    const renaming = createMarkdownRemarkTransform(() => (tree) => {
      mutateFirst(tree, 'text', (node) => {
        node.value = (node.value as string).replace('Body', 'Changed')
      })
    })

    const parsed = deepFreeze(parseMdDoc('Body text.'))
    const reports: string[] = []
    const context: MarkdownTransformContext = {
      source: 'Body text.',
      isFinal: true,
      display: 'block',
      report: (message) => reports.push(message),
    }

    const afterFail = failing(parsed, context)

    expect(afterFail).toBe(parsed)

    const afterRename = renaming(afterFail, context)

    expect(JSON.stringify(afterRename)).toContain('Changed')
  })

  it('rejects a plugin value that is not a function', () => {
    expect(() => createMarkdownRemarkTransform(42 as never)).toThrow(TypeError)
  })

  it('rejects provenance smuggled in from another document', () => {
    const donor = runAdapter('Donor text.', () => (tree) => {
      // Capture a mutable node carrying this run's provenance marker.
      ;(globalThis as { __donorNode?: unknown }).__donorNode = asTree(tree).children?.[0]
    })

    void donor

    const donorNode = (globalThis as { __donorNode?: unknown }).__donorNode
    const { root, result, reports } = runAdapter('Other text.', () => (tree) => {
      asTree(tree).children = [donorNode] as never
    })

    expect(result).toBe(root)
    expect(reports.join('\n')).toMatch(/forged provenance|cannot be duplicated|plain object/)
  })
})

describe('remark adapter — a refused promise is never left unhandled', () => {
  it('refuses an already-rejected transformer result quietly', async () => {
    const unhandled: unknown[] = []
    const onUnhandled = (reason: unknown) => unhandled.push(reason)

    process.on('unhandledRejection', onUnhandled)
    try {
      const { root, result, reports } = runAdapter('Body.', () => () => {
        return Promise.reject(new Error('late failure')) as never
      })

      expect(result).toBe(root)
      expect(reports.join('\n')).toMatch(/asynchronous transformer/)
      await new Promise((resolve) => setTimeout(resolve, 10))
      expect(unhandled).toEqual([])
    } finally {
      process.removeListener('unhandledRejection', onUnhandled)
    }
  })

  it('refuses a thenable whose then throws', () => {
    const { root, result, reports } = runAdapter('Body.', () => () => {
      return {
        // eslint-disable-next-line unicorn/no-thenable -- Adversarial thenable fixture verifies synchronous plugin rejection.
        then() {
          throw new Error('hostile then')
        },
      } as never
    })

    expect(result).toBe(root)
    expect(reports.join('\n')).toMatch(/asynchronous transformer/)
  })
})
