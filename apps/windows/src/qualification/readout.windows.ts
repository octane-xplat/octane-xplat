import { Application, Image, TextBase, type View } from '@nativescript/core'

// The preview returns ViewCommon children; registry Core returns View.
type ChildView = Parameters<Parameters<View['eachChildView']>[0]>[0]

/** Numeric host readout complements UIA; it does not establish accessibility. */
export function layoutReadout() {
  const nodes: Record<string, unknown>[] = []
  const visit = (view: ChildView, parent: number | null) => {
    const index = nodes.length
    const location = view.getLocationOnScreen()
    const size = view.getActualSize()
    const preferred = (globalThis as Record<string, any>).NativeScript?.Widgets?.FlexboxLayout
    const native = view.nativeViewProtected as any
    nodes.push({
      index,
      parent,
      id: view.id,
      className: view.className,
      type: view.constructor.name,
      text: view instanceof TextBase ? view.text : undefined,
      label: view.accessibilityLabel,
      requestedWidth: view.width,
      requestedHeight: view.height,
      preferredChildCount: (view as any)._preferredChildren?.size,
      preferredSize:
        view.id?.startsWith('core20-auto-child-') &&
        typeof preferred?.GetPreferredWidth === 'function' &&
        typeof preferred?.GetPreferredHeight === 'function'
          ? {
              width: preferred.GetPreferredWidth(native),
              height: preferred.GetPreferredHeight(native),
              hardWidth: Number(native.Width),
              hardHeight: Number(native.Height),
            }
          : undefined,
      masonWidth: (view as any)._styleHelper?.width,
      image:
        view instanceof Image
          ? {
              width: view.imageSource?.width ?? 0,
              height: view.imageSource?.height ?? 0,
              isLoading: view.isLoading,
              // Sync byte sources retain zero ImageSource dimensions on Windows.
              // Inspect the actual native bitmap to establish successful decode.
              nativeWidth: Number((view as any).windows?.Source?.PixelWidth ?? 0),
              nativeHeight: Number((view as any).windows?.Source?.PixelHeight ?? 0),
            }
          : undefined,
      box: location
        ? { x: location.x, y: location.y, width: size.width, height: size.height }
        : null,
    })
    view.eachChildView((child) => {
      visit(child, index)
      return true
    })
  }
  const root = Application.getRootView()
  if (root) {
    visit(root, null)
  }
  return nodes
}
