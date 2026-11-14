import type { Driver } from './types'
import type { DriverBindings } from './driver-contract'
import { createNativeHarnessDriver } from './native-driver'

export function createHarnessDriver(bindings: DriverBindings): Driver {
  return createNativeHarnessDriver(bindings, 'macos')
}
