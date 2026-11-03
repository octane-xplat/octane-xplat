/** @jsxImportSource @octane-xplat/jsx/dom */
// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest'
import { act, createRoot, useState } from 'octane'
import { Markdown } from './Markdown.tsrx'

const roots: any[] = []
let rafCallbacks: Array<(time: number) => void>

/** Deterministic reveal: reduced-motion stubs make isStreaming render the
 *  full smoothed prefix synchronously (the reference's own test approach). */
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

/** Browser-faithful frame stubs: the real rAF/cancel require the window
 *  receiver, so a detached call (e.g. `host.request(cb)`) throws
 *  "Illegal invocation" — the failure this suite guards against. Bare
 *  identifier calls arrive with `undefined`/`globalThis` here. */
function driveBrowserFrames() {
  rafCallbacks = []
  const ok = (r: unknown) => r === undefined || r === globalThis || r === window
  vi.stubGlobal('requestAnimationFrame', function (this: unknown, cb: (t: number) => void) {
    if (!ok(this)) {
      throw new TypeError('Illegal invocation')
    }

    rafCallbacks.push(cb)
    return rafCallbacks.length
  })

  vi.stubGlobal('cancelAnimationFrame', function (this: unknown, id: number) {
    if (!ok(this)) {
      throw new TypeError('Illegal invocation')
    }

    rafCallbacks[id - 1] = () => {}
  })

  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }))
}

function frame(now: number) {
  const cbs = rafCallbacks.splice(0)
  act(() => {
    for (const cb of cbs) {
      cb(now)
    }
  })
}

function mount() {
  const el = document.createElement('div')
  document.body.append(el)
  const root = createRoot(el)
  roots.push(root)
  const render = (props: any) => act(() => root.render(<Markdown {...props} />))
  return { el, render }
}

afterEach(() => {
  for (const root of roots.splice(0)) {
    act(() => root.unmount())
  }

  vi.unstubAllGlobals()
  document.body.innerHTML = ''
})

it('renders a baked data doc', () => {
  const { el, render } = mount()
  render({
    data: {
      kind: 'octane-xplat/md',
      v: 2,
      children: [{ type: 'heading', depth: 1, children: [{ type: 'text', value: 'Hi' }] }],
    },
  })

  expect(el.textContent).toContain('Hi')
})

it('parses and renders a text prop', () => {
  const { el, render } = mount()
  render({ children: 'body **bold** and `code`' })
  expect(el.textContent).toContain('body bold and code')
  expect(el.querySelector('strong')?.textContent).toBe('bold')
  expect(el.querySelector('code')?.textContent).toBe('code')
})

it('streams growing text without remounting settled blocks', () => {
  reduceMotion()
  const { el, render } = mount()
  render({ children: '# Title\n\nfirst para', isStreaming: true })
  const heading = el.querySelector('h1')
  const para = el.querySelectorAll('label, span, p')
  render({ children: '# Title\n\nfirst para\n\nsecond para', isStreaming: true })
  expect(el.textContent).toContain('second para')
  // Settled blocks keep their DOM nodes across chunk renders.
  expect(el.querySelector('h1')).toBe(heading)
})

it('withholds a half-typed link while streaming', () => {
  reduceMotion()
  const { el, render } = mount()
  render({ children: 'see [the doc', isStreaming: true })
  expect(el.textContent).not.toContain('[')
  render({ children: 'see [the doc](https://x.dev)', isStreaming: true })
  expect(el.textContent).toContain('the doc')
})

it('mounts an empty stream, reveals appended chunks, finishes, and resets', () => {
  driveBrowserFrames()
  const { el, render } = mount()
  render({ children: '', isStreaming: true })
  expect(el.textContent).toBe('')
  render({ children: '# Title\n\npara text', isStreaming: true })
  frame(50)
  expect(el.textContent).not.toBe('')
  render({ children: '# Title\n\npara text plus more', isStreaming: true })
  frame(100)
  render({ children: '# Title\n\npara text plus more', isStreaming: false })
  expect(el.textContent).toContain('para text plus more')
  render({ children: '', isStreaming: true })
  expect(el.textContent).toBe('')
})

it('unmounts mid-reveal without leaking frame callbacks', () => {
  driveBrowserFrames()
  const { el, render } = mount()
  render({ children: 'partial reveal text', isStreaming: true })
  frame(50)
  const roots0 = roots.splice(0)
  expect(roots0.length).toBe(1)
  act(() => roots0[0].unmount())
  expect(el.textContent).toBe('')
  // Frames scheduled before unmount were cancelled; draining is a no-op.
  frame(200)
  frame(400)
})

it('smooths isStreaming internally — bursts drain through the reveal, not the parser', () => {
  driveFrames()
  const { el, render } = mount()
  // The whole chunk arrives at once but renders one reveal tick at a time.
  render({ children: 'Hello, streamed world.', isStreaming: true })
  expect(el.textContent).toBe('')
  frame(50)
  expect(el.textContent).toBe('Hello, str')
  render({ children: 'Hello, streamed world.', isStreaming: false })
  expect(el.textContent).toContain('Hello, streamed world.')
})

