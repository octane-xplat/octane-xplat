import { describe, expect, it } from 'vitest'
import { parseMdDoc, parseMdNodes } from './markdown-parse'
import { isMdDoc, mdInlineText } from './markdown-ast'
import {
  computeBoundaries,
  computeSegments,
  createMarkdownIncrementalState,
  createMarkdownStreamParser,
  parseMarkdownIncremental,
  trimStreamingArtifacts,
} from './markdown-stream'

import type { MdNode } from '../props'

const DOC = [
  '# Release notes',
  '',
  'Intro **bold** and `code` and [a link](https://x.dev).',
  '',
  '- one',
  '- two',
  '',
  '```ts',
  'const x = 1',
  '```',
  '',
  '> quote line',
  '',
  '---',
  '',
  'Tail para with *em* text.',
].join('\n')

/** Top-level blocks carry source positions; drop them for structural
 *  equality checks. */
const strip = (nodes: MdNode[]) => nodes.map(({ position: _p, ...rest }) => rest)

/** Feed `doc` to the incremental parser one character at a time; return the
 *  array of per-chunk outputs. */
function streamByChar(doc: string) {
  const state = createMarkdownIncrementalState()
  const outputs: MdNode[][] = []

  for (let i = 1; i <= doc.length; i++) {
    outputs.push(parseMarkdownIncremental(doc.slice(0, i), state).children)
  }

  return outputs
}

const text = (nodes: MdNode[]): string =>
  nodes
    .map((n) => {
      switch (n.type) {
        case 'code':
        case 'math':
          return n.value
        case 'list':
          return n.children
            .map((i) =>
              i.children
                .map((b) => (b.type === 'paragraph' ? mdInlineText(b.children) : ''))
                .join(''),
            )
            .join('|')
        case 'blockquote':
          return text(n.children)
        default:
          return 'children' in n ? mdInlineText(n.children as never) : ''
      }
    })
    .join('\n')

describe('parseMdNodes', () => {
  it('parses the block grammar into the canonical AST shape', () => {
    expect(strip(parseMdNodes(DOC))).toEqual([
      { type: 'heading', depth: 1, children: [{ type: 'text', value: 'Release notes' }] },
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Intro ' },
          { type: 'strong', children: [{ type: 'text', value: 'bold' }] },
          { type: 'text', value: ' and ' },
          { type: 'inlineCode', value: 'code' },
          { type: 'text', value: ' and ' },
          {
            type: 'link',
            url: 'https://x.dev',
            children: [{ type: 'text', value: 'a link' }],
          },
          { type: 'text', value: '.' },
        ],
      },
      {
        type: 'list',
        ordered: false,
        children: [
          {
            type: 'listItem',
            children: [{ type: 'paragraph', children: [{ type: 'text', value: 'one' }] }],
          },
          {
            type: 'listItem',
            children: [{ type: 'paragraph', children: [{ type: 'text', value: 'two' }] }],
          },
        ],
      },
      { type: 'code', lang: 'ts', value: 'const x = 1' },
      {
        type: 'blockquote',
        children: [{ type: 'paragraph', children: [{ type: 'text', value: 'quote line' }] }],
      },
      { type: 'thematicBreak' },
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'Tail para with ' },
          { type: 'emphasis', children: [{ type: 'text', value: 'em' }] },
          { type: 'text', value: ' text.' },
        ],
      },
    ])
  })

  it('merges blank-separated items of the same mark into one loose list', () => {
    expect(strip(parseMdNodes('- a\n\n- b'))).toEqual([
      {
        type: 'list',
        ordered: false,
        spread: true,
        children: [
          {
            type: 'listItem',
            children: [{ type: 'paragraph', children: [{ type: 'text', value: 'a' }] }],
          },
          {
            type: 'listItem',
            children: [{ type: 'paragraph', children: [{ type: 'text', value: 'b' }] }],
          },
        ],
      },
    ])

    expect(parseMdNodes('1. a\n\n2. b')[0]).toMatchObject({
      type: 'list',
      ordered: true,
      spread: true,
      start: 1,
      delimiter: '.',
      children: expect.arrayContaining([expect.anything(), expect.anything()]),
    })

    // different bullet starts a new list
    expect(parseMdNodes('- a\n\n+ b').map((n) => n.type)).toEqual(['list', 'list'])
  })

  it('matches the reference on `---` after a paragraph and unclosed fences', () => {
    // Reference semantics: `---` following a paragraph is a thematic
    // break, not a setext underline.
    expect(strip(parseMdNodes('foo\n---'))).toEqual([
      { type: 'paragraph', children: [{ type: 'text', value: 'foo' }] },
      { type: 'thematicBreak' },
    ])

    // The reference has no setext headings — `===` folds into the
    // paragraph text.
    expect(strip(parseMdNodes('foo\n==='))).toEqual([
      { type: 'paragraph', children: [{ type: 'text', value: 'foo\n===' }] },
    ])

    expect(strip(parseMdNodes('```js\nx()'))).toEqual([{ type: 'code', lang: 'js', value: 'x()' }])
  })
})

