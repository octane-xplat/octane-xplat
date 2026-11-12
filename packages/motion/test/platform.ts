export function readReducedMotion() {
  return false
}

export function observeReducedMotion() {
  return () => {}
}

export const clock = {
  now: () => Date.now(),
  request: (callback: () => void) => setTimeout(callback, 16) as any,
  cancel: (id: number) => clearTimeout(id),
}

export const Utils = {
  layout: {
    toDevicePixels: (value: number) => value * 2,
    toDeviceIndependentPixels: (value: number) => value / 2,
  },
}

export const Application = {}

export const isIOS = true
export const isAndroid = false
export const unsetValue = Symbol('unsetValue')
