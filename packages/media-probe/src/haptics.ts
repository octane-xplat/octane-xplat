import { Application, Utils } from '@nativescript/core'

declare const XplatPulsarBridge: any

const androidContext = () => Utils.android.getApplicationContext()

export const playPreset = () => {
	if (Application.android) {
		com.xplat.mediaprobe.PulsarBridge.playPreset(androidContext())
	} else {
		XplatPulsarBridge.playPreset()
	}
}

export const playCustomPattern = () => {
	if (Application.android) {
		com.xplat.mediaprobe.PulsarBridge.playCustomPattern(androidContext())
	} else {
		XplatPulsarBridge.playCustomPattern()
	}
}

export const setRealtime = (value: number) => {
	if (Application.android) {
		com.xplat.mediaprobe.PulsarBridge.setRealtime(androidContext(), value, 0.55)
	} else {
		XplatPulsarBridge.setRealtime(value, 0.55)
	}
}

export const stopRealtime = () => {
	if (Application.android) {
		com.xplat.mediaprobe.PulsarBridge.stopRealtime(androidContext())
	} else {
		XplatPulsarBridge.stopRealtime()
	}
}
