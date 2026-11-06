/** @jsxImportSource @octane-xplat/jsx */
// Synthetic object-driver regression for the native rich-run fold
// (milestone-6): nested Markdown marks emit flat spans carrying merged
// styles, and `display="inline"` contributes bare runs that fold into the
// enclosing label alongside sibling text. The real FormattedString/Span
// wiring is device-qualified in apps/mobile's markdown spec; this pins the
// emitted structure and run props only. The composition below matches what
// `Inlines` emits for `**bold _em_**`, `[plain **bold**](url)`, and
// surrounding text.
import { describe, expect, it, vi } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
  flushUniversalSync,
} from 'octane/universal/native'

vi.mock('@nativescript/core', () => ({
  Property: class {
    constructor(_opts?: any) {}
    register() {}
  },
  CSSType: () => () => {},
  registerElement: () => {},
  View: class {},
  Device: {
    os: 'iOS',
    osVersion: '26.0',
    model: 'iPhone',
    manufacturer: 'Apple',
    language: 'en-US',
    region: 'US',
  },
  isIOS: true,
  isAndroid: false,
  Application: { ios: true, android: false, on() {}, off() {} },
  Utils: { openUrl: () => true },
}))

vi.mock('../../internal/platform/apply-native-modifiers.native', () => ({
  applyNativeModifiers: () => {},
}))

import {
  MdDelete,
  MdEmphasis,
  MdInlineRoot,
  MdLinkRun,
  MdParagraph,
  MdStrong,
  MdTextRun,
} from './markdown-inline.tsrx'

import { Text } from '../components/content/Text.tsrx'
import { View } from '../components/layout/View.tsrx'

function all(node: any): any[] {
  return [node, ...(node.children ?? []).flatMap(all)]
}

const spansOf = (node: any): any[] => all(node).filter((n) => n.type === 'span')
const textsOf = (node: any): string[] =>
  all(node).flatMap((n) => {
    const text = n.props?.text ?? n.props?.value ?? n.text
    return typeof text === 'string' && text ? [text] : []
  })

function render(supply: () => unknown) {
  const container = createObjectContainer('nativescript')
  const root = createUniversalRoot(container, createObjectDriver('nativescript'))
  root.render(supply, {})
  flushUniversalSync(() => {})
  return container
}

function NestedMarksSurface(): unknown @{
  return (
    <MdParagraph>
      <MdStrong>
        <MdTextRun text="bold " />
        <MdEmphasis>
          <MdTextRun text="em" />
        </MdEmphasis>
        <MdTextRun text=" end" />
      </MdStrong>
    </MdParagraph>
  )
}

function LinkMarksSurface(): unknown @{
  return (
    <MdParagraph>
      <MdLinkRun href="https://example.com" onLinkClick={() => false}>
        <MdTextRun text="plain " />
        <MdStrong>
          <MdTextRun text="bold" />
        </MdStrong>
        <MdTextRun text=" end" />
      </MdLinkRun>
    </MdParagraph>
  )
}

function DeleteInLinkSurface(): unknown @{
  return (
    <MdParagraph>
      <MdLinkRun href="https://example.com">
        <MdDelete>
          <MdTextRun text="strike" />
        </MdDelete>
      </MdLinkRun>
    </MdParagraph>
  )
}

function InlineSiblingSurface(): unknown @{
  return (
    <View>
      <Text>
        {'before '}
        <MdInlineRoot>
          <MdStrong>
            <MdTextRun text="bold run" />
          </MdStrong>
          <MdTextRun text=" and " />
          <MdTextRun text="code" style={{ fontFamily: 'monospace' }} />
        </MdInlineRoot>
        {' after'}
      </Text>
    </View>
  )
}

describe('native rich-run fold (object driver)', () => {
  it('nested marks emit flat spans with merged styles', () => {
    const container = render(NestedMarksSurface)

    const spans = spansOf(container)
    expect(spans.map((s) => s.props?.text ?? s.text)).toEqual(['bold ', 'em', ' end'])
    expect(spans[0].props.style).toMatchObject({ fontWeight: '600' })
    expect(spans[0].props.style.fontStyle).toBeUndefined()
    expect(spans[1].props.style).toMatchObject({ fontWeight: '600', fontStyle: 'italic' })
    expect(spans[2].props.style).toMatchObject({ fontWeight: '600' })
  })

  it('link runs inherit tap and style into nested marks', () => {
    const container = render(LinkMarksSurface)

    const spans = spansOf(container)
    expect(spans.map((s) => s.props?.text ?? s.text)).toEqual(['plain ', 'bold', ' end'])
    // Every run inside the link carries the tap (linkTap event commands in
    // the commit) and the merged link styling.
    const linkTapIds = new Set(
      container.commits
        .flatMap((c: any) => c.commands)
        .filter((c: any) => c.op === 'event' && c.type === 'linktap')
        .map((c: any) => c.id),
    )

    for (const span of spans) {
      expect(linkTapIds.has(span.id)).toBe(true)
      expect(span.props.style).toMatchObject({ textDecoration: 'underline' })
    }

    expect(spans[1].props.style).toMatchObject({ fontWeight: '600' })
  })

  it('a delete inside a link unions underline and line-through', () => {
    const container = render(DeleteInLinkSurface)

    const strike = spansOf(container).find((s) => (s.props?.text ?? s.text) === 'strike')
    expect(strike).toBeTruthy()
    expect(String(strike.props.style.textDecoration)).toContain('line-through')
    expect(String(strike.props.style.textDecoration)).toContain('underline')
  })

  it('display="inline" contributes bare runs that join the enclosing label', () => {
    const container = render(InlineSiblingSurface)

    const label = all(container).find((n) => n.type === 'label')
    expect(label).toBeTruthy()
    // The label's children keep sibling #text nodes interleaved with the
    // inline markdown's flat spans — the structure the patched driver folds
    // into one FormattedString in order.
    const types = label.children.map((c: any) => c.type)
    expect(types).toEqual(['#text', 'span', 'span', 'span', '#text'])
    expect(textsOf(label).join(' ')).toContain('before')
    expect(textsOf(label).join(' ')).toContain('after')
    expect(textsOf(label).join(' ')).toContain('bold run')
  })
})
