export function nativeAccessibilityRole(role?: string): string | undefined {
  return role
}

export function nativeAccessibilityState(
  state?: Record<string, boolean | undefined>,
): Record<string, boolean | undefined> | undefined {
  return state
}
