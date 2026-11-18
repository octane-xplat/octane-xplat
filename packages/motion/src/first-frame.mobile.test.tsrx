/** @jsxImportSource @octane-xplat/jsx */
import { afterEach, describe, expect, it } from 'vitest'
import {
  createObjectContainer,
  createObjectDriver,
  createUniversalRoot,
} from 'octane/universal/native'

import { motion } from './index'

const FLAG = '__xplatPrerenderFirstFrame'

function root() {
  const container = createObjectContainer('nativescript')
  return {
    container,
    root: createUniversalRoot(container, createObjectDriver('nativescript')),
  }
}

function prepareWith(component: any, props: any, firstFrame: boolean) {
  const { root: r } = root()
  const scope = globalThis as any
  const had = FLAG in scope
  const prior = scope[FLAG]
  if (firstFrame) scope[FLAG] = true
  try {
    return r.prepare(component, props)
  } finally {
    if (had) scope[FLAG] = prior
    else delete scope[FLAG]
  }
}

function hosts(prepared: any) {
  return prepared.batch.commands.filter((command: any) => command.op === 'create')
}

afterEach(() => {
  delete (globalThis as any)[FLAG]
})

function FadingBox() @{
  <motion.View id="fade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
}

describe('first-frame prerender flag', () => {
  it('bakes the initial seed into emitted style under the flag', () => {
    const prepared = prepareWith(FadingBox, {}, true)
    expect(prepared.status).toBe('prepared')

    const host = hosts(prepared).find((command: any) => command.props.id === 'fade')
    expect(host?.props.style).toMatchObject({ opacity: 0 })

    prepared.abort()
    expect((globalThis as any)[FLAG]).toBeUndefined()
  })

  it('bakes the animate target when initial is false', () => {
    function Immediate() @{
      <motion.View id="now" initial={false} animate={{ opacity: 0.4 }} />
    }

    const prepared = prepareWith(Immediate, {}, true)
    expect(prepared.status).toBe('prepared')
    expect(
      hosts(prepared).find((command: any) => command.props.id === 'now')?.props.style,
    ).toMatchObject({ opacity: 0.4 })
    prepared.abort()
  })

  it('rejects channels outside the startup style bounds', () => {
    function Sliding() @{
      <motion.View initial={{ x: 10 }} animate={{ x: 50 }} />
    }

    expect(() => prepareWith(Sliding, {}, true)).toThrow(
      'motion: startup prerender cannot emit x',
    )
  })

  it('rejects out-of-range bounded values', () => {
    function Beyond() @{
      <motion.View initial={{ opacity: 2 }} animate={{ opacity: 1 }} />
    }

    expect(() => prepareWith(Beyond, {}, true)).toThrow(
      'motion: startup prerender cannot emit opacity',
    )
  })

  it('emits no baked style without the flag', () => {
    const prepared = prepareWith(FadingBox, {}, false)
    expect(prepared.status).toBe('prepared')

    const host = hosts(prepared).find((command: any) => command.props.id === 'fade')
    expect(host?.props.style ?? {}).not.toHaveProperty('opacity')

    prepared.abort()
  })

  it('emits no baked style on a later prepare after the flag clears', () => {
    const { root: r } = root()
    const scope = globalThis as any
    scope[FLAG] = true
    const first = r.prepare(FadingBox, {})
    delete scope[FLAG]

    const second = r.prepare(FadingBox, {})
    expect(
      hosts(second).find((command: any) => command.props.id === 'fade')?.props.style ?? {},
    ).not.toHaveProperty('opacity')

    first.abort()
    second.abort()
  })
})
