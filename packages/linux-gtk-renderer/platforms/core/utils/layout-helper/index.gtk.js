import { Screen } from '@nativescript/core/platform'
import * as common from '@nativescript/core/utils/layout-helper/layout-helper-common'
import * as constants from '@nativescript/core/utils/layout-helper/layout-helper-shared'

export const layout = {
  ...constants,
  ...common,
  getDisplayDensity() {
    return Screen.mainScreen.scale
  },
  toDevicePixels(value) {
    return value * Screen.mainScreen.scale
  },
  toDeviceIndependentPixels(value) {
    return value / Screen.mainScreen.scale
  },
}
