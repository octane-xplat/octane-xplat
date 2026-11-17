import type { Role } from '../../props'
import type { AccessibilityStateName } from '@octane-xplat/jsx/intrinsics'

const NATIVE_ACCESSIBILITY_ROLES: Record<Role, string> = {
  button: 'button',
  link: 'link',
  search: 'search',
  image: 'image',
  heading: 'header',
  adjustable: 'adjustable',
  summary: 'summary',
  text: 'text',
  none: 'none',
  progressbar: 'progressBar',
  checkbox: 'checkbox',
  switch: 'switch',
  radio: 'radioButton',
  spinbutton: 'spinButton',
  // NativeScript has no tab role; a tab is still an actionable button and
  // its selected state is carried separately by accessibilityState.
  tab: 'button',
  menu: 'none',
  group: 'none',
  menuitem: 'button',
  menuitemcheckbox: 'checkbox',
  menuitemradio: 'radioButton',
  // NativeScript has no meter role; progressBar is the closest platform
  // role for a scalar-within-a-range readout.
  meter: 'progressBar',
  // No live-region role on native — keep the region inert there.
  status: 'none',
  // ARIA document/paragraph roles have no native counterpart; native text
  // hosts already read as text.
  document: 'none',
  paragraph: 'text',
}

/** Translate the shared/ARIA spelling to NativeScript's narrower role enum. */
export function nativeAccessibilityRole(role?: Role | 'radiogroup'): string | undefined {
  // NativeScript9.1.3 exposes radioButton, but no radio-group container role.
  // GTK's renderer alias preserves this private composite role.
  if (role === 'radiogroup') {
    return 'none'
  }

  return role ? NATIVE_ACCESSIBILITY_ROLES[role] : undefined
}

/** NativeScript's AccessibilityState is a single enum value, unlike the
 *  web's independent ARIA booleans. Priority follows the strongest state. */
export function nativeAccessibilityState(state?: {
  disabled?: boolean
  selected?: boolean
  checked?: boolean | 'mixed'
  pressed?: boolean
  /** ARIA keys with no NS counterpart (busy, expanded, invalid, …) are
   *  accepted and ignored — the enum reports the strongest mapped state. */
  [key: string]: boolean | 'mixed' | undefined
}): AccessibilityStateName | undefined {
  if (state?.disabled) {
    return 'disabled'
  }

  if (state?.selected) {
    return 'selected'
  }

  // NS has no mixed state; Checkbox supplies its textual value fallback.
  // NS has no 'pressed' state — a pressed toggle reports as checked.
  const checked = state?.checked ?? state?.pressed

  if (checked === true) {
    return 'checked'
  }

  if (checked === false) {
    return 'unchecked'
  }

  return undefined
}
