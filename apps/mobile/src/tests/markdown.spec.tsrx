/** @jsxImportSource @octane-xplat/jsx */
import '@octane-xplat/ui/theme/tokens.css'
import '@octane-xplat/ui/theme/utilities.css'
import { expect, it } from 'vitest'
import { isIOS, Trace, type ViewBase } from '@nativescript/core'
import { Pressable, Screen, Text } from '@octane-xplat/ui'
import { Markdown } from '@octane-xplat/ui/markdown'
import { findByTestId, mountXplat, tap, viewText, waitUntil } from '@octane-xplat/platform/testing'
import { useState } from 'octane'

/** Collect plain `text` values plus every FormattedString span's text — link,
 *  citation, and emphasis runs live inside formattedText, not `view.text`. */
function allText(root: ViewBase): string[] {
  const out = viewText(root)
  const walk = (view: any) => {
    const fs = view.formattedText

    if (fs?.spans) {
      fs.spans.forEach((span: any) => {
        if (typeof span.text === 'string') {
          out.push(span.text)
        }
      })
    }

    view.eachChildView?.((child: any) => {
      walk(child)
      return true
    })
  }

  walk(root)
  return out
}

/** Find the first FormattedString span whose text matches `text` and that has
 *  a `linkTap` listener — i.e. a rendered link/citation run. */
function findLinkSpan(root: ViewBase, text: string): any {
  let found: any
  const walk = (view: any) => {
    const fs = view.formattedText

    if (fs?.spans) {
      fs.spans.forEach((span: any) => {
        if (!found && span.text === text && span.hasListeners?.('linkTap')) {
          found = span
        }
      })
    }

    view.eachChildView?.((child: any) => {
      walk(child)
      return true
    })
  }

  walk(root)
  return found
}

const DOC = [
  '# Parity Title',
  '',
  'Body copy with **bold** and [a link](https://example.com/path).',
  '',
  '- item one',
  '- item two',
  '',
  '> quoted line',
  '',
  '```js',
  'const x = 1',
  '```',
  '',
  '| col a | col b |',
  '| --- | --- |',
  '| alpha | beta |',
].join('\n')

function DocFixture(): unknown {
  return (
    <Screen>
      <Markdown>{DOC}</Markdown>
    </Screen>
  )
}

/** Observe `Utils.openUrl` destinations. iOS shadows the bridged
 *  `UIApplication` instance methods `openUrl` calls — the `Utils` namespace
 *  is getter-only, so the call sites can't be patched directly. Android has
 *  no cancelable open path: a `#…` destination matches no installed handler,
 *  so the attempt always surfaces as an error Trace carrying the exact URL. */
function interceptOpenUrl(opened: string[]): () => void {
  if (!isIOS) {
    const writer = {
      write(message: unknown) {
        const match = /handling URL: (.*)$/.exec(String(message))

        if (match != null) {
          opened.push(match[1])
        }
      },
    }

    Trace.addWriter(writer)
    return () => Trace.removeWriter(writer)
  }

  const app = (globalThis as any).UIApplication?.sharedApplication

  if (app == null) {
    return () => {}
  }

  const origCan = app.canOpenURL
  const origOpen = app.openURLOptionsCompletionHandler

  app.canOpenURL = () => true
  app.openURLOptionsCompletionHandler = (url: any, _options: any, done: any) => {
    opened.push(String(url?.absoluteString ?? url))
    done?.(true)
  }

  return () => {
    app.canOpenURL = origCan
    app.openURLOptionsCompletionHandler = origOpen
  }
}

it('renders block and inline content on the real host', async () => {
  const { view } = await mountXplat(DocFixture)

  await waitUntil(() => allText(view).some((t) => t.includes('Parity Title')), {
    message: 'markdown heading never rendered',
  })

  const text = allText(view).join('\n')

  for (const fragment of [
    'Parity Title',
    'Body copy with',
    'bold',
    'a link',
    'item one',
    'item two',
    'quoted line',
    'const x = 1',
    'alpha',
    'beta',
  ]) {
    expect(text, `missing rendered fragment ${JSON.stringify(fragment)}`).toContain(fragment)
  }
})

