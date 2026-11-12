// Unsuffixed default (web behavior): the browser ScrollableArea measures its
// own document — no native measuring hook is needed. The .macos leaf carries
// the AppKit frame-observer implementation.
export function usePanelContent(_minHeight: number, _onMeasure: (height: number) => void) {
  return { ref: undefined, viewportRef: undefined }
}
