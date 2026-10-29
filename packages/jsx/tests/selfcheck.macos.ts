import type { JSX as MacJSX } from '../src/macos.js'
import type { JSX as SharedJSX } from '../src/jsx-runtime.js'

const horizontal: MacJSX.IntrinsicElements['masonview'] = { accessibilityRole: 'toolbar', accessibilityOrientation: 'horizontal' }
const vertical: MacJSX.IntrinsicElements['masonview'] = { accessibilityRole: 'toolbar', accessibilityOrientation: 'vertical' }
// @ts-expect-error AppKit axis metadata accepts the two physical layout axes only.
const invalid: MacJSX.IntrinsicElements['masonview'] = { accessibilityOrientation: 'diagonal' }
// @ts-expect-error This is an AppKit host attribute, not a shared layout prop.
const shared: SharedJSX.IntrinsicElements['masonview'] = { accessibilityOrientation: 'horizontal' }
const tinted: MacJSX.IntrinsicElements['textfield'] = { placeholderTextColor: '#8a8a8e' }
// @ts-expect-error The AppKit renderer parses placeholder colors from CSS strings only.
const objectTint: MacJSX.IntrinsicElements['textfield'] = { placeholderTextColor: {} }
// @ts-expect-error This is an AppKit host attribute, not a shared text field prop.
const sharedTint: SharedJSX.IntrinsicElements['textfield'] = { placeholderTextColor: '#8a8a8e' }
void horizontal
void vertical
void invalid
void shared
void tinted
void objectTint
void sharedTint
