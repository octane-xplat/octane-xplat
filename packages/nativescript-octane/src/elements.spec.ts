import { describe, expect, it, vi } from 'vitest'

vi.mock('@nativescript/core', async () => (await import('../tests/core-mock.js')).createCoreMock())

import * as core from '@nativescript/core'
import {
  ELEMENTS,
  type ElementConstructor,
  eventNameFor,
  onElementReplaced,
  registerElement,
} from './elements.js'

describe('ELEMENTS', () => {
  it('registers the core view classes under lowercase tag names', () => {
    expect(ELEMENTS.has('stacklayout')).toBe(false)
    expect(ELEMENTS.get('masonview')).toBe(core.LayoutBase)
    expect(ELEMENTS.get('label')).toBe(core.Label)
    expect(ELEMENTS.get('liquidglass')).toBe(core.LiquidGlass)
    expect(ELEMENTS.has('StackLayout')).toBe(false)
  })
})

describe('registerElement', () => {
  it('notifies listeners only when a tag changes class', () => {
    const listener = vi.fn()
    const unsubscribe = onElementReplaced(listener)
    const First = class extends core.View {} as unknown as ElementConstructor
    const Second = class extends core.View {} as unknown as ElementConstructor
    try {
      registerElement('custom', First)
      registerElement('custom', First)
      expect(listener).not.toHaveBeenCalled()
      expect(ELEMENTS.get('custom')).toBe(First)

      registerElement('custom', Second)
      expect(listener).toHaveBeenCalledExactlyOnceWith('custom', Second)

      unsubscribe()
      registerElement('custom', First)
      expect(listener).toHaveBeenCalledTimes(1)
    } finally {
      unsubscribe()
      ELEMENTS.delete('custom')
    }
  })
})

describe('eventNameFor', () => {
  it.each([
    ['onTap', 'tap'],
    ['onClick', 'tap'],
    ['onPress', 'tap'],
    ['onDoubleTap', 'doubleTap'],
    ['onLongPress', 'longPress'],
    ['onChange', 'textChange'],
    ['onSubmit', 'returnPress'],
    ['onLoaded', 'loaded'],
    ['onItemTap', 'itemTap'],
    ['onSelectedIndexChange', 'selectedIndexChange'],
  ])('%s -> %s', (prop, event) => {
    expect(eventNameFor(prop)).toBe(event)
  })
})
