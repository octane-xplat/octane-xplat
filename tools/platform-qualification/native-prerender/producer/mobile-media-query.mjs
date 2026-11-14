// Build-only replacement for css-engine/vendor/media-query.ts. Core9.1.3
// supplies no `hover` input, so this exact positive query never matches there.
// The portable engine defaults to AppKit hover support; do not inherit that.
let evaluator

export const isUnsupportedNativeHover = (query) =>
  /^\s*\(\s*hover\s*:\s*hover\s*\)\s*$/i.test(query)

export function setCssMediaQueryEvaluator(value) {
  evaluator = value
}

export function checkIfMediaQueryMatches(query) {
  if (isUnsupportedNativeHover(query)) {
    return false
  }

  try {
    return evaluator?.(query) ?? false
  } catch {
    return false
  }
}
