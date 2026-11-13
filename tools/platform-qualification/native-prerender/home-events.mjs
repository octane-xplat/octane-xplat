/** Select only a complete, still-live Activity generation. Late receipts from
 * retired generations cannot complete or supersede the current one. */
export function completedHomeEpoch(events, requireParity) {
  const epochs = events
    .map((event) => event.epoch)
    .filter((epoch) => Number.isInteger(epoch) && epoch > 0)
  if (!epochs.length) return undefined
  const epoch = Math.max(...epochs)
  const current = events.filter((event) => event.epoch === epoch)
  if (current.some((event) => event.event === 'activity-destroyed')) return undefined
  if (!current.some((event) => event.event === 'passed' && event.nativeHomeMountQualified))
    return undefined
  if (
    requireParity &&
    !current.some((event) => event.event === 'home-proof' && event.phase === 'parity')
  )
    return undefined
  return epoch
}
