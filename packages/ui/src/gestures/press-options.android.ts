import { Utils } from '@nativescript/core'
import { pressOptions as mouseOptions, type SemanticPressProps } from './semantic-press'
import type { PressOptions } from './press'

export function pressOptions(props: SemanticPressProps): PressOptions {
  const configuration = android.view.ViewConfiguration.get(Utils.ad.getApplicationContext())

  return {
    ...mouseOptions(props),
    slop: configuration.getScaledTouchSlop() / Utils.layout.getDisplayDensity(),
  }
}
