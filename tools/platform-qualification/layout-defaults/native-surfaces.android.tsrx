/** @jsxImportSource @octane-xplat/jsx */
import { ShaderEffect } from '@octane-xplat/effects/android'
import { MaterialBottomSheet } from '@octane-xplat/sheet/android'
import { MaterialContextMenu } from '@octane-xplat/context-menu/android'
import { VStack } from '@octane-xplat/ui'
import { Slot, slots } from './native-slot-content.mobile.tsrx'
import type { NativeSurfacesProps } from './native-surfaces-props'

export function previewAttached(): boolean {
  return false
}

export function retainSheetAttachment(): () => boolean {
  const native = slots.get('sheet')?.first?.android

  return () => native?.isAttachedToWindow?.() === true
}

export function ShaderSurface() {
  return (
    // Declare the injected uniforms: the Android 35 missing-uniform JNI error can abort before JS can catch it.
    <ShaderEffect
      id="native-effect-host"
      className="native-slot-frame"
      source="uniform shader content; uniform float time; uniform float2 size; half4 main(float2 p) { return content.eval(p + float2(sin(time), sin(size.x + size.y)) * 0.00001); }"
      animate={false}
    >
      <Slot name="effect" />
    </ShaderEffect>
  )
}

export function NativeSurfaces(props: NativeSurfacesProps) {
  return (
    <VStack id="native-surfaces-root">
      <MaterialContextMenu
        className="native-slot-frame"
        items={[{ id: 'one', title: 'One' }]}
        trigger={() => <Slot name="trigger" />}
      />
      <MaterialBottomSheet
        open={props.open}
        skipPartiallyExpanded
        showDragHandle={false}
        content={() => <Slot name="sheet" />}
      />
    </VStack>
  )
}