it('flows inline markdown inside surrounding text', async () => {
  function InlineFixture(): unknown {
    return (
      <Screen>
        <Text>
          {'before '}
          <Markdown display="inline">{'**bold run** and `code run`'}</Markdown>
          {' after'}
        </Text>
      </Screen>
    )
  }

  const { view } = await mountXplat(InlineFixture)

  await waitUntil(() => allText(view).some((t) => t.includes('bold run')), {
    message: 'inline markdown runs never rendered',
  })

  const text = allText(view).join(' ')

  expect(text).toContain('bold run')
  expect(text).toContain('code run')

  // The patched driver folds the label's mixed children into one ordered
  // FormattedString: sibling #text must survive as spans beside the markdown
  // runs, not drop behind formattedText (decision #25 fold).
  const folded = allText(view).join(' ')

  expect(folded).toContain('before')
  expect(folded).toContain('after')

  const label = (function find(v: any): any {
    if (v.formattedText?.spans?.length) {
      return v
    }

    let hit: any

    v.eachChildView?.((c: any) => {
      hit ??= find(c)
      return !hit
    })

    return hit
  })(view)

  const ordered = (label?.formattedText?.spans ?? []).map((s: any) => s.text).join('')

  expect(ordered).toBe('before bold run and code run after')
})

it('keeps nested mark styling in flat runs', async () => {
  function NestedFixture(): unknown {
    return (
      <Screen>
        <Markdown>{'para **bold _deep_ tail** end'}</Markdown>
      </Screen>
    )
  }

  const { view } = await mountXplat(NestedFixture)

  await waitUntil(() => allText(view).some((t) => t.includes('deep')), {
    message: 'nested mark run never rendered',
  })

  const spans: any[] = []
  const walk = (v: any) => {
    v.formattedText?.spans?.forEach((s: any) => spans.push(s))
    v.eachChildView?.((c: any) => {
      walk(c)
      return true
    })
  }

  walk(view)

  const deep = spans.find((s) => s.text === 'deep')

  // The flat FormattedString run carries the union of enclosing marks —
  // strong's weight plus emphasis's italic (reference nested-element
  // styling), not the dropped-inner-style fold.
  expect(deep).toBeTruthy()
  expect(String(deep.fontStyle)).toBe('italic')
  expect(String(deep.fontWeight)).toBe('600')

  const bold = spans.find((s) => s.text === 'bold ')

  expect(bold).toBeTruthy()
  expect(String(bold.fontWeight)).toBe('600')
})

it('dispatches link taps to onLinkClick and honors cancellation', async () => {
  const events: string[] = []
  const opened: string[] = []
  const restore = interceptOpenUrl(opened)

  function LinkFixture(): unknown {
    return (
      <Screen>
        <Markdown
          onLinkClick={(href: string) => {
            events.push(`click:${href}`)
            return false
          }}
        >
          {'Visit [the link](https://example.com/dest) now.'}
        </Markdown>
      </Screen>
    )
  }

  try {
    const { view } = await mountXplat(LinkFixture)

    await waitUntil(() => findLinkSpan(view, 'the link') != null, {
      message: 'link span never rendered',
    })

    const span = findLinkSpan(view, 'the link')

    span.notify({ eventName: 'linkTap', object: span })

    expect(events).toEqual(['click:https://example.com/dest'])
    expect(opened).toEqual([])
  } finally {
    restore()
  }
})

