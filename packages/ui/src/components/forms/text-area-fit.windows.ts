import type { TextAreaProps } from '../../props'
import { styleRecord } from '../../internal/layout/style-merge'

/** Windows NativeScript row-fit: view.ios/.android are absent on the WinUI
 * host, so the 24dip fallback line applies. Kept self-contained — platform
 * leaves may not import another platform's suffixed module. */
export function fitTextArea(
  view: any,
  props: Pick<TextAreaProps, 'rows' | 'autoGrow' | 'maxRows' | 'style'>,
): () => void {
  if (!view) {
    return () => {}
  }

  const fit = () => {
    const style = styleRecord(props.style)

    if (style?.height != null) {
      view.style.minHeight = style.minHeight
      view.style.maxHeight = style.maxHeight
      return
    }

    const line = 24
    const rows = props.rows ?? (props.autoGrow ? 1 : 3)

    view.style.minHeight = style?.minHeight ?? rows * line
    view.style.maxHeight =
      style?.maxHeight ??
      (props.maxRows ? props.maxRows * line : props.autoGrow ? undefined : rows * line)
  }

  fit()
  view.on?.('loaded', fit)
  return () => view.off?.('loaded', fit)
}
