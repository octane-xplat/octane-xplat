import { produceNativeStartup } from '@octane-xplat/native-prerender-build'
import type {
  NativeStartupBuildOptions,
  NativeStartupBuildResult,
} from '@octane-xplat/native-prerender-build'

const options: NativeStartupBuildOptions = {
  projectDir: '/app',
  configurationFile: 'startup.json',
  outputDir: '/build/startup',
  platform: 'android',
}

const result: Promise<NativeStartupBuildResult> = produceNativeStartup(options)

void result

// @ts-expect-error This producer targets the native mobile host contract.
const web: NativeStartupBuildOptions = { ...options, platform: 'web' }

void web
