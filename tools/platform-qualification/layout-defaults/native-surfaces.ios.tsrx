/** @jsxImportSource @octane-xplat/jsx */
import { ShaderEffect } from '@octane-xplat/effects/ios'
import { SwiftUIBottomSheet } from '@octane-xplat/sheet/ios'
import { SwiftUIContextMenu } from '@octane-xplat/context-menu/ios'
import { VStack } from '@octane-xplat/ui'
import { Slot, slots } from './native-slot-content.mobile.tsrx'
import type { NativeSurfacesProps } from './native-surfaces-props'

export function previewAttached(): boolean {
  return slots.get('preview')?.first?.ios?.window != null
}

export function retainSheetAttachment(): () => boolean {
  const native = slots.get('sheet')?.first?.ios

  return () => native?.window != null
}

export function NativeSurfaces(props: NativeSurfacesProps) {
  return (
    <VStack>
      <ShaderEffect className="native-slot-frame" effect="sheen" animate={false}>
        <Slot name="effect" />
      </ShaderEffect>
      <SwiftUIContextMenu
        className="native-slot-frame"
        items={[{ id: 'one', title: 'One' }]}
        trigger={() => <Slot name="trigger" />}
        preview={() => <Slot name="preview" />}
      />
      <SwiftUIBottomSheet open={props.open} fitToContents content={() => <Slot name="sheet" />} />
    </VStack>
  )
}
