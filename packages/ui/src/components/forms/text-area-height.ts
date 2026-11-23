import type { TextAreaProps } from '../../props'
import { styleRecord } from '../../internal/layout/style-merge'

export type TextAreaSizingProps = Pick<TextAreaProps, 'rows' | 'autoGrow' | 'maxRows' | 'style'>

export function fitTextAreaHeight(
  view: any,
  props: TextAreaSizingProps,
  unsetValue: object,
  lineHeight: () => number,
): () => void {
  if (!view) {
    return () => {}
  }

  const fit = () => {
    const style = styleRecord(props.style)

    if (style?.height != null) {
      view.style.minHeight = style.minHeight ?? unsetValue
      view.style.maxHeight = style.maxHeight ?? unsetValue
      return
    }

    const line = lineHeight()
    const rows = props.rows ?? (props.autoGrow ? 1 : 3)

    view.style.minHeight = style?.minHeight ?? rows * line
    view.style.maxHeight =
      style?.maxHeight ??
      (props.maxRows ? props.maxRows * line : props.autoGrow ? unsetValue : rows * line)
  }

  fit()
  view.on?.('loaded', fit)
  return () => view.off?.('loaded', fit)
}
