import type { LiteralObject, StartupArtifact } from '@octane-xplat/native-prerender'

export type NativeStartupEnvironment = { width: number; height: number; reducedMotion: boolean }
export type NativeStartupConfiguration = {
  entry: string
  exportName: string
  seed: LiteralObject
  environment: NativeStartupEnvironment
}

export type NativeStartupBuildOptions = {
  projectDir: string
  configurationFile: string
  outputDir: string
  platform: 'ios' | 'android'
}

export type NativeStartupManifest = {
  inputs: Record<string, string>
  missingInputs: string[]
  bundleHashes: Record<string, string>
  normalizedStylesHash: string
  seed: LiteralObject
  environment: NativeStartupEnvironment
  platform: 'ios' | 'android'
  configuration: NativeStartupConfiguration
  buildHash: string
  warnings: string[]
  nativeImports: { importer: string | undefined; request: string }[]
  nativeReads: Record<'light' | 'dark', string[]>
  registrations: string[]
  startupFormat: 'XPI1'
  dimensionQueries: string[]
  startupArtifactHash: string
  logicalNodeCount: number
  scope: string
}

export type NativeStartupBuildResult = {
  directory: string
  artifact: StartupArtifact
  manifest: NativeStartupManifest
}

/** Build in a new/empty output directory. Does not install or launch a native host. */
export function produceNativeStartup(
  options: NativeStartupBuildOptions,
): Promise<NativeStartupBuildResult>
