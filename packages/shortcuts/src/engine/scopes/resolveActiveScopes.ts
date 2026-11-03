export function resolveActiveScopes(getActiveScopes?: () => Iterable<string>): string[] {
  const scopes = getActiveScopes ? [...getActiveScopes()] : []
  const uniqueScopes = [...new Set(scopes.filter((scope) => scope !== 'root' && scope.length > 0))]
  uniqueScopes.push('root')
  return uniqueScopes
}

export function pickMatchedScope(
  bindingScopes: readonly string[],
  activeScopes: readonly string[],
): string | null {
  for (const scope of activeScopes) {
    if (bindingScopes.includes(scope)) {
      return scope
    }
  }
  return null
}
