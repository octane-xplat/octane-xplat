/**
 * Native-condition self-check — `import type` is the only safe way to name
 * the NativeScript host class here; the specifier matches the one the
 * `native`-conditioned entry uses.
 */
import type { View } from '@nativescript/core/ui/core/view/index.js'
import type { HostElement, JSX, Ref } from '../src/native.js'
import type { SharedTags } from './selfcheck.js'

// Membership parity against the default entry.
const nativeTag: keyof JSX.IntrinsicElements = null as unknown as SharedTags
void nativeTag

// The ref and host-event payload bind the real NativeScript View.
declare const nativeView: HostElement
const isView: View = nativeView
const toView: HostElement = null as unknown as View
void isView
void toView

const refObject: Ref<View> = { current: null as unknown as View }
const refFromShared: Ref<HostElement> = refObject
void refFromShared
