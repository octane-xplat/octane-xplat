import { requireArtifact } from './schema.ts'
import type { StartupArtifact } from './schema.ts'

export type LaunchEnvironment = {
  platform: 'ios' | 'android'
  fontScale: number
  reducedMotion: boolean
  width: number
  height: number
}
export type LaunchCompatibility =
  | { supported: true }
  | {
      supported: false
      input: 'platform' | 'fontScale' | 'reducedMotion' | 'width' | 'height'
    }

/** Native consumers implement this same bounded predicate before creating views. */
export function checkLaunchEnvironment(
  artifact: StartupArtifact,
  environment: LaunchEnvironment,
): LaunchCompatibility {
  requireArtifact(
    ['ios', 'android'].includes(environment.platform) &&
      typeof environment.reducedMotion === 'boolean',
    'invalid launch environment',
  )
  for (const value of [environment.fontScale, environment.width, environment.height])
    requireArtifact(Number.isFinite(value) && value >= 0, 'invalid launch dimension or font scale')
  if (artifact.platform !== environment.platform) return { supported: false, input: 'platform' }
  for (const constraint of artifact.constraints) {
    const value = environment[constraint.input]
    if (constraint.input === 'fontScale' || constraint.input === 'reducedMotion') {
      if (value !== constraint.equals) return { supported: false, input: constraint.input }
    } else if (typeof value !== 'number' || value < constraint.min || value > constraint.max)
      return { supported: false, input: constraint.input }
  }
  return { supported: true }
}
