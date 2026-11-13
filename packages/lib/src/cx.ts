/** Native renderers now normalize the declarative `className` prop, but
 *  imperative `view.className` writes still need a pre-joined string — NS
 *  splits on ' ' only. Native leaves keep normalizing through cx() before
 *  handing className to an intrinsic so both paths accept the same values.
 *  (The DOM renderer already flattens arrays, so web leaves don't need
 *  this.) */
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
