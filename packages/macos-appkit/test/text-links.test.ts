import { rendererSource } from './renderer-source.ts'
import assert from 'node:assert/strict'

import { stripTypeScriptTypes } from 'node:module'
import { test } from 'node:test'
import { runSlice, sourceWithoutImports } from './mock-globals.ts'
import { textRuns } from '../src/formatted-text.ts'

const node = (type: string, props: any = {}, children: any[] = []) => ({
  type,
  props,
  children,
  text: '',
})

test('link handlers fold through nested spans; an inner handler wins', () => {
  const outer = () => 'outer'
  const inner = () => 'inner'
  const tree = node('formattedstring', {}, [
    node('span', { text: 'a', onLinkTap: outer }, [
      node('span', { text: 'b' }),
      node('span', { text: 'c', onPress: inner }),
      { ...node('#text'), text: 'd' },
    ]),
    node('span', { text: 'e' }),
  ])

  const runs = textRuns(tree)
  assert.equal(runs.map((run) => run.text).join(''), 'abcde')
  assert.deepEqual(
    runs.map((run) => run.link),
    [outer, outer, inner, outer, null],
  )
})

test('dropped span handlers clear the inherited link; re-added handlers reappear', () => {
  const tap = () => {}
  const span = node('span', { text: 'a', onLinkTap: tap }, [node('span', { text: 'b' })])
  const tree = node('formattedstring', {}, [span])
  assert.deepEqual(
    textRuns(tree).map((run) => run.link),
    [tap, tap],
  )

  span.props = { text: 'a' }
  assert.deepEqual(
    textRuns(tree).map((run) => run.link),
    [null, null],
  )

  span.children[0].props = { text: 'b', onLinkTap: tap }
  assert.deepEqual(
    textRuns(tree).map((run) => run.link),
    [null, tap],
  )
})

const composed = sourceWithoutImports(
  new URL('../src/formatted-text.ts', import.meta.url),
).replaceAll('export ', '')

const composeContext = {
  NSFontAttributeName: 'font',
  NSParagraphStyleAttributeName: 'paragraph',
  NSLineBreakMode: { WordWrapping: 0 },
  NSMutableParagraphStyle: { alloc: () => ({ init: () => ({}) }) },
  NSMutableAttributedString: {
    alloc: () => ({
      initWithString: () => ({
        runs: [],
        appendAttributedString(run: any) {
          this.runs.push(run)
        },
      }),
    }),
  },
  NSAttributedString: {
    alloc: () => ({
      initWithStringAttributes: (text: string, attributes: any) => ({ text, attributes }),
    }),
  },
}

test('composed runs carry per-range link entries and NSLink tokens in order', () => {
  const api = runSlice(composed + '\n({composeAttributedText})', composeContext)
  const first = () => {}
  const second = () => {}
  const links: any[] = []
  const runs = api.composeAttributedText(
    [
      node('span', { text: 'ab' }),
      node('span', { text: 'cd', onLinkTap: first }),
      node('span', { text: 'ef', onLinkTap: second }),
      node('span', { text: 'g' }),
    ],
    {},
    {},
    () => ({}),
    () => ({}),
    { fontSize: 16, fontWeight: 400 },
    links,
  ).runs

  assert.equal(runs.map((run: any) => run.text).join(''), 'abcdefg')
  assert.deepEqual(
    links.map(({ location, length, handler }) => ({ location, length, handler })),
    [
      { location: 2, length: 2, handler: first },
      { location: 4, length: 2, handler: second },
    ],
  )
  assert.equal(runs[1].attributes.NSLink, 'octane-span://0')
  assert.equal(runs[2].attributes.NSLink, 'octane-span://1')
  assert.equal(runs[0].attributes.NSLink, undefined)
  assert.equal(runs[3].attributes.NSLink, undefined)
})

const source = stripTypeScriptTypes(rendererSource())

const fn = (name: string) => {
  const start = source.indexOf(`function ${name}(`)
  return source.slice(start, source.indexOf('\nfunction ', start + 1))
}

test('rich labels keep the folded link table; plain text drops it', () => {
  const calls: any[] = []
  const slice = runSlice(fn('syncText') + '\nsyncText', {
    composeAttributedText: (
      children: any[],
      _v: any,
      _p: any,
      _f: any,
      _c: any,
      _d: any,
      links: any[],
    ) => {
      children
        .flatMap((child) => textRuns(child))
        .reduce((offset, run) => {
          if (run.link) {
            links.push({ location: offset, length: run.text.length, handler: run.link })
          }
          return offset + run.text.length
        }, 0)
      return 'A'
    },
    syncTextLinks: (n: any) => calls.push(n.textLinks?.length ?? 0),
    setLabelText: (n: any, text: string) => {
      n.view.stringValue = text
    },
    fontForFamilyStyle() {},
    nativeColor() {},
    queueLayoutReconcile() {},
  })

  const tap = () => {}
  const parent: any = {
    type: 'label',
    children: [node('span', { text: 'ab' }), node('span', { text: 'cd', onLinkTap: tap })],
    props: {},
    view: { font: { pointSize: 16 }, invalidateIntrinsicContentSize() {} },
    container: {},
    parent: null,
  }
  slice(parent)
  assert.equal(parent.textLinks.length, 1)
  assert.equal(parent.textLinks[0].location, 2)
  assert.equal(parent.textLinks[0].length, 2)
  assert.equal(parent.textLinks[0].handler, tap)
  assert.deepEqual(calls, [1])

  parent.children = []
  slice(parent)
  assert.equal(parent.textLinks, undefined)
  assert.deepEqual(calls, [1, 0])
})

