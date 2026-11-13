import { Utils } from '@nativescript/core'
import { pressOptions as mouseOptions, type SemanticPressProps } from './semantic-press'
import type { PressOptions } from './press'

export function pressOptions(props: SemanticPressProps): PressOptions {
  return {
    ...mouseOptions(props),
    resolveSlop() {
      const configuration = android.view.ViewConfiguration.get(Utils.ad.getApplicationContext())

      return configuration.getScaledTouchSlop() / Utils.layout.getDisplayDensity()
    },
  }
}
