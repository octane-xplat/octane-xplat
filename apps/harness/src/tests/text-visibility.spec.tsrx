/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { isIOS, Label, StackLayout, type View as NativeView } from '@nativescript/core'
import { mount } from '@nativescript/unit-test-runner/testing'
import { Style as MasonStyle } from '@octane-xplat/nativescript-mason-core/style'
import type { View as MasonView } from '@octane-xplat/nativescript-mason-core'
import { mountXplat, tap, viewText, waitUntil } from '@octane-xplat/platform/testing'
import { LayeredVisibility, SimpleVisibility } from './text-visibility-fixture.tsrx'
import { NativeVisibility } from './text-visibility-native-fixture.tsrx'
import './text-visibility.css'

function masonVisibility(view: NativeView) {
  // beta.8 types restrict the owner to MasonView, but fromView also binds foreign
  // NativeScript views (the renderer bridge uses that path). Only read visibility.
  return MasonStyle.fromView(view as MasonView, view.nativeViewProtected).visibility
}

function drawingState(view: NativeView) {
  const native = view.nativeViewProtected

  return isIOS
    ? {
        hidden: native.hidden,
        alpha: native.alpha,
        layerHidden: native.layer.hidden,
        layerOpacity: native.layer.opacity,
      }
    : { visibility: view.android.getVisibility() }
}

function suppressed(view: NativeView) {
  const state = drawingState(view)

  return 'hidden' in state
    ? state.hidden || state.alpha === 0 || state.layerHidden || state.layerOpacity === 0
    : state.visibility === 4 || state.visibility === 8
}

for (const [shape, Component] of [
  ['simple', SimpleVisibility],
  ['layered', LayeredVisibility],
] as const) {
  it(`updates public Text visibility and conditional hosts in ${shape} layout`, async () => {
    const { view } = await mountXplat(Component)
    const node = (id: string) => view.getViewById<Label>(id)
    const required = (id: string) => {
      const found = node(id)

      expect(found, id).toBeTruthy()
      return found!
    }

    const left = (id: string) => {
      const leaf = required(id)

      return leaf.getLocationRelativeTo(leaf.parent as NativeView)?.x ?? -999
    }

    const click = async (id: string) => {
      await tap(required(id))
    }

    const failures: unknown[] = []
    const checkSuppression = (id: string, expected: boolean) => {
      const leaf = required(id)

      if (suppressed(leaf) !== expected) {
        failures.push({
          id,
          expected,
          ...drawingState(leaf),
          masonVisibility: masonVisibility(leaf),
        })
      }
    }

    const slot = async (id: string, x: number) => {
      await waitUntil(() => Math.abs(left(id) - x) < 1)
      expect(left(id)).toBeCloseTo(x, 0)
    }

    await waitUntil(() => required('inline-after').getActualSize().width > 0)
    expect(required('initial-hidden').visibility).toBe('hidden')
    expect(required('initial-collapse').visibility).toBe('collapse')
    for (const id of ['initial-hidden', 'initial-collapse', 'inline', 'class']) {
      checkSuppression(id, true)
    }

    checkSuppression('visible', false)
    expect(node('conditional')).toBeUndefined()
    await slot('inline-after', 80)
    await slot('class-after', 80)
    await slot('conditional-after', 0)

    const retained = required('inline')
    const retainedClass = required('class')

    // Android rounds DIP dimensions to physical pixels. Allow half a DIP.
    for (const id of ['inline', 'class']) {
      const size = required(id).getActualSize()

      expect(size.width).toBeCloseTo(80, 0)
      expect(size.height).toBeCloseTo(30, 0)
    }

    const initialTicks = Number(required('heartbeat').text)
    let resizes = 0

    for (let cycle = 0; cycle < 3; cycle++) {
      await click('text')

      const text = '+10s changed while hidden ' + (cycle + 1)

      await waitUntil(() => required('inline').text === text && required('class').text === text)
      checkSuppression('inline', true)
      checkSuppression('class', true)
      for (const mode of ['collapse', 'visible', 'hidden'] as const) {
        await click('next')
        await waitUntil(
          () => required('inline').visibility === mode && required('class').visibility === mode,
        )

        await click('resize')
        required('stage').requestLayout()

        const width = ++resizes % 2 ? 260 : 180

        await waitUntil(() => Math.abs(required('stage').getActualSize().width - width) < 1)
        await slot('inline-after', mode === 'collapse' ? 0 : 80)
        await slot('class-after', mode === 'collapse' ? 0 : 80)
        expect(required('inline')).toBe(retained)
        expect(required('class')).toBe(retainedClass)
        checkSuppression('inline', mode !== 'visible')
        checkSuppression('class', mode !== 'visible')
        await click('input')
      }

      await click('mount')
      await waitUntil(() => Boolean(node('conditional')))
      expect(required('conditional').text).toBe(text)
      await slot('conditional-after', 80)

      const previous = required('conditional')

      await click('mount')
      await waitUntil(() => !node('conditional'))
      await slot('conditional-after', 0)
      await click('mount')
      await waitUntil(() => Boolean(node('conditional')))
      expect(required('conditional')).not.toBe(previous)
      expect(required('conditional').text).toBe(text)
      await slot('conditional-after', 80)
      await click('mount')
      await waitUntil(() => !node('conditional'))
      await slot('conditional-after', 0)
    }

    expect(viewText(required('input'))).toEqual(['Input 9'])
    await waitUntil(() => Number(required('heartbeat').text) > initialTicks + 3)
    console.log(
      'TEXT_VISIBILITY',
      JSON.stringify({ shape, ticks: required('heartbeat').text, failures }),
    )

    // Accumulate suppression failures so they cannot prevent liveness/remount coverage.
    expect(failures).toEqual([])
  })
}

it('compares native suppression outside Mason and on foreign Mason labels', async () => {
  const { view: outside } = await mount(() => {
    const stack = new StackLayout()

    for (const visibility of ['visible', 'hidden', 'collapse'] as const) {
      const label = new Label()

      label.id = visibility
      label.text = visibility
      label.visibility = visibility
      stack.addChild(label)
    }

    return stack
  })

  for (const visibility of ['visible', 'hidden', 'collapse']) {
    const label = outside.getViewById<Label>(visibility)!

    expect(label.nativeViewProtected).toBeTruthy()
    console.log('NATIVE_LABEL_OUTSIDE', JSON.stringify({ visibility, ...drawingState(label) }))
    expect(suppressed(label), JSON.stringify(drawingState(label))).toBe(visibility !== 'visible')
  }

  const { view } = await mountXplat(NativeVisibility)
  const failures: unknown[] = []

  for (const id of ['raw-visible', 'raw-hidden', 'raw-class-hidden', 'raw-collapse']) {
    const label = view.getViewById<Label>(id)!

    await waitUntil(() => label.isLoaded)

    const state = {
      id,
      visibility: label.visibility,
      masonVisibility: masonVisibility(label),
      ...drawingState(label),
    }

    console.log('NATIVE_LABEL_VISIBILITY', JSON.stringify(state))
    if (suppressed(label) !== (label.visibility !== 'visible')) {
      failures.push(state)
    }
  }

  expect(failures).toEqual([])
})
