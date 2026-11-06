import { Button } from '@astryxdesign/core/Button'
import { TextInput } from '@astryxdesign/core/TextInput'
import { TextArea } from '@astryxdesign/core/TextArea'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { CheckboxList, CheckboxListItem } from '@astryxdesign/core/CheckboxList'
import { Switch } from '@astryxdesign/core/Switch'
import { use, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { Markdown } from '@astryxdesign/core/Markdown'
import {
  createMarkdownFrontmatter,
  createMarkdownFenceTransform,
  createMarkdownHeadingLinks,
  createMarkdownPlugin,
  markdownSoftBreaksPlugin,
  markdownSourceLinesPlugin,
  type MarkdownExtensionNode,
  type MarkdownSyntaxPluginDefinition,
} from '@astryxdesign/core/Markdown/plugins'

import {
  buttonScenarios,
  textInputScenarios,
  checkboxScenarios,
  switchScenarios,
  textAreaScenarios,
  checkboxListScenarios,
  markdownScenarios,
  mentionsContribution,
  mentionsToText,
  BOUNDARY_FIXTURE_SOURCE,
  CITATION_SOURCES,
  CITATION_SOURCES_LOCAL,
  STREAM_FIXTURE_CHUNKS,
} from '../scenarios/index.ts'

import '@astryxdesign/core/reset.css'
import '@astryxdesign/core/astryx.css'
import '../shared/stage.css'

declare global {
  interface Window {
    __parity: { events: string[]; resolve(): void }
  }
}

window.__parity = {
  events: [],
  resolve() {
    resolvePending?.()
  },
}

let resolvePending: (() => void) | undefined

function Grid() {
  return (
    <div className="parity-grid">
      {buttonScenarios.map((scenario) => (
        <div
          key={scenario.key}
          className="parity-cell"
          data-sameframe-key={`button/${scenario.key}`}
          style={scenario.cellWidth ? { width: scenario.cellWidth } : undefined}
        >
          <Button {...scenario.props} data-testid={`button/${scenario.key}/control`} />
        </div>
      ))}
    </div>
  )
}

function Behavior() {
  return (
    <>
      <button data-parity-key="before">Before</button>
      <span data-parity-key="sync">
        <Button
          label="Sync"
          variant="secondary"
          size="md"
          clickAction={() => {
            window.__parity.events.push('sync')
          }}
        />
      </span>
      <span data-parity-key="disabled">
        <Button
          label="Disabled"
          variant="secondary"
          size="md"
          isDisabled
          clickAction={() => {
            window.__parity.events.push('disabled')
          }}
        />
      </span>
      <span data-parity-key="async">
        <Button
          label="Async"
          variant="secondary"
          size="md"
          clickAction={() => {
            window.__parity.events.push('async:start')
            return new Promise<void>((resolve) => {
              resolvePending = () => {
                resolve()
                window.__parity.events.push('async:end')
              }
            })
          }}
        />
      </span>
      <button data-parity-key="after">After</button>
    </>
  )
}

function FieldGrid({
  prefix,
  scenarios,
  render,
}: {
  prefix: string
  scenarios: { key: string; cellWidth?: number }[]
  render: (s: any) => React.ReactNode
}) {
  return (
    <div className="parity-grid">
      {scenarios.map((scenario) => (
        <div
          key={scenario.key}
          className="parity-cell parity-cell-field"
          data-sameframe-key={`${prefix}/${scenario.key}`}
          style={scenario.cellWidth ? { width: scenario.cellWidth } : undefined}
        >
          {render(scenario)}
        </div>
      ))}
    </div>
  )
}

function TextInputGrid() {
  return (
    <FieldGrid
      prefix="text-input"
      scenarios={textInputScenarios}
      render={(s) => (
        <TextInput {...s.props} onChange={() => {}} data-testid={`text-input/${s.key}/control`} />
      )}
    />
  )
}

function TextAreaGrid() {
  return (
    <FieldGrid
      prefix="text-area"
      scenarios={textAreaScenarios}
      render={(s) => (
        <TextArea {...s.props} onChange={() => {}} data-testid={`text-area/${s.key}/control`} />
      )}
    />
  )
}

function CheckboxGrid() {
  return (
    <FieldGrid
      prefix="checkbox"
      scenarios={checkboxScenarios}
      render={(s) => (
        <CheckboxInput {...s.props} onChange={() => {}} data-testid={`checkbox/${s.key}/control`} />
      )}
    />
  )
}

function SwitchGrid() {
  return (
    <FieldGrid
      prefix="switch"
      scenarios={switchScenarios}
      render={(s) => (
        <Switch {...s.props} onChange={() => {}} data-testid={`switch/${s.key}/control`} />
      )}
    />
  )
}

function CheckboxListGrid() {
  return (
    <FieldGrid
      prefix="checkbox-list"
      scenarios={checkboxListScenarios}
      render={(s) => (
        <CheckboxList {...s.props} onChange={() => {}}>
          {s.options.map((o: { value: string; label: string; isDisabled?: boolean }) => (
            <CheckboxListItem
              key={o.value}
              value={o.value}
              label={o.label}
              isDisabled={o.isDisabled}
            />
          ))}
        </CheckboxList>
      )}
    />
  )
}

// Per-route behavior fixtures: a controlled, observable control per component.
function TextInputBehavior() {
  const [value, setValue] = useState('')
  return (
    <>
      <button data-parity-key="before">Before</button>
      <span data-parity-key="input">
        <TextInput
          label="Email"
          value={value}
          onChange={(v) => {
            setValue(v)
            window.__parity.events.push(`change:${v}`)
          }}
        />
      </span>
      <span data-parity-key="disabled-input">
        <TextInput label="Email" isDisabled value="" onChange={() => {}} />
      </span>
      <button data-parity-key="after">After</button>
    </>
  )
}

function CheckboxBehavior() {
  const [checked, setChecked] = useState(false)
  const [mixed, setMixed] = useState<'indeterminate' | boolean>('indeterminate')
  return (
    <>
      <button data-parity-key="before">Before</button>
      <span data-parity-key="box">
        <CheckboxInput
          label="Accept terms"
          value={checked}
          onChange={(v) => {
            setChecked(v)
            window.__parity.events.push(`check:${v}`)
          }}
        />
      </span>
      <span data-parity-key="indeterminate-box">
        <CheckboxInput
          label="Partial"
          value={mixed}
          onChange={(v) => {
            setMixed(v)
            window.__parity.events.push(`check:${v}`)
          }}
        />
      </span>
      <span data-parity-key="disabled-box">
        <CheckboxInput label="Locked" value={false} isDisabled onChange={() => {}} />
      </span>
      <button data-parity-key="after">After</button>
    </>
  )
}

function SwitchBehavior() {
  const [on, setOn] = useState(false)
  return (
    <>
      <button data-parity-key="before">Before</button>
      <span data-parity-key="switch">
        <Switch
          label="Notifications"
          value={on}
          onChange={(v) => {
            setOn(v)
            window.__parity.events.push(`switch:${v}`)
          }}
        />
      </span>
      <span data-parity-key="disabled-switch">
        <Switch label="Locked" value={true} isDisabled onChange={() => {}} />
      </span>
      <button data-parity-key="after">After</button>
    </>
  )
}

const mentionsDef: MarkdownSyntaxPluginDefinition<'mentions', MarkdownExtensionNode<'mentions'>> = {
  name: 'mentions',
  apiVersion: 1,
  parseKey: 'mentions@1',
  syntax: { inline: [{ ...mentionsContribution }] },
  renderers: {
    mention: {
      render: (p: any) => <mark>{`@${p.node.data.handle}`}</mark>,
      toText: mentionsToText,
    },
  },
}

const frontmatter = createMarkdownFrontmatter({ name: 'meta', parse: (fields) => fields })
const markdownPlugins = (profiles?: readonly string[]) =>
  profiles?.map((p) => {
    switch (p) {
      case 'soft-breaks':
        return markdownSoftBreaksPlugin
      case 'frontmatter':
        return frontmatter.plugin
      case 'source-lines':
        return markdownSourceLinesPlugin
      case 'heading-links':
        return createMarkdownHeadingLinks({ permalinkBaseUrl: 'https://docs.example' })
      case 'mentions':
        return createMarkdownPlugin(mentionsDef)
      default:
        throw new RangeError(`unknown plugin profile ${p}`)
    }
  })

const inlinePlugins = [
  {
    pattern: /@(\w+)/g,
    render: (match: RegExpMatchArray, key: string) => <mark key={key}>{match[0]}</mark>,
  },
]

function MarkdownGrid() {
  return (
    <div className="parity-grid">
      {markdownScenarios.map((s) => (
        <div key={s.key} className="parity-cell" data-sameframe-key={`markdown/${s.key}`}>
          <Markdown
            autolink={s.options?.autolink}
            sources={s.options?.sourceIds ? CITATION_SOURCES : undefined}
            plugins={markdownPlugins(s.options?.plugins)}
            inlinePlugins={s.options?.inlinePlugin ? inlinePlugins : undefined}
          >
            {s.source}
          </Markdown>
        </div>
      ))}
    </div>
  )
}

// --- Boundary fixture: plugin renderers that throw / decline ---
const boomNode =
  <P extends string>(plugin: P) =>
  (ctx: { code: string }) => ({
    type: 'extension' as const,
    plugin,
    name: 'boom',
    display: 'block' as const,
    data: { code: ctx.code },
  })

const boundaryPlugins = {
  error: createMarkdownPlugin({
    name: 'x-error',
    apiVersion: 1,
    transform: createMarkdownFenceTransform({
      languages: ['boom'],
      createNode: boomNode('x-error'),
    }),
    renderers: {
      boom: {
        render: () => {
          throw new Error('renderer boom')
        },
        toText: () => 'error',
      },
    },
  }),
  decline: createMarkdownPlugin({
    name: 'x-decline',
    apiVersion: 1,
    transform: createMarkdownFenceTransform({
      languages: ['boom'],
      createNode: boomNode('x-decline'),
    }),
    renderers: { boom: { render: () => null, toText: () => 'decline' } },
  }),
  pending: createMarkdownPlugin({
    name: 'x-pending',
    apiVersion: 1,
    transform: createMarkdownFenceTransform({
      languages: ['boom'],
      createNode: boomNode('x-pending'),
    }),
    renderers: { boom: { render: () => <PendingNode />, toText: () => 'pending' } },
  }),
}

// A renderer that suspends forever — the pending boundary holds the
// readable fallback until the promise resolves (never, in this fixture).
const pendingPromise = new Promise<unknown>(() => {})
function PendingNode() {
  use(pendingPromise)
  return null
}

// Interactive stream fixtures — identical controls both sides.
function StreamPump({ id }: { id: string }) {
  const [idx, setIdx] = useState(0)
  const [mounted, setMounted] = useState(true)
  const text = STREAM_FIXTURE_CHUNKS.slice(0, idx).join('')
  return (
    <span data-parity-key={id}>
      <button
        data-parity-action={`${id}/next`}
        onClick={() => {
          setIdx((i) => Math.min(i + 1, STREAM_FIXTURE_CHUNKS.length))
          window.__parity.events.push(`${id}:next`)
        }}
      >
        next
      </button>
      <button
        data-parity-action={`${id}/reset`}
        onClick={() => {
          setIdx(0)
          window.__parity.events.push(`${id}:reset`)
        }}
      >
        reset
      </button>
      <button
        data-parity-action={`${id}/mount`}
        onClick={() => {
          setMounted((m) => !m)
          window.__parity.events.push(`${id}:mount`)
        }}
      >
        mount
      </button>
      {mounted ? <Markdown isStreaming>{text}</Markdown> : <i>gone</i>}
    </span>
  )
}

function SourceSwap() {
  const [alt, setAlt] = useState(false)
  return (
    <span data-parity-key="source-swap">
      <button
        data-parity-action="source-swap"
        onClick={() => {
          setAlt((a) => !a)
          window.__parity.events.push('swap')
        }}
      >
        swap
      </button>
      <Markdown>{alt ? '## Second doc\n\nbeta text' : '# First doc\n\nalpha text'}</Markdown>
    </span>
  )
}

function SourceIdChange() {
  const [withApi, setWithApi] = useState(false)
  return (
    <span data-parity-key="source-id-change">
      <button
        data-parity-action="source-id-change"
        onClick={() => {
          setWithApi((v) => !v)
          window.__parity.events.push('sourceIdChange')
        }}
      >
        sources
      </button>
      <Markdown sources={withApi ? CITATION_SOURCES_LOCAL : { docs: CITATION_SOURCES_LOCAL.docs }}>
        {'Claim [docs] and 【api】.'}
      </Markdown>
    </span>
  )
}

function MarkdownBehavior() {
  const doc = '[internal](/docs/page) and [external](https://example.com)'
  return (
    <>
      <span data-parity-key="links">
        <Markdown>{doc}</Markdown>
      </span>
      <span data-parity-key="unsafe-link">
        <Markdown>{'[bad](javascript:alert(1)) ![i](data:text/html,x)'}</Markdown>
      </span>
      <span data-parity-key="citation">
        <Markdown sources={CITATION_SOURCES}>{'Claim [docs] and 【api】.'}</Markdown>
      </span>
      <span data-parity-key="heading-id">
        <Markdown>{'# Alpha\n\n# Alpha'}</Markdown>
      </span>
      <span data-parity-key="inline-display">
        Text <Markdown display="inline">{'**bold** [x](/y)'}</Markdown> tail
      </span>
      <span data-parity-key="task-list">
        <Markdown>{'- [x] done\n- [ ] todo'}</Markdown>
      </span>
      <span data-parity-key="link-cancel">
        <Markdown
          onLinkClick={(href) => {
            window.__parity.events.push(`cancel:${href}`)
            return false
          }}
        >
          {'[cancel](/stop)'}
        </Markdown>
      </span>
      <span data-parity-key="link-allow">
        <Markdown
          onLinkClick={(href) => {
            window.__parity.events.push(`allow:${href}`)
          }}
        >
          {'[allow](#go)'}
        </Markdown>
      </span>
      <span data-parity-key="citation-activate">
        <Markdown sources={CITATION_SOURCES_LOCAL}>{'Cite [docs] here.'}</Markdown>
      </span>
      <span data-parity-key="heading-shift">
        <Markdown headingLevelStart={3}>{'# A\n\n## B'}</Markdown>
      </span>
      <span data-parity-key="empty-repeated-headings">
        <Markdown>{'# \n\n## Dup\n\n## Dup\n\n#'}</Markdown>
      </span>
      <span data-parity-key="image-ok">
        <Markdown>{'![ok alt](/tiny.svg)'}</Markdown>
      </span>
      <span data-parity-key="image-fail">
        <Markdown>{'![fail alt](/missing.png)'}</Markdown>
      </span>
      <span data-parity-key="custom-renderers">
        <Markdown
          components={{
            paragraph: (p: any) => <p data-custom="paragraph">{p.children}</p>,
            code: (p: any) => <pre data-custom="code">{p.code}</pre>,
            link: (p: any) => (
              <a data-custom="link" href={p.href}>
                {p.children}
              </a>
            ),
          }}
        >
          {'Para [l](/x).\n\n```js\nx=1\n```'}
        </Markdown>
      </span>
      <span data-parity-key="plugin-error">
        <Markdown plugins={[boundaryPlugins.error]}>{BOUNDARY_FIXTURE_SOURCE}</Markdown>
      </span>
      <span data-parity-key="plugin-decline">
        <Markdown plugins={[boundaryPlugins.decline]}>{BOUNDARY_FIXTURE_SOURCE}</Markdown>
      </span>
      <span data-parity-key="plugin-pending">
        <Markdown plugins={[boundaryPlugins.pending]}>{BOUNDARY_FIXTURE_SOURCE}</Markdown>
      </span>
      <SourceSwap />
      <SourceIdChange />
      <StreamPump id="stream-pump" />
      <span data-parity-key="stream-multi">
        <StreamPump id="stream-a" />
        <StreamPump id="stream-b" />
      </span>
    </>
  )
}

function MarkdownLayout() {
  const cells: readonly {
    key: string
    width: number
    density?: 'compact'
    contentAlign?: 'center'
  }[] = [
    { key: 'prose-basic', width: 480 },
    { key: 'table-layout', width: 480 },
    { key: 'content-width', width: 480 },
    { key: 'density-compact', width: 480, density: 'compact' },
    { key: 'content-width', width: 320 },
    { key: 'content-width', width: 1200, contentAlign: 'center' },
    { key: 'unbroken-tokens', width: 480 },
    { key: 'large-table', width: 480 },
  ]
  return (
    <>
      {cells.map((cell, i) => {
        const s = markdownScenarios.find((x) => x.key === cell.key)!
        return (
          <div
            key={`${cell.key}-${i}`}
            data-parity-key={`${cell.key}@${cell.width}${cell.contentAlign ? ':center' : ''}`}
            style={{ width: cell.width, marginBottom: 24 }}
          >
            <Markdown density={cell.density ?? 'default'} contentAlign={cell.contentAlign}>
              {s.source}
            </Markdown>
          </div>
        )
      })}
    </>
  )
}

const pages: Record<string, { title: string; el: React.ReactNode }> = {
  '/markdown': { title: 'Markdown parity', el: <MarkdownGrid /> },
  '/markdown/behavior': { title: 'Markdown parity', el: <MarkdownBehavior /> },
  '/markdown/layout': { title: 'Markdown parity', el: <MarkdownLayout /> },
  '/button': { title: 'Button parity', el: <Grid /> },
  '/button/behavior': { title: 'Button parity', el: <Behavior /> },
  '/text-input': { title: 'TextInput parity', el: <TextInputGrid /> },
  '/text-area': { title: 'TextArea parity', el: <TextAreaGrid /> },
  '/text-input/behavior': { title: 'TextInput parity', el: <TextInputBehavior /> },
  '/checkbox': { title: 'Checkbox parity', el: <CheckboxGrid /> },
  '/checkbox/behavior': { title: 'Checkbox parity', el: <CheckboxBehavior /> },
  '/switch': { title: 'Switch parity', el: <SwitchGrid /> },
  '/switch/behavior': { title: 'Switch parity', el: <SwitchBehavior /> },
  '/checkbox-list': { title: 'CheckboxList parity', el: <CheckboxListGrid /> },
}

const page = (pages[window.location.pathname] ?? pages['/button']).el
document.title = pages[window.location.pathname]?.title ?? 'Button parity'

createRoot(document.getElementById('root')!).render(page)
document.fonts.ready.then(() => {
  document.documentElement.dataset.parityReady = '1'
})
