import type { Plugin, UserConfig } from 'vite'
import {
  css,
  boundary,
  devBridge,
  native,
  nodeEnvDefine,
  xplatCss,
  xplatNative,
} from '@octane-xplat/build/vite'
import type { CssPlatform } from '@octane-xplat/build/vite'
import { macos } from '@octane-xplat/build/macos/vite'
import { linuxGtk } from '@octane-xplat/build/linux-gtk/vite'

const platform: CssPlatform = 'web'
const plugins: Plugin[] = [css(platform), boundary(platform), devBridge()]
const config: UserConfig = { plugins, define: nodeEnvDefine('production') }
const nativeConfig: Promise<UserConfig> = native('production', { extra: config })
const macosConfig: Promise<UserConfig> = macos('production', { packaged: true })
const gtk: Promise<UserConfig> = linuxGtk('production', { fileName: 'app' })
void [nativeConfig, macosConfig, gtk]
// @ts-expect-error The public CSS platform union must survive packing.
css('unknown-platform')

const legacyCss: typeof css = xplatCss
const legacyNative: typeof native = xplatNative
void [legacyCss, legacyNative]
