declare const XplatPulsarBridge: any

export const playPreset = () => {
  XplatPulsarBridge.playPreset()
}

export const playCustomPattern = () => {
  XplatPulsarBridge.playCustomPattern()
}

export const setRealtime = (value: number) => {
  XplatPulsarBridge.setRealtime(value, 0.55)
}

export const stopRealtime = () => {
  XplatPulsarBridge.stopRealtime()
}
