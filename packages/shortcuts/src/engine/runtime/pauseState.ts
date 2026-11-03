export class PauseState {
  private pauseAllCount = 0
  private readonly pauseCounts = new Map<string, number>()

  pause(scope?: string): void {
    if (scope == null) {
      this.pauseAllCount += 1
      return
    }
    this.pauseCounts.set(scope, (this.pauseCounts.get(scope) ?? 0) + 1)
  }

  resume(scope?: string): void {
    if (scope == null) {
      this.pauseAllCount = Math.max(0, this.pauseAllCount - 1)
      return
    }
    const current = this.pauseCounts.get(scope) ?? 0
    if (current <= 1) {
      this.pauseCounts.delete(scope)
    } else {
      this.pauseCounts.set(scope, current - 1)
    }
  }

  applyToScopes(scopes: readonly string[]): string[] {
    if (this.pauseAllCount > 0) {
      return []
    }
    return scopes.filter((scope) => (this.pauseCounts.get(scope) ?? 0) === 0)
  }

  clear(): void {
    this.pauseAllCount = 0
    this.pauseCounts.clear()
  }
}
