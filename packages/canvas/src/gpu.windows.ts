import { GPU } from '@nativescript/canvas'

type NativeNavigator = { gpu?: GPU }
const host = globalThis as typeof globalThis & { navigator?: NativeNavigator }
let gpu: GPU | undefined

/** The Windows Canvas add-on uses the native GPU singleton via navigator.gpu. */
export function getGPU(): any {
  const navigator = host.navigator
  if (navigator?.gpu instanceof GPU) {
    return navigator.gpu
  }

  gpu ??= new GPU()
  if (navigator) {
    Object.defineProperty(navigator, 'gpu', { value: gpu, configurable: true })
  } else {
    Object.defineProperty(host, 'navigator', { value: { gpu }, configurable: true })
  }
  return gpu
}
