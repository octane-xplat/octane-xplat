import * as core from '@nativescript/core'
import * as animation from '@nativescript/core/animation-frame'
import * as nativeScriptRenderer from '@octane-xplat/nativescript-octane'
import * as octaneClient from 'octane/internal/client'
import * as signals from 'octane/signals'
import * as signalsClient from 'octane/signals/client'
import * as universal from 'octane/universal/native'
import type { nativeScriptDevImports } from './nativescript-dev-imports'

/** Share the shell's Core and Octane instances with every rebuilt app bundle. */
export function installNativeScriptDevModules() {
  const modules = {
    '@nativescript/core': core,
    '@nativescript/core/animation-frame': animation,
    '@octane-xplat/nativescript-octane': nativeScriptRenderer,
    octane: universal,
    'octane/internal/client': octaneClient,
    'octane/signals': signals,
    'octane/signals/client': signalsClient,
    'octane/universal/native': universal,
  } satisfies Record<(typeof nativeScriptDevImports)[number], object>

  Reflect.set(globalThis, '__xplatDevModules', modules)
}
