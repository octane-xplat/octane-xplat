/** @jsxImportSource @octane-xplat/jsx */
import { useEffect, useRef, useState } from 'octane'
import type { UISwitchProps } from '../props'
import { applyEscapeProps } from '@octane-xplat/lib/escape-props'
import { prepareUIHost, applyUIHostModifiers } from '../internal/platform/ui-host-props'
import { nativeAccessibilityRole, nativeAccessibilityState } from '../internal/accessibility/native-accessibility'

import { useFieldControlProps } from '../components/forms/field-context'

/** UISwitch — the platform widget (UIKit UISwitch via NativeScript `switch`).
 *  OS chrome is the point here; the self-drawn shared `Switch` lives in the
 *  root export. A bare widget: `label`/`description` are spoken, not drawn —
 *  visible field chrome belongs to `Field`. `isDisabled` maps to `isEnabled`;
 *  `isReadOnly` blocks toggling (interaction off, change reverted) while
 *  keeping the enabled appearance. */
export function UISwitch(inputProps: UISwitchProps): unknown @{
  const props = useFieldControlProps(inputProps)
  const el = useRef<any>(null)
  // Last confirmed value for the `isReadOnly` revert — `value` when
  // controlled, the widget's own state otherwise.
  const lastChecked = useRef(props.value ?? props.defaultValue ?? false)
  // A controlled toggle writes the widget's own checked before the event
  // fires; when the owner rejects the change the bound `checked` prop is
  // unchanged and no update is emitted, so the widget stays diverged.
  // Bumping this version re-runs the write below to restore the owner value.
  const [editVersion, setEditVersion] = useState(0)

  // Uncontrolled widgets own their checked state — seed it once; a bound
  // `value` write would fight the user's next toggle on re-render.
  useEffect(() => {
    if (el.current && props.value === undefined && props.defaultValue !== undefined) {
      el.current.checked = props.defaultValue
    }
  }, [])

  useEffect(() => {
    if (el.current && props.value !== undefined) {
      el.current.checked = props.value
    }
  }, [props.value, editVersion])

  <switch
    ref={(v: any) => {
      el.current = v
      void (prepareUIHost(v), applyEscapeProps(v, props), applyUIHostModifiers(v, props))
    }}
    id={props.id}
    testID={props.testID ?? ''}
    className={[props.className]}
    style={props.style}
    checked={props.value}
    isEnabled={!props.isDisabled}
    isUserInteractionEnabled={!props.isReadOnly}
    accessibilityRole={nativeAccessibilityRole('switch')}
    accessibilityLabel={
      props.accessibilityLabel ?? props.ariaLabel ?? props.fieldLabel ?? props.label
    }
    accessibilityHint={props.accessibilityHint}
    accessibilityState={nativeAccessibilityState({ disabled: props.isDisabled })}
    onCheckedChange={(e: any) => {
      // VoiceOver activation can still fire on a non-interactive view —
      // revert so `isReadOnly` means the value truly cannot change.
      if (props.isReadOnly) {
        const expected = props.value ?? lastChecked.current

        if (e.value !== expected) {
          e.object.checked = expected
        }

        return
      }

      lastChecked.current = e.value
      if (props.value !== undefined) {
        setEditVersion((version) => version + 1)
      }

      props.onChange?.(e.value)
    }}
  />
}
