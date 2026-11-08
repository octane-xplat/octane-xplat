/** @jsxImportSource @octane-xplat/jsx */
// Milestone-1 contract tests (object driver): pins the render/boundary
// semantics the Markdown renderer + plugin protocol rely on —
// RichText's portable inline-run shape, custom renderers' hook/context/
// update behavior, and @try/@pending/@catch fallback semantics for thrown,
// declined, pending and unmounted renderers. Device-qualified separately
// via the md-seams probes.
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

import { createContext, use, useContext, useEffect, useMemo } from 'octane'
import { signal$ } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { RichText, RichTextSpan } from '../components/content/RichText.tsrx'
import { Text } from '../components/content/Text.tsrx'
import { View } from '../components/layout/View.tsrx'

function all(node: any): any[] {
  return [node, ...(node.children ?? []).flatMap(all)]
}

const textsOf = (node: any): string[] =>
  all(node).flatMap((n) => (typeof n.text === 'string' && n.text ? [n.text] : []))

const Ctx: any = createContext('unprovided')

const stats = { mounts: 0, unmounts: 0, renders: 0 }
const prop$ = signal$('first')
const throwNow$ = signal$(true)
const showSuspender$ = signal$(true)

let pendResolve: ((v: string) => void) | null = null
const pendPromise = new Promise<string>((r) => (pendResolve = r))
let pend2Resolve: ((v: string) => void) | null = null
const pend2Promise = new Promise<string>((r) => (pend2Resolve = r))

function SlotRenderer(props: { text: string }): unknown @{
  const seen = useContext(Ctx)
  const local$ = useSignal$(0)

  stats.renders++
  useEffect(() => {
    stats.mounts++
    return () => {
      stats.unmounts++
    }
  }, [])

  const derived = useMemo(() => props.text.toUpperCase(), [props.text])

  return (
    <View>
      <label id="slot-ctx" text={`ctx:${String(seen)}`} />
      <label id="slot-derived" text={`memo:${derived}`} />
      <label id="slot-local" text={`local:${local$.get()}`} />
    </View>
  )
}

function ThrowingRenderer(): unknown @{
  if (throwNow$.get()) {
    throw new Error('renderer exploded')
  }

  return <label id="threw-ok" text="recovered" />
}

function PendingRenderer(): unknown @{
  const v = use(pendPromise)

  return <label id="pend-ok" text={`resolved:${v}`} />
}

function SecondSuspender(): unknown @{
  const v = use(pend2Promise)

  return <label id="pend2-ok" text={`late:${v}`} />
}

function DecliningRenderer(): unknown @{
  return null
}

function ContractSurface(): unknown @{
  return (
    <View>
      <Ctx value="provided">
        <SlotRenderer text={prop$.get()} />
      </Ctx>
      @try {
        <ThrowingRenderer />
      } @catch (error, reset) {
        <View>
          <label
            id="fb-throw"
            text={`caught:${String((error as any)?.message ?? error)}`}
          />
          <button
            id="fb-reset"
            text="reset"
            onTap={() => {
              throwNow$.set(false)
              reset()
            }}
          />
        </View>
      }
      @try {
        <PendingRenderer />
      } @pending {
        <label id="fb-pend" text="pending-fallback" />
      } @catch (error) {
        <label id="fb-pend-err" text={`pend-err:${String(error)}`} />
      }
      @if (showSuspender$.get()) {
        @try {
          <SecondSuspender />
        } @pending {
          <label id="fb-pend2" text="second-pending" />
        } @catch (error) {
          <label id="fb-pend2-err" text={`pend2-err:${String(error)}`} />
        }
      }
      <DecliningRenderer />
      <label id="tail" text="tail" />
    </View>
  )
}

function RichSurface(): unknown @{
  return (
    <View>
      <Text id="nested">
        {'before '}
        <Text style={{ fontWeight: 'bold' }}>{'bold'}</Text>
        {' after'}
      </Text>
      <RichText id="rich">
        <RichTextSpan text="a " />
        <RichTextSpan text="b" style={{ fontWeight: 'bold' }} />
        <RichTextSpan text=" tap" onPress={() => {}} />
      </RichText>
    </View>
  )
}

const byId = (container: any, id: string) => all(container).find((n) => n.props?.id === id)

describe('markdown renderer contracts (universal object driver)', () => {
  it('RichText emits a formattedstring of styled/tappable flat runs', () => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))

    root.render(RichSurface, {})

    const rich = byId(container, 'rich')

    expect(rich?.type).toBe('label')

    const fs = rich.children.find((c: any) => c.type === 'formattedstring')

    expect(fs).toBeTruthy()

    const spans = fs.children.filter((c: any) => c.type === 'span')

    expect(spans.map((s: any) => s.props?.text ?? s.text)).toEqual(['a ', 'b', ' tap'])
    // Per-run tap delivery (onLinkTap) is device-qualified — the object
    // driver stores listeners in its own registry; the md-seams probe
    // records delivered taps on real hosts.
    expect(spans[2]).toBeTruthy()
  })

  it('nested Text emits span children under the text host', () => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))

    root.render(RichSurface, {})

    const nested = byId(container, 'nested')

    expect(nested?.type).toBe('label')

    const spans = all(nested).filter((n) => n.type === 'span')

    expect(spans.length).toBeGreaterThan(0)
  })

  it('renderers keep hooks/context across updates without remounting', async () => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))

    root.render(ContractSurface, {})
    flushUniversalSync(() => {})
    await vi.waitFor(() => expect(byId(container, 'slot-ctx')?.props?.text).toBe('ctx:provided'))

    const mountsBefore = stats.mounts

    prop$.set('second')
    flushUniversalSync(() => {})
    await vi.waitFor(() => expect(byId(container, 'slot-derived')?.props?.text).toBe('memo:SECOND'))
    expect(stats.mounts).toBe(mountsBefore)
    expect(byId(container, 'slot-ctx')?.props?.text).toBe('ctx:provided')
  })

  it('thrown, pending, declined and unmounted renderers hit their contract arms', async () => {
    const container = createObjectContainer('nativescript')
    const root = createUniversalRoot(container, createObjectDriver('nativescript'))

    root.render(ContractSurface, {})
    flushUniversalSync(() => {})
    // thrown → catch arm
    await vi.waitFor(() =>
      expect(byId(container, 'fb-throw')?.props?.text).toBe('caught:renderer exploded'),
    )

    // pending → pending arm, then body after resolve
    expect(byId(container, 'fb-pend')?.props?.text).toBe('pending-fallback')
    pendResolve?.('late-value')
    flushUniversalSync(() => {})
    await vi.waitFor(() =>
      expect(byId(container, 'pend-ok')?.props?.text).toBe('resolved:late-value'),
    )

    // unmount while pending → resolve lands nowhere, no error
    expect(byId(container, 'fb-pend2')?.props?.text).toBe('second-pending')
    showSuspender$.set(false)
    flushUniversalSync(() => {})
    pend2Resolve?.('too-late')
    flushUniversalSync(() => {})
    expect(byId(container, 'pend2-ok')).toBeFalsy()
    expect(byId(container, 'fb-pend2-err')).toBeFalsy()
    // declined mounts nothing; siblings unaffected
    expect(byId(container, 'tail')?.props?.text).toBe('tail')

    // reset() re-enters the body once the renderer no longer throws
    const resetBtn = byId(container, 'fb-reset')

    flushUniversalSync(() => container.dispatchEvent(resetBtn, 'tap', {}))
    await vi.waitFor(() => expect(byId(container, 'threw-ok')?.props?.text).toBe('recovered'))
  })
})
