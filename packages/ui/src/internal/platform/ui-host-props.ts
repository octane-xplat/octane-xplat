import { isAndroid, ScrollView } from '@nativescript/core'
import type { NativeModifier } from '../../props'
import { applyNativeModifiers } from './apply-native-modifiers.native'

/** Keep Android overflow visible for non-scrolling containers once loaded. */
export function prepareUIHost(view: any): void {
  if (!view || !isAndroid) return
  view.on?.('loaded', () => {
    const native = view.android
    if (!native || view instanceof ScrollView || typeof native.setClipChildren !== 'function') return
    native.setClipChildren(false)
    native.setClipToPadding(false)
  })
}

/** Apply modifiers after the platform escape bag. */
export function applyUIHostModifiers(view: any, props: { ios?: object; android?: object; modifiers?: readonly NativeModifier[] }): void {
  applyNativeModifiers(view, props.modifiers)
}