describe('parseMarkdownIncremental', () => {
  it('converges to the full parse when the doc stops growing', () => {
    const outputs = streamByChar(DOC)
    const last = outputs[outputs.length - 1]

    expect(last).toEqual(parseMdNodes(DOC))
  })

  it('converges for a doc ending in constructs that stream mid-token', () => {
    for (const tail of [
      '**bold',
      '`cod',
      '[a](https://x',
      '- item',
      '```ts\ncode',
      '> quote',
      '1. item',
      'text\n---',
    ]) {
      const doc = 'Settled para.\n\n' + tail
      // The stream parser withholds trailing incomplete constructs, so
      // the last snapshot equals a full parse of the trimmed input —
      // positions included.
      const parser = createMarkdownStreamParser()
      let last

      for (const chunk of doc) {
        last = parser.append(chunk)
      }

      expect(last?.children, `doc tail ${JSON.stringify(tail)}`).toEqual(
        parseMdDoc(trimStreamingArtifacts(doc)).children,
      )
    }
  })

  it('never reparses settled blocks — references stay identical once settled', () => {
    // Only content before the last confirmed blank line settles; the
    // paragraph before a trailing blank line is still mutable until the
    // next block arrives. Once settled, the same object is reused.
    const state = createMarkdownIncrementalState()

    parseMarkdownIncremental('# Title\n\nfirst para\n\n', state)

    const second = parseMarkdownIncremental(
      '# Title\n\nfirst para\n\nsecond para\n\n',
      state,
    ).children

    const third = parseMarkdownIncremental(
      '# Title\n\nfirst para\n\nsecond para\n\nthird',
      state,
    ).children

    expect(third[0]).toBe(second[0])
    expect(third[1]).toBe(second[1])
    expect(third[2]).not.toBe(second[2])
  })

  it('returns equal output for an identical snapshot', () => {
    const state = createMarkdownIncrementalState()
    const a = parseMarkdownIncremental('hello **wor', state)
    const b = parseMarkdownIncremental('hello **wor', state)

    expect(b).toEqual(a)
    // The mutable tail is reparsed, but its block objects are reused when
    // the tail is unchanged... it returns a fresh array either way.
    expect(b).not.toBe(a)
  })

  it('resets when input is replaced rather than appended', () => {
    const state = createMarkdownIncrementalState()

    parseMarkdownIncremental('aaa\n\nbbb\n\n', state)

    const out = parseMarkdownIncremental('zzz different\n\n', state).children

    expect(out).toEqual(parseMdNodes('zzz different\n\n'))
  })

  it('shows a bare list marker as text until item text arrives', () => {
    // Matches the reference: `- ` alone parses as a paragraph, and becomes
    // a list once item text streams in.
    const state = createMarkdownIncrementalState()

    expect(parseMarkdownIncremental('intro\n\n- ', state).children.map((n) => n.type)).toEqual([
      'paragraph',
      'paragraph',
    ])

    expect(parseMarkdownIncremental('intro\n\n- item', state).children.map((n) => n.type)).toEqual([
      'paragraph',
      'list',
    ])
  })

  it('withholds a half-typed link instead of flashing literal brackets', () => {
    const parser = createMarkdownStreamParser()
    const mid = parser.append('see [the doc')

    expect(text(mid.children)).not.toContain('[')

    const done = parser.append('](https://x.dev)')

    expect(done.children[0]).toMatchObject({ type: 'paragraph' })
    expect(JSON.stringify(done)).toContain('"type":"link"')
  })

  it('auto-closes mid-line emphasis so it formats while streaming', () => {
    const parser = createMarkdownStreamParser()
    const mid = parser.append('a **bo')

    expect(mid.children[0]).toMatchObject({
      type: 'paragraph',
      children: [{ type: 'text', value: 'a ' }, { type: 'strong' }],
    })
  })

  it('shows an open code fence as a growing code block, not literal backticks', () => {
    const state = createMarkdownIncrementalState()

    expect(
      parseMarkdownIncremental('before\n\n```ts\ncons', state).children.map((n) => n.type),
    ).toEqual(['paragraph', 'code'])

    const later = parseMarkdownIncremental('before\n\n```ts\nconst x = 1\n```', state).children

    expect(later[1]).toMatchObject({ type: 'code', lang: 'ts', value: 'const x = 1' })
  })

  it('merges a loose list split across the settled boundary', () => {
    const state = createMarkdownIncrementalState()

    parseMarkdownIncremental('- a\n\n', state)

    const out = parseMarkdownIncremental('- a\n\n- b\n\n', state).children

    expect(out).toEqual(parseMdNodes('- a\n\n- b\n\n'))
    expect(out).toHaveLength(1)
    expect((out[0] as { children: unknown[] }).children).toHaveLength(2)
  })
})

