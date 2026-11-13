import { vi } from 'vitest'

vi.mock('@octane-xplat/nativescript-masonkit', async () => {
  const { MockLayoutBase } = await import('./core-mock.js')
  return { View: MockLayoutBase, Scroll: MockLayoutBase }
})
vi.mock('@octane-xplat/nativescript-masonkit/style', () => ({
  Style: { fromView: () => undefined },
}))
vi.mock('@nativescript/core/ui/core/properties', () => ({
  _getProperties: () => [],
  _getStyleProperties: () => [],
}))
vi.mock('@nativescript/core/css/css-tree-parser', () => ({
  cssTreeParse: () => ({ stylesheet: { rules: [] } }),
}))
