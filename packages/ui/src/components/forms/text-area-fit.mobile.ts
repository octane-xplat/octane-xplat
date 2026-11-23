import { unsetValue, Utils } from '@nativescript/core'
import { fitTextAreaHeight, type TextAreaSizingProps } from './text-area-height'

export function fitTextArea(view: any, props: TextAreaSizingProps): () => void {
  return fitTextAreaHeight(view, props, unsetValue, () => {
    const iosLine = view.ios?.font?.lineHeight
    const androidLine = view.android?.getLineHeight?.()

    return iosLine > 0
      ? iosLine
      : androidLine > 0
        ? Utils.layout.toDeviceIndependentPixels(androidLine)
        : 24
  })
}
