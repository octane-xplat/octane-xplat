import type { TweakValue } from '../protocol.ts'

/**
 * Serialize a tweak value as a source literal. Strings preserve the original
 * quote style (' or ") and escape their delimiter plus control characters.
 * Numbers go through String(n) — negative values included.
 */
export function serializeLiteral(value: TweakValue, quote: "'" | '"' = '"'): string {
  if (typeof value === 'number') {
    return String(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  const escaped = value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')
    .replace(quote === "'" ? /'/g : /"/g, quote === "'" ? "\\'" : '\\"')

  return `${quote}${escaped}${quote}`
}