test('linkPressed dispatches only the handler owning the tapped character', () => {
  const nodes = new WeakMap()
  const { ButtonActionTarget } = runSlice(
    source.slice(
      source.indexOf('class ButtonActionTarget'),
      source.indexOf('const buttonActionTarget'),
    ) + '\n({ButtonActionTarget})',
    {
      NSObject: class {},
      NSButton: class {},
      NSPanGestureRecognizer: class {},
      NSNotification: class {},
      NSTextViewDelegate: class {},
      NSTextFieldDelegate: class {},
      interop: { types: { void: 'void' } },
      NativeClass() {},
      registerGestureClass() {},
      cssNodesByView: nodes,
      textLinkCharacterIndex: () => tapped.index,
    },
  )

  const calls: string[] = []
  const tapped: { index: number | null } = { index: null }
  const control: any = {
    type: 'label',
    props: {},
    container: { root: { eventScope: (_kind: string, run: () => void) => run() } },
    textLinks: [
      { location: 0, length: 4, handler: () => calls.push('first') },
      { location: 9, length: 3, handler: () => calls.push('second') },
    ],
  }
  const view = {}
  nodes.set(view, control)
  const sender = { view, locationInView: () => ({ x: 0, y: 0 }) }
  const target = new ButtonActionTarget()

  tapped.index = 2
  target.linkPressed(sender)
  tapped.index = 10
  target.linkPressed(sender)
  tapped.index = 5 // plain text between the two link runs
  target.linkPressed(sender)
  tapped.index = null // outside every glyph
  target.linkPressed(sender)
  assert.deepEqual(calls, ['first', 'second'])

  control.props.disabled = true
  tapped.index = 1
  target.linkPressed(sender)
  control.props.disabled = false
  control.textLinks = undefined
  target.linkPressed(sender)
  assert.deepEqual(calls, ['first', 'second'])
})

test('syncTextLinks attaches one gated recognizer and follows link/disabled state', () => {
  const recognizers: any[] = []
  const slice = runSlice(
    fn('primaryClickBoundary') +
      '\n' +
      fn('axLinkActionSlot') +
      '\n' +
      fn('syncTextLinks') +
      '\n({syncTextLinks})',
    {
      axLinkActionPool: new Map(),
      configureGesture: (recognizer: any) => recognizer,
      NSClickGestureRecognizer: {
        alloc: () => ({
          initWithTargetAction: () => {
            const recognizer = { addedTo: [] as any[], enabled: true }
            recognizers.push(recognizer)
            return recognizer
          },
        }),
      },
      buttonActionTarget: {},
      shouldReceivePrimaryClick: () => true,
      cssNodesByView: new WeakMap(),
      isPrimaryClickBoundary: () => false,
      actionHandlers: new Map(),
      NSAccessibilityCustomAction: {
        alloc: () => ({
          initWithNameHandler: (name: string, handler: () => boolean) => ({ name, handler }),
        }),
      },
    },
  )

  const view: any = {
    attributedStringValue: { string: 'ab cd' },
    addGestureRecognizer(recognizer: any) {
      recognizer.addedTo.push(this)
    },
  }
  const control: any = { type: 'label', view, props: {} }

  slice.syncTextLinks(control)
  assert.equal(recognizers.length, 0, 'no link table — nothing attaches')

  control.textLinks = [{ location: 0, length: 2, handler() {} }]
  slice.syncTextLinks(control)
  assert.equal(recognizers.length, 1)
  assert.deepEqual(recognizers[0].addedTo, [view])
  assert.equal(recognizers[0].enabled, true)
  // The same run becomes a named AX action — the label cannot vend AXLink
  // children, so assistive tech activates through the action rotor.
  assert.equal(view.accessibilityCustomActions.length, 1)
  assert.equal(view.accessibilityCustomActions[0].name, 'Open link ab')

  const firstAction = view.accessibilityCustomActions[0]
  slice.syncTextLinks(control)
  assert.equal(recognizers.length, 1, 'the recognizer is reused across re-syncs')
  // Pooled: the same name resolves to the same action object. Fresh objects
  // per fold would let JS-backed blocks die inside a GC finalizer, where the
  // bridge cannot delete their references — a fatal release path.
  assert.equal(view.accessibilityCustomActions[0], firstAction)

  control.props.disabled = true
  slice.syncTextLinks(control)
  assert.equal(recognizers[0].enabled, false)
  assert.equal(view.accessibilityCustomActions.length, 0)

  control.props.disabled = false
  control.textLinks = undefined
  slice.syncTextLinks(control)
  assert.equal(recognizers[0].enabled, false)
})
