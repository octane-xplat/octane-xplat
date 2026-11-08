import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { test } from 'node:test'
import vm from 'node:vm'

const require = createRequire(import.meta.url)
const core = dirname(require.resolve('@nativescript/core/package.json'))
const installedSource = readFileSync(join(core, 'ui/styling/font.ios.js'), 'utf8')
const tagId = (tag) => [...tag].reduce((id, char) => id * 256 + char.charCodeAt(0), 0)
const weightAxis = { tag: 'wght', name: 'Weight', min: 200, max: 900, default: 200 }
const widthAxis = { tag: 'wdth', name: 'Width', min: 50, max: 200, default: 100 }

// Run the actual patched module against the CoreText/UIKit boundary. CSS
// inheritance and real font instances are separately covered on the simulator.
function runtime(source = installedSource) {
  class Dictionary extends Map {
    objectForKey(key) {
      return this.get(key)
    }
    setObjectForKey(value, key) {
      this.set(key, value)
    }
    setValueForKey(value, key) {
      this.set(key, value)
    }
    addEntriesFromDictionary(other) {
      for (const [key, value] of other) {
        this.set(key, value)
      }
    }
  }
  const array = (values) => ({ count: values.length, objectAtIndex: (index) => values[index] })
  const weights = {
    THIN: '100',
    EXTRA_LIGHT: '200',
    LIGHT: '300',
    NORMAL: 'normal',
    MEDIUM: '500',
    SEMI_BOLD: '600',
    BOLD: 'bold',
    EXTRA_BOLD: '800',
    BLACK: '900',
  }
  class FontBase {
    constructor(family, size, style = 'normal', weight = 'normal', scale = 1, settings) {
      Object.assign(this, {
        fontFamily: family,
        fontSize: size,
        fontStyle: style,
        fontWeight: weight,
        fontScale: scale,
        fontVariationSettings: settings,
      })
    }
    get isBold() {
      return ['600', '700', 'bold', '800', '900'].includes(String(this.fontWeight))
    }
    get isItalic() {
      return this.fontStyle === 'italic'
    }
  }
  const faces = {
    Variable: [weightAxis, widthAxis],
    Narrow: [{ ...weightAxis, min: 300, max: 600, default: 300 }],
    Static: [],
  }
  const named = new Map()
  let creations = 0
  let copies = 0
  const make = (descriptor) => {
    creations++
    const family = descriptor.fontFamily[0] || 'Static'
    const axes = faces[family] || []
    const font = {
      family,
      axes,
      pointSize: descriptor.fontSize,
      fontName: family + '-' + creations,
      values: new Dictionary(axes.map((axis) => [tagId(axis.tag), axis.default])),
      nativeWeight: descriptor.fontWeight,
      italic: descriptor.isItalic,
    }
    named.set(font.fontName, font)
    return font
  }
  const ctAxes = (font) =>
    array(
      font.axes.map(
        (axis) =>
          new Dictionary([
            ['identifier', tagId(axis.tag)],
            ['name', axis.name],
            ['minimum', axis.min],
            ['maximum', axis.max],
          ]),
      ),
    )
  const context = {
    FontBase,
    FontWeight: weights,
    parseFontFamily: (family) => (family ? [family] : []),
    FontVariationSettings: {
      toString: (settings) =>
        settings?.map(({ axis, value }) => `'${axis}' ${value}`).join(', ') || null,
    },
    fuzzySearch: (tag, names) =>
      names.filter(
        (name) =>
          (({ wght: 'Weight', wdth: 'Width' })[tag.toLowerCase()] || tag.toLowerCase()) === name ||
          tag.toLowerCase() === name.toLowerCase(),
      ),
    Trace: { isEnabled: () => false },
    Folder: { exists: () => false },
    knownFolders: { currentApp: () => ({ path: '/fixture' }) },
    path: { join: (...parts) => parts.join('/') },
    FONTS_BASE_PATH: '/fonts',
    NativeScriptUtils: { createUIFont: make },
    NSMutableDictionary: { new: () => new Dictionary() },
    CTFontCopyVariationAxes: ctAxes,
    CTFontCopyVariation: (font) => font.values,
    kCTFontVariationAxisIdentifierKey: 'identifier',
    kCTFontVariationAxisNameKey: 'name',
    kCTFontVariationAxisMinimumValueKey: 'minimum',
    kCTFontVariationAxisMaximumValueKey: 'maximum',
    kCTFontVariationAttribute: 'variations',
    UIFontDescriptor: { fontDescriptorWithFontAttributes: (attributes) => attributes },
    CTFontCreateCopyWithAttributes: (font, size, matrix, descriptor) => {
      copies++
      assert.equal(matrix, null)
      return { ...font, pointSize: size, values: descriptor.variations }
    },
    // Retain the original module's API boundary too, so pre-patch failures
    // demonstrate wrong weights rather than missing mocks.
    CGFontCreateWithFontName: (name) => named.get(name),
    CGFontCopyVariationAxes: (font) =>
      array(font.axes.map((axis) => new Dictionary([['kCGFontVariationAxisName', axis.name]]))),
    CGFontCreateCopyWithVariations: (font, settings) => ({
      ...font,
      values: new Dictionary(
        font.axes.map((axis) => [tagId(axis.tag), settings.get(axis.name) ?? axis.default]),
      ),
    }),
    CTFontCreateWithGraphicsFont: (font, size) => ({ ...font, pointSize: size }),
    UIFontWeightUltraLight: -0.8,
    UIFontWeightThin: -0.6,
    UIFontWeightLight: -0.4,
    UIFontWeightRegular: 0,
    UIFontWeightMedium: 0.23,
    UIFontWeightSemibold: 0.3,
    UIFontWeightBold: 0.4,
    UIFontWeightHeavy: 0.56,
    UIFontWeightBlack: 0.62,
    console,
  }
  const body = source
    .replace(/^import .*;\r?$/gm, '')
    .replace(/^export \{.*\}.*;\r?$/gm, '')
    .replace(/^export /gm, '')
  vm.runInNewContext(body + '\nthis.Font = Font;', context, { filename: 'patched-font.ios.js' })
  return { Font: context.Font, creations: () => creations, copies: () => copies }
}

