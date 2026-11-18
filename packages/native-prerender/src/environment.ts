import { requireArtifact } from './schema.ts'
import type { LiteralObject, SafeAreaInsetInput, StartupArtifact, StartupTree } from './schema.ts'

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

/**
 * Resolve declared launch inputs and pick the matching prerendered tree.
 * `resolve` returns the persisted value for a declared input name, or
 * `null`/`undefined` when the key is absent; an absent key resolves to the
 * declaration's `default`. Returns `null` when the effective values match no
 * bind — callers must fall back to JavaScript boot, never pick another tree.
 * For flat artifacts (no launch inputs) the resolver is never invoked.
 */
export function selectLaunchTree(
  artifact: StartupArtifact,
  resolve: (name: string) => string | null | undefined,
): StartupTree | null {
  if (!artifact.trees) {
    return {
      bind: Object.create(null) as LiteralObject,
      nodes: artifact.nodes,
      variants: artifact.variants,
    }
  }
  const launchInputs = artifact.launchInputs
  const effective = Object.create(null) as Record<string, string | null>
  for (const input of launchInputs) {
    const stored = resolve(input.name)
    requireArtifact(
      stored === null || stored === undefined || typeof stored === 'string',
      'launch input resolution must return a string or null',
    )
    effective[input.name] = stored ?? input.default
  }
  return (
    artifact.trees.find((tree) =>
      launchInputs.every((input) => tree.bind[input.name] === effective[input.name]),
    ) ?? null
  )
}
