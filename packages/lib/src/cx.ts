/** Native renderers now normalize the declarative `className` prop, but
 *  imperative `view.className` writes still need a pre-joined string — NS
 *  splits on ' ' only. Declarative className accepts arrays on the DOM
 *  and native renderers. */
export function cx(...parts: unknown[]): string {
  const names: string[] = []
  const append = (part: unknown): void => {
    if (!part) return
    if (typeof part === 'string' || typeof part === 'number') {
      names.push(String(part))
    } else if (Array.isArray(part)) {
      for (const value of part) append(value)
    } else if (typeof part === 'object') {
      for (const [name, enabled] of Object.entries(part)) {
        if (enabled) names.push(name)
      }
    }
  }
  for (const part of parts) append(part)
  return names.join(' ')
}
