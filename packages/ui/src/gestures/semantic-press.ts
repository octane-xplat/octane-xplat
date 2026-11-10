import type { PressOptions } from './press'
import type { ActivationEvent, GestureSample } from './types'

export interface SemanticPressProps {
  readonly disabled?: boolean
  readonly accessibilityState?: { readonly disabled?: boolean; readonly readonly?: boolean }
  onPress?(event: ActivationEvent): void
  onDoublePress?(): void
  onLongPress?(): void
  onPressIn?(sample?: GestureSample): void
  onPressOut?(sample?: GestureSample): void
}

/** Mouse/CSS logical units; pan claims still take precedence over press slop. */
export function pressOptions(props: SemanticPressProps): PressOptions {
  return {
    enabled:
      !props.disabled && !props.accessibilityState?.disabled && !props.accessibilityState?.readonly,
    slop: 8,
    longPressDelay: 500,
    onPress: props.onPress,
    onDoublePress: props.onDoublePress,
    onLongPress: props.onLongPress,
    onPressIn: props.onPressIn,
    onPressOut: props.onPressOut,
  }
}
