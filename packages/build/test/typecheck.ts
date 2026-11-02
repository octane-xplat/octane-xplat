import type { Plugin, UserConfig } from 'vite'
import { xplatCss, xplatBoundary, xplatDevBridge, xplatNative, xplatNodeEnvDefine } from '@octane-xplat/build/vite'
import type { CssPlatform } from '@octane-xplat/build/vite'
import { xplatMacOS } from '@octane-xplat/build/macos/vite'
import { xplatLinuxGtk } from '@octane-xplat/build/linux-gtk/vite'

const platform: CssPlatform = 'web'
const plugins: Plugin[] = [xplatCss(platform), xplatBoundary(platform), xplatDevBridge()]
const config: UserConfig = { plugins, define: xplatNodeEnvDefine('production') }
const native: Promise<UserConfig> = xplatNative('production', { extra: config })
const macos: Promise<UserConfig> = xplatMacOS('production', { packaged: true })
const gtk: Promise<UserConfig> = xplatLinuxGtk('production', { fileName: 'app' })
void [native, macos, gtk]
// @ts-expect-error The public CSS platform union must survive packing.
xplatCss('unknown-platform')
