export function textNativeControl(view: unknown): unknown {
  if (view && typeof view === 'object' && 'nativeViewProtected' in view) {
    return ('nativeTextViewProtected' in view && view.nativeTextViewProtected) || view.nativeViewProtected
  }
  return view
}
