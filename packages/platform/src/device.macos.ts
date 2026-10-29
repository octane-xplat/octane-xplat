import type { DeviceInfo } from './types'
import { locale } from './locale.macos'

/** AppKit identity. Hardware model and OS version discovery remain outside this subset. */
export const device: DeviceInfo = {
	os: 'macos',
	osVersion: 'unknown',
	model: 'Mac',
	manufacturer: 'Apple',
	language: locale.language,
	region: locale.region,
}
