import { Device } from '@nativescript/core';
import type { DeviceInfo } from './types';

export const device: DeviceInfo = {
	os: Device.os.toLowerCase() === 'ios' ? 'ios' : 'android',
	osVersion: Device.osVersion,
	model: Device.model,
	manufacturer: Device.manufacturer,
	language: Device.language.split('-')[0] ?? '',
	region: Device.region,
};
