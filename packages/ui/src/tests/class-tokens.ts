/** Flatten native className strings and nested arrays into exact class tokens. */
export function classTokens(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.trim().split(/\s+/).filter(Boolean)
  }

  if (Array.isArray(value)) {
    return value.flatMap(classTokens)
  }

  return []
}

export function hasClassToken(value: unknown, token: string): boolean {
  return classTokens(value).includes(token)
}
