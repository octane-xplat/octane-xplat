/** Web twin — controlled text writes are DOM value assignments; the browser
 *  keeps the selection on unchanged prefixes itself. Present for
 *  platform-suffix parity; the native leaves are the only callers. */

/** DOM value writes never echo back as input events, so there is no
 *  synchronous echo to suppress. */
export function isWritingText(_view: unknown): boolean {
  return false
}

export function writeText(view: any, value: string | undefined | null): void {
  if (!view) {
    return
  }

  const next = value ?? ''

  if (view.text !== next) {
    view.text = next
  }
}