describe('trimStreamingArtifacts', () => {
  it('trims an unclosed link opener on the last line only', () => {
    expect(trimStreamingArtifacts('done [ok](x)\nopen [part')).toBe('done [ok](x)\nopen ')
    expect(trimStreamingArtifacts('done [ok](x)')).toBe('done [ok](x)')
  })

  it('trims a trailing unclosed backtick run', () => {
    expect(trimStreamingArtifacts('plain text `')).toBe('plain text ')
    // A whole-line fence opener is block-level — the reference leaves it
    // (the open fence streams as a code block, not raw markup).
    expect(trimStreamingArtifacts('para\n```')).toBe('para\n```')
  })

  it('auto-closes unpaired emphasis with content', () => {
    expect(trimStreamingArtifacts('a **bo')).toBe('a **bo**')
    expect(trimStreamingArtifacts('a *b')).toBe('a *b*')
  })

  it('trims a lone trailing emphasis marker', () => {
    expect(trimStreamingArtifacts('a **')).toBe('a ')
  })
})

describe('MdDoc envelope', () => {
  it('round-trips through JSON unchanged', () => {
    const doc = parseMdDoc(DOC)

    expect(isMdDoc(doc)).toBe(true)
    expect(JSON.parse(JSON.stringify(doc))).toEqual(doc)
  })

  it('stream finish() agrees with a full parse', () => {
    const stream = createMarkdownStreamParser()

    for (const chunk of DOC.split(/(?<=\n)/)) {
      stream.append(chunk)
    }

    expect(stream.finish()).toEqual(parseMdDoc(DOC))
  })
})

describe('computeBoundaries/computeSegments', () => {
  it('pushes the previous length only when output grew', () => {
    let b = computeBoundaries([], 0, 4)

    expect(b).toEqual([0])

    const b2 = computeBoundaries(b, 10, 4)

    expect(b2).toEqual([0, 10])
    expect(computeBoundaries(b2, 10, 4)).toBe(b2)
    expect(computeBoundaries(b2, 40, 4)).toEqual([0, 10, 40])
  })

  it('caps the ring and settles evicted spans', () => {
    let b: number[] = []

    for (const len of [0, 3, 6, 9, 12]) {
      b = computeBoundaries(b, len, 3)
    }

    expect(b).toEqual([6, 9, 12])
  })

  it('splits a text run at the boundaries it crosses', () => {
    const segs = computeSegments('hello world', 5, [5, 8], 3)

    expect(segs).toEqual([
      { key: 'fade-3-b5', text: 'hel', fading: true },
      { key: 'fade-3-b8', text: 'lo world', fading: true },
    ])

    // Fully settled text returns null.
    expect(computeSegments('old', 0, [5, 8], 0)).toBeNull()

    // Text straddling the oldest boundary splits settled/fading.
    const mixed = computeSegments('abcdef', 0, [3], 1)

    expect(mixed).toEqual([
      { key: 'settled-1', text: 'abc', fading: false },
      { key: 'fade-1-b3', text: 'def', fading: true },
    ])
  })
})

it.each([
  '| Feature | State |\n| --- | ---: |\n| **Parser** | Ready |',
  '- [x] Done\n- [ ] Pending\n\n- ordinary\n\n- [x] Complete',
  '~~replaced~~ and **current**',
])('rich streamed content converges to full parse: %s', (source) => {
  const state = createMarkdownIncrementalState()
  let output: MdNode[] = []

  for (let i = 1; i <= source.length; i++) {
    output = parseMarkdownIncremental(source.slice(0, i), state).children
  }

  expect(output).toEqual(parseMdNodes(source))
})