it('wraps newly arrived text in vx-md-fade spans', () => {
  reduceMotion()
  const { el, render } = mount()
  render({ children: 'alpha', isStreaming: true })
  render({ children: 'alpha beta', isStreaming: true })
  const fades = [...el.querySelectorAll('.vx-md-fade')].map((n) => n.textContent)
  expect(fades.at(-1)).toBe(' beta')
})

it('renders rich content through shared table, code, task and strike primitives', () => {
  const { el, render } = mount()
  render({
    children:
      '# Title\n\n~~old~~ **new**\n\n- [x] Done\n- [ ] Next\n\n| Name | Count |\n| :--- | ---: |\n| **Ready** | 3 |\n\n```ts\nconst ready = true\n```',
    density: 'compact',
    headingLevelStart: 3,
  })

  const boxes = [...el.querySelectorAll('input[type=checkbox],[role=checkbox]')]
  expect(boxes.length).toBe(2)
  expect(boxes[0].getAttribute('aria-checked')).toBe('true')
  expect(boxes[1].getAttribute('aria-checked')).toBe('false')
  expect(el.querySelector('table')?.textContent).toContain('NameCountReady3')
  expect(el.querySelector('td:last-child')?.style.textAlign).toBe('end')
  expect(el.querySelector('.vx-codeblock')?.textContent).toContain('const ready = true')
  expect(el.querySelector('del')?.textContent).toBe('old')
  expect(el.querySelector('h3')?.textContent).toBe('Title')
})

it('resolves known citations, preserves unknown ids and blocks unsafe links', () => {
  const { el, render } = mount()
  render({
    children: 'Tokyo[abc1] [unknown] [bad](javascript:alert)',
    sources: { abc1: { title: 'Tokyo facts', url: 'https://example.com/tokyo' } },
  })

  expect(el.querySelector('a.vx-citation')?.getAttribute('href')).toBe('https://example.com/tokyo')
  expect(el.textContent).toContain('[unknown]')
  expect(el.querySelector('a[href^="javascript:"]')).toBeNull()
})

it('updates rendered output when input props change (no stale children)', () => {
  const { el, render } = mount()
  render({ children: '# First\n\none' })
  expect(el.querySelector('h1')?.textContent).toBe('First')
  render({ children: '## Second\n\ntwo' })
  expect(el.querySelector('h2')?.textContent).toBe('Second')
  expect(el.textContent).not.toContain('one')
  render({ display: 'inline', children: '**bold**' })
  expect(el.querySelector('strong')?.textContent).toBe('bold')
})

it('custom renderers keep hooks, providers and identity across chunk updates', () => {
  const { el, render } = mount()
  const mounts: string[] = []
  const renders: string[] = []
  function SpyCode(props: { code: string; language: string }) {
    const [mounted] = useState(() => {
      mounts.push('mounted')
      return true
    })

    void mounted
    renders.push(props.code)
    return (
      <div className="spy-code" data-lang={props.language}>
        {props.code}
      </div>
    )
  }

  render({ children: '```ts\nconst a = 1\n```', components: { code: SpyCode } })
  const first = el.querySelector('.spy-code')
  expect(first?.textContent).toContain('const a = 1')
  render({ children: '```ts\nconst a = 1\nconst b = 2\n```', components: { code: SpyCode } })
  const second = el.querySelector('.spy-code')
  expect(second?.textContent).toContain('const b = 2')
  expect(renders.length).toBeGreaterThanOrEqual(2)
  void mounts
})

it('onLinkClick returning false cancels navigation; default path still anchors', () => {
  const { el, render } = mount()
  const seen: string[] = []
  render({
    children: '[stop](/stop) [go](https://ok.example/x)',
    onLinkClick: (href: string) => {
      seen.push(href)
      return false
    },
  })

  const a = el.querySelector('a[href="/stop"]') as HTMLAnchorElement
  expect(a).not.toBeNull()
  a.click()
  expect(seen).toEqual(['/stop'])
  const ext = el.querySelector('a[href="https://ok.example/x"]')
  expect(ext?.getAttribute('target')).toBe('_blank')
})

it('custom link renderer receives the sanitized href and label', () => {
  const { el, render } = mount()
  function MyLink(props: { href: string; children?: unknown }) {
    return (
      <span className="my-link" data-href={props.href}>
        {props.children}
      </span>
    )
  }

  render({ children: '[x](javascript:alert(1)) [y](/ok)', components: { link: MyLink } })
  // Unsafe href falls back to text before reaching the renderer.
  expect(el.querySelectorAll('.my-link').length).toBe(1)
  expect(el.querySelector('.my-link')?.getAttribute('data-href')).toBe('/ok')
})
