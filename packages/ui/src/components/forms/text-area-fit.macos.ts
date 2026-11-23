import { unsetValue } from '@nativescript/core'
import type { NSTextView } from '@octane-xplat/platform/macos'
import { fitTextAreaHeight, type TextAreaSizingProps } from './text-area-height'

export function fitTextArea(
  view: { nativeTextViewProtected?: NSTextView } | undefined,
  props: TextAreaSizingProps,
): () => void {
  return fitTextAreaHeight(view, props, unsetValue, () => {
    const editor = view?.nativeTextViewProtected
    const font = editor?.font
    return (font && editor?.layoutManager?.defaultLineHeightForFont(font)) || 24
  })
}
