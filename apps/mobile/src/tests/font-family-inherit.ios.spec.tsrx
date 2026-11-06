/** @jsxImportSource @octane-xplat/jsx */
import './font-family-inherit.css'
import { expect, it } from 'vitest'
import { isIOS, type View as NativeView } from '@nativescript/core'
import { useState } from 'octane'
import { Pressable, Text } from '@octane-xplat/ui'
import { mountXplat, tap, waitUntil } from '@octane-xplat/platform/testing'

// octane-xplat#157 — a parallel non-inherited fontFamily registration split
// style.fontFamily into two slots: core's InheritedCssProperty held the
// inherited family while the dispatched accessor returned Mason's unset slot.
// propagateInheritableCssProperties reads style[prop.name], so a child
// attached to a Mason container after the root family propagated inherited
// undefined and fell back to the default family. The published
// @octane-xplat/nativescript-mason-core keeps fontFamily on core's
// InheritedCssProperty and forwards the family to the Mason style helper from
// that property's valueChanged — this spec qualifies the lifecycle on-device:
// late mounts, conditional branch replacement, and reset/reapply.
type Stage = 0 | 1 | 2 | 3 | 4

function InheritedFamily() @{
  const [stage, setStage] = useState<Stage>(0)

  <rootlayout className={stage === 3 ? undefined : 'font-root'}>
    <masonview>
      @if (stage < 3) {
        <label id="family-early" text="Early mount" />
      }
      @if (stage === 1) {
        <>
          <label id="family-late" text="Late mount" />
          <textfield id="family-late-input" text="Late editor" />
        </>
      }
      @if (stage === 2) {
        <label id="family-return" text="Returned branch" />
      }
      @if (stage === 3) {
        <label id="family-default" text="Reset branch" />
      }
      @if (stage === 4) {
        <label id="family-reapplied" text="Reapplied branch" />
      }
    </masonview>
    <Pressable id="family-next" onPress={() => setStage((current) => ((current + 1) % 5) as Stage)}>
      <Text>Next stage</Text>
    </Pressable>
  </rootlayout>
}

function familyOf(view: NativeView): string | undefined {
  const native: UILabel | UITextField = view.ios
  return native.font?.familyName
}

const stages: ReadonlyArray<readonly [id: string, family: string | 'not-sn-pro'][]> = [
  [['family-early', 'SN Pro']],
  [
    ['family-early', 'SN Pro'],
    ['family-late', 'SN Pro'],
    ['family-late-input', 'SN Pro'],
  ],
  [
    ['family-early', 'SN Pro'],
    ['family-return', 'SN Pro'],
  ],
  [['family-default', 'not-sn-pro']],
  [['family-reapplied', 'SN Pro']],
]

it.skipIf(!isIOS)(
  'inherited font-family survives late mounts, branch replacement, and reset through a Mason container',
  async () => {
    const { view } = await mountXplat(InheritedFamily)
    for (let stage = 0; stage < stages.length; stage++) {
      const expectations = stages[stage]
      await waitUntil(() =>
        expectations.every(([id]) => view.getViewById<NativeView>(id)?.isLoaded),
      )

      for (const [id, family] of expectations) {
        const target = view.getViewById<NativeView>(id)!
        const resolved = familyOf(target)
        if (family === 'not-sn-pro') {
          expect(resolved, `${id} after reset`).not.toBe('SN Pro')
        } else {
          expect(resolved, `${id} family at stage ${stage}`).toBe(family)
        }
      }

      if (stage < stages.length - 1) {
        await tap(view.getViewById<NativeView>('family-next')!)
      }
    }
  },
)
