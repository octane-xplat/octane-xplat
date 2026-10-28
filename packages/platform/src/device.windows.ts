import { Device } from '@nativescript/core'
import type { DeviceInfo } from './types'

/** Native Windows identity; remaining metadata comes from the host's core. */
export const device: DeviceInfo = {
	os: 'windows',
	osVersion: Device.osVersion,
	model: Device.model,
	manufacturer: Device.manufacturer,
	language: Device.language.split(/[-_]/)[0] ?? '',
	region: Device.region,
}
