import type { JSX as MacJSX } from '../src/macos.js'
import type { JSX as SharedJSX } from '../src/jsx-runtime.js'

const horizontal: MacJSX.IntrinsicElements['masonview'] = { accessibilityRole: 'toolbar', accessibilityOrientation: 'horizontal' }
const vertical: MacJSX.IntrinsicElements['masonview'] = { accessibilityRole: 'toolbar', accessibilityOrientation: 'vertical' }
// @ts-expect-error AppKit axis metadata accepts the two physical layout axes only.
const invalid: MacJSX.IntrinsicElements['masonview'] = { accessibilityOrientation: 'diagonal' }
// @ts-expect-error This is an AppKit host attribute, not a shared layout prop.
const shared: SharedJSX.IntrinsicElements['masonview'] = { accessibilityOrientation: 'horizontal' }
void horizontal
void vertical
void invalid
void shared
