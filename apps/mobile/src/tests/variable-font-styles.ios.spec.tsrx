/** @jsxImportSource @octane-xplat/jsx */
import './variable-font-styles.css'
import { expect, it } from 'vitest'
import { isIOS, type View as NativeView } from '@nativescript/core'
import { useState } from 'octane'
import { Pressable, Text, TextInput, TextArea } from '@octane-xplat/ui'
import { mountXplat, tap, waitUntil } from '@octane-xplat/platform/testing'
import { fontTestClasses as classes } from '../../../../packages/app/src/font-test-styles'

declare function CTFontCopyVariation(font: UIFont): NSDictionary<number, number> | null
declare function CTFontCopyVariationAxes(
  font: UIFont,
): NSArray<NSDictionary<string, unknown>> | null

declare const kCTFontVariationAxisIdentifierKey: string
declare const kCTFontVariationAxisDefaultValueKey: string

function weight(font: UIFont): number | undefined {
  const axes = CTFontCopyVariationAxes(font)
  for (let index = 0; index < (axes?.count ?? 0); index++) {
    const axis: NSDictionary<string, unknown> = axes!.objectAtIndex(index)
    if (axis.objectForKey(kCTFontVariationAxisIdentifierKey) !== 0x77676874) {
      continue
    }

    const value =
      CTFontCopyVariation(font)?.objectForKey(0x77676874) ??
      axis.objectForKey(kCTFontVariationAxisDefaultValueKey)

    return typeof value === 'number' ? value : undefined
  }

  return undefined
}

function nativeFont(view: NativeView): UIFont {
  const native: UILabel | UITextField | UITextView = view.ios
  return native.font!
}

function FontStyles() @{
  <rootlayout className="font-test">
    <Text id="font-normal">Normal</Text>
    <Text id="font-class600" className={classes.semibold}>
      Semibold
    </Text>
    <Text id="font-class700" className={classes.bold}>
      Bold
    </Text>
    <TextInput id="font-input500" className={classes.medium} defaultValue="Medium input" />
    <TextArea id="font-area500" className={classes.medium} defaultValue="Medium area" rows={1} />
    <TextInput id="font-input-inline500" style={{ fontWeight: 500 }} defaultValue="Inline medium" />
    <TextArea
      id="font-area-inline500"
      style={{ fontWeight: 500 }}
      defaultValue="Inline medium"
      rows={1}
    />
    <Text
      id="font-explicit550"
      className={classes.bold}
      style={{ fontVariationSettings: "'wght' 550" }}
    >
      Explicit
    </Text>
    <TextInput
      id="font-input-explicit550"
      className={classes.bold}
      style={{ fontVariationSettings: "'wght' 550" }}
      defaultValue="Explicit"
    />
    <TextArea
      id="font-area-explicit550"
      className={classes.bold}
      style={{ fontVariationSettings: "'wght' 550" }}
      defaultValue="Explicit"
      rows={1}
    />
    <Text id="font-clamped200" style={{ fontWeight: 100 }}>
      Clamped
    </Text>
  </rootlayout>
}

const expectedWeights = [
  ['font-normal', 400],
  ['font-class600', 600],
  ['font-class700', 700],
  ['font-input500', 500],
  ['font-area500', 500],
  ['font-input-inline500', 500],
  ['font-area-inline500', 500],
  ['font-explicit550', 550],
  ['font-input-explicit550', 550],
  ['font-area-explicit550', 550],
  ['font-clamped200', 200],
] as const

it.skipIf(!isIOS)(
  'resolves computed/default weights for Text and editors, with explicit-axis precedence',
  async () => {
    const { view } = await mountXplat(FontStyles)
    await waitUntil(() =>
      expectedWeights.every(([id]) => view.getViewById<NativeView>(id)?.isLoaded),
    )

    for (const [id, expected] of expectedWeights) {
      const font = nativeFont(view.getViewById<NativeView>(id)!)
      expect(font.familyName, id + ' family').toBe('SN Pro')
      expect(weight(font), id + ' wght').toBeCloseTo(expected, 0)
      expect(font.pointSize, id + ' size').toBeCloseTo(24, 0)
    }
  },
)

function ChangingFont() @{
  const [stage, setStage] = useState(0)
  const parentClass = stage < 3 ? classes.bold : classes.regular
  const childClass = stage === 0 ? classes.semibold : stage === 1 ? classes.medium : undefined

  <rootlayout className={'font-test' + (stage === 4 ? ' font-test-static' : '')}>
    // Use core layouts/editors to qualify inherited weights independently of
    // the generic Mason container inheritance gap; the matrix above covers
    // the shared editor wrappers and the real Bamboo class path.
    <rootlayout className={parentClass}>
      <Text id="font-changing" className={childClass}>
        Retained label
      </Text>
      <textfield id="font-changing-input" className={childClass} text="Retained input" />
      <textview id="font-changing-area" className={childClass} text="Retained area" />
    </rootlayout>
    <Pressable id="font-next" onPress={() => setStage((current) => (current + 1) % 6)}>
      <Text>Next font state</Text>
    </Pressable>
  </rootlayout>
}

it.skipIf(!isIOS)(
  'updates retained controls after class removal, inherited-weight changes and family changes',
  async () => {
    const { view } = await mountXplat(ChangingFont)
    const ids = ['font-changing', 'font-changing-input', 'font-changing-area']
    const controls = ids.map((id) => view.getViewById<NativeView>(id)!)
    await waitUntil(() => controls.every((control) => control.isLoaded))
    const nativeControls = controls.map((control) => control.ios)
    for (const expected of [600, 500, 700, 400, undefined, 400]) {
      await waitUntil(() => controls.every((control) => weight(nativeFont(control)) === expected))
      for (let index = 0; index < controls.length; index++) {
        expect(view.getViewById(ids[index])).toBe(controls[index])
        expect(controls[index].ios).toBe(nativeControls[index])
        const font = nativeFont(controls[index])
        expect(font.familyName).toBe(expected === undefined ? 'Courier' : 'SN Pro')
        expect(font.pointSize).toBeCloseTo(24, 0)
      }

      await tap(view.getViewById<NativeView>('font-next')!)
    }
  },
)
