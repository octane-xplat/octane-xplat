import { requireArtifact } from './schema.ts'
import type { SafeAreaInsetInput, StartupArtifact } from './schema.ts'

export type SafeAreaInsets = { top: number; right: number; bottom: number; left: number }
export type LaunchEnvironment = {
  platform: 'ios' | 'android'
  fontScale: number
  reducedMotion: boolean
  width: number
  height: number
  safeAreaInsets?: SafeAreaInsets
}
export type LaunchCompatibility =
  | { supported: true }
  | {
      supported: false
      input:
        | 'platform'
        | 'fontScale'
        | 'reducedMotion'
        | 'width'
        | 'height'
        | SafeAreaInsetInput
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
    {requireArtifact(Number.isFinite(value) && value >= 0, 'invalid launch dimension or font scale')}
  if (artifact.platform !== environment.platform) {return { supported: false, input: 'platform' }}
  for (const constraint of artifact.constraints) {
    if (constraint.input === 'fontScale' || constraint.input === 'reducedMotion') {
      if (environment[constraint.input] !== constraint.equals)
        {return { supported: false, input: constraint.input }}
    } else if (constraint.input === 'width' || constraint.input === 'height') {
      const value = environment[constraint.input]
      if (typeof value !== 'number' || value < constraint.min || value > constraint.max)
        {return { supported: false, input: constraint.input }}
    } else {
      const safeArea = constraint as { input: SafeAreaInsetInput; equals: number }
      const edge = safeArea.input.slice(8).toLowerCase() as keyof SafeAreaInsets
      if (environment.safeAreaInsets?.[edge] !== safeArea.equals)
        {return { supported: false, input: safeArea.input }}
    }
  }
  return { supported: true }
}
