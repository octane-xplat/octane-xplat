import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { prepareBalancedText, wrapBalancedText } from './balanced-text-layout'

beforeEach(() => {
  vi.stubGlobal(
    'OffscreenCanvas',
    class {
      getContext() {
        return { measureText: (text: string) => ({ width: [...text].length * 10 }) }
      }
    },
  )
})

afterEach(() => vi.unstubAllGlobals())

const font = '16px system-ui'
const title = 'Make room for the work that matters'

it('evens out a short last line without adding a line, and reflows as width changes', () => {
  const prepared = prepareBalancedText(title, font)

  expect(wrapBalancedText(prepared, 290)).toBe('Make room for the\nwork that matters')
  expect(wrapBalancedText(prepared, 360)).toBe(title)
})

it('balances separately on either side of an explicit break', () => {
  const prepared = prepareBalancedText(`${title}\r\n\r\nProject notes`, font)

  expect(wrapBalancedText(prepared, 290)).toBe(
    'Make room for the\nwork that matters\r\n\r\nProject notes',
  )
})

it('keeps the original content when layout has no width or a word is too wide', () => {
  const text = 'A verylongunbrokenword'
  const prepared = prepareBalancedText(text, font)

  expect(wrapBalancedText(prepared, 0)).toBe(text)
  expect(wrapBalancedText(prepared, 100)).toBe(text)
})