const coordinate = (font, tag = 'wght') => font.values.get(tagId(tag))
const defaultFont = { pointSize: 17 }

test('iOS variable fonts derive normal and computed numeric/named weights', () => {
  const { Font } = runtime()
  for (const [weight, expected] of [
    [undefined, 400],
    ['normal', 400],
    ['400', 400],
    ['500', 500],
    [600, 600],
    ['bold', 700],
    [900, 900],
  ]) {
    const font = new Font('Variable', 24, undefined, weight)
    assert.equal(coordinate(font.getUIFont(defaultFont)), expected)
    assert.equal(
      font.fontVariationSettings,
      undefined,
      'derived axes must not become authored/inherited settings',
    )
  }
})

test('explicit wght wins while other axes and authored settings survive', () => {
  const { Font } = runtime()
  const settings = Object.freeze([
    Object.freeze({ axis: 'wght', value: 550 }),
    Object.freeze({ axis: 'wdth', value: 120 }),
  ])
  const result = new Font('Variable', 24, 'italic', 700, 1.5, settings).getUIFont(defaultFont)
  assert.equal(coordinate(result), 550)
  assert.equal(coordinate(result, 'wdth'), 120)
  assert.equal(result.pointSize, 36)
  assert.equal(result.italic, true)
  assert.equal(settings[0].value, 550)
  assert.equal(settings.length, 2)
})

test('an explicit non-weight axis does not suppress computed weight', () => {
  const { Font } = runtime()
  const result = new Font('Variable', 24, undefined, 600, 1, [
    { axis: 'wdth', value: 110 },
  ]).getUIFont(defaultFont)
  assert.equal(coordinate(result), 600)
  assert.equal(coordinate(result, 'wdth'), 110)
})

test('coordinates clamp to the chosen font range', () => {
  const { Font } = runtime()
  assert.equal(coordinate(new Font('Narrow', 24, undefined, 100).getUIFont(defaultFont)), 300)
  assert.equal(coordinate(new Font('Narrow', 24, undefined, 900).getUIFont(defaultFont)), 600)
  assert.equal(
    coordinate(
      new Font('Narrow', 24, undefined, 400, 1, [{ axis: 'wght', value: 800 }]).getUIFont(
        defaultFont,
      ),
    ),
    600,
  )
})

test('weight, family and explicit-axis changes cannot reuse a stale cached font', () => {
  const r = runtime()
  const original = new r.Font('Variable', 24, undefined, 700)
  const bold = original.getUIFont(defaultFont)
  const medium = original.withFontWeight(500).getUIFont(defaultFont)
  const normal = original.withFontWeight(undefined).getUIFont(defaultFont)
  assert.equal(coordinate(bold), 700)
  assert.equal(coordinate(medium), 500)
  assert.equal(coordinate(normal), 400)
  assert.equal(original.getUIFont(defaultFont), bold)
  assert.equal(r.creations(), 3)
  const explicit = original
    .withFontVariationSettings([{ axis: 'wght', value: 550 }])
    .getUIFont(defaultFont)
  assert.equal(coordinate(explicit), 550)
  assert.equal(original.withFontVariationSettings(undefined).getUIFont(defaultFont), bold)
  const staticFont = original.withFontFamily('Static').getUIFont(defaultFont)
  assert.equal(coordinate(staticFont), undefined)
  assert.equal(staticFont.nativeWeight, 0.4)
})

test('static fonts keep their native selection without a variation copy', () => {
  const r = runtime()
  const result = new r.Font('Static', 24, 'italic', 'bold').getUIFont(defaultFont)
  assert.equal(result.nativeWeight, 0.4)
  assert.equal(result.italic, true)
  assert.equal(r.copies(), 0)
})
