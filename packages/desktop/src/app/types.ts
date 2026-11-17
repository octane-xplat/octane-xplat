/** Release handle returned by {@link keepAppResident}. */
export interface AppResidency {
  /** End the residency hold and restore window flags. Idempotent. */
  release(): void
}