it('dispatches citation taps through the resolved source url', async () => {
  const opened: string[] = []
  const restore = interceptOpenUrl(opened)

  function CiteFixture(): unknown {
    return (
      <Screen>
        <Markdown sources={{ docs: { title: 'Octane docs', url: '#cite-docs' } }}>
          {'Claim [docs] here.'}
        </Markdown>
      </Screen>
    )
  }

  try {
    const { view } = await mountXplat(CiteFixture)

    await waitUntil(() => allText(view).some((t) => t.includes('Octane docs')), {
      message: 'citation run never rendered',
    })

    const span = findLinkSpan(view, 'Octane docs')

    expect(span, 'citation span has no linkTap listener').toBeTruthy()
    span.notify({ eventName: 'linkTap', object: span })
    expect(opened).toEqual(['#cite-docs'])
  } finally {
    restore()
  }
})

const CHUNKS = ['# Stream doc', '\n\nfirst **chunk**', ' and second chunk', ' final.']

function StreamFixture(): unknown {
  const [idx, setIdx] = useState(0)

  return (
    <Screen>
      <Pressable testID="md.pump" onPress={() => setIdx(Math.min(idx + 1, CHUNKS.length))}>
        <Text>pump</Text>
      </Pressable>
      <Markdown isStreaming>{CHUNKS.slice(0, idx).join('')}</Markdown>
    </Screen>
  )
}

it('renders appended streaming chunks and stays mounted through updates', async () => {
  const { view } = await mountXplat(StreamFixture)

  // Empty stream start — the mount path that crashed the web candidate under
  // non-reduced motion; on native it must mount and render nothing fatal.
  const pump = findByTestId(view, 'md.pump')

  expect(pump, 'stream pump control missing').toBeTruthy()

  for (let i = 0; i < CHUNKS.length; i++) {
    await tap(pump!)
  }

  await waitUntil(() => allText(view).some((t) => t.includes('final.')), {
    message: 'streamed content never reached final text',
    timeout: 15_000,
  })

  const text = allText(view).join('\n')

  expect(text).toContain('Stream doc')
  expect(text).toContain('first')
  expect(text).toContain('final.')
})

it('re-renders cleanly when the document source changes', async () => {
  function SwapFixture(): unknown {
    const [alt, setAlt] = useState(false)

    return (
      <Screen>
        <Pressable testID="md.swap" onPress={() => setAlt(true)}>
          <Text>swap</Text>
        </Pressable>
        <Markdown>{alt ? '## Second doc\n\nbeta text' : '# First doc\n\nalpha text'}</Markdown>
      </Screen>
    )
  }

  const { view } = await mountXplat(SwapFixture)

  await waitUntil(() => allText(view).some((t) => t.includes('alpha text')), {
    message: 'initial doc never rendered',
  })

  const swap = findByTestId(view, 'md.swap')!

  await tap(swap)
  await waitUntil(() => allText(view).some((t) => t.includes('beta text')), {
    message: 'swapped doc never rendered',
  })

  expect(allText(view).join('\n')).not.toContain('alpha text')
})

// The layout assertion walks for a scroll-region host by typeName — portable
// across UIKit and Android widgets (qualified on both).
it('lays out a wide table inside its scroll region', async () => {
  function WideTableFixture(): unknown {
    return (
      <Screen>
        <Markdown>
          {
            '| verylongcolumnheaderone | verylongcolumnheadertwo | verylongcolumnheaderthree |\n| --- | --- | --- |\n| aaaa | bbbb | cccc |'
          }
        </Markdown>
      </Screen>
    )
  }

  const { view } = await mountXplat(WideTableFixture)

  await waitUntil(() => allText(view).some((t) => t.includes('aaaa')), {
    message: 'table never rendered',
  })

  // The markdown table should be mounted inside a horizontally scrollable
  // region rather than clipped — find the table's measured extent.
  let scrollView: any
  const walk = (v: any) => {
    const name = v?.typeName ?? ''

    if (!scrollView && /scroll/i.test(name)) {
      scrollView = v
    }

    v.eachChildView?.((c: any) => {
      walk(c)
      return true
    })
  }

  walk(view)
  expect(scrollView, 'no scroll region found around the table').toBeTruthy()
})
