/** @jsxImportSource @octane-xplat/jsx */
import { expect, it } from 'vitest'
import { isIOS, type Label, type View as NativeView } from '@nativescript/core'
import { useState } from 'octane'
import { Pressable, Screen, Text, View } from '@octane-xplat/ui'
import { mountXplat, tap, waitUntil } from '@octane-xplat/platform/testing'

// NativeScript exposes these CoreText symbols at runtime. Its default iOS
// ambient entry does not include CoreText, so declare the narrow test boundary.
declare function CTFontCopyVariation(font: UIFont): NSDictionary<number, number> | null
declare function CTFontCopyVariationAxes(font: UIFont): NSArray<NSDictionary<string, unknown>> | null
declare const kCTFontVariationAxisIdentifierKey: string
declare const kCTFontVariationAxisDefaultValueKey: string

const WEIGHTS = [100, 400, 900] as const
// OpenType axis tags are four-byte integers: 'wght'.
const WEIGHT_AXIS = 0x77676874

function VariableFontSample() @{
  const [weight, setWeight] = useState(300)

  <Screen>
    <View>
      @for (const value of WEIGHTS; key value) {
        <Text id={'weight-' + value} style={{ fontFamily: 'Geist', fontSize: 24, fontWeight: value }}>
          {'Variable font weight ' + value}
        </Text>
      }
      <Text id="changing-weight" style={{ fontFamily: 'Geist', fontSize: 24, fontWeight: weight }}>
        Retained variable font label
      </Text>
      <Pressable id="change-weight" onPress={() => setWeight(700)}>
        <Text>Use weight 700</Text>
      </Pressable>
    </View>
  </Screen>
}

function nativeFont(label: Label): UIFont {
  const native: UILabel = label.ios
  return native.font
}

function weightCoordinate(label: Label): number | undefined {
  const font = nativeFont(label)
  const axes = CTFontCopyVariationAxes(font)
  for (let index = 0; index < (axes?.count ?? 0); index++) {
    const axis: NSDictionary<string, unknown> = axes!.objectAtIndex(index)
    if (axis.objectForKey(kCTFontVariationAxisIdentifierKey) !== WEIGHT_AXIS) continue

    const coordinate: unknown = CTFontCopyVariation(font)?.objectForKey(
      NSNumber.numberWithUnsignedInt(WEIGHT_AXIS),
    )
    // CoreText can omit an unmodified coordinate. Only use the default after
    // proving this font actually declares a variable weight axis.
    const resolved = coordinate ?? axis.objectForKey(kCTFontVariationAxisDefaultValueKey)
    return typeof resolved === 'number' ? resolved : undefined
  }
  return undefined
}

it.skipIf(!isIOS)('selects Geist variable weight coordinates and updates the retained native label', async () => {
  // The harness stages the real Geist-Variable.ttf as fonts/Geist.ttf.
  // Inspect CoreText's resolved axis, so fallback or synthetic bold cannot pass.
  const { view } = await mountXplat(VariableFontSample)
  for (const weight of WEIGHTS) {
    const label = view.getViewById<Label>('weight-' + weight)!
    await waitUntil(() => label.isLoaded && label.getActualSize().height > 0)
    expect(nativeFont(label).familyName).toBe('Geist')
    expect(weightCoordinate(label), 'resolved wght coordinate for ' + weight).toBeCloseTo(weight, 0)
    expect(nativeFont(label).pointSize).toBeCloseTo(24, 0)
  }

  const changing = view.getViewById<Label>('changing-weight')!
  const native: UILabel = changing.ios
  expect(weightCoordinate(changing)).toBeCloseTo(300, 0)
  await tap(view.getViewById<NativeView>('change-weight')!)
  await waitUntil(() => Math.abs((weightCoordinate(changing) ?? NaN) - 700) < 0.5, {
    message: 'fontWeight update did not select the Geist wght=700 instance',
  })
  expect(weightCoordinate(changing)).toBeCloseTo(700, 0)
  expect(view.getViewById<Label>('changing-weight')).toBe(changing)
  expect(changing.ios).toBe(native)
  expect(nativeFont(changing).familyName).toBe('Geist')
  expect(nativeFont(changing).pointSize).toBeCloseTo(24, 0)
})
