import type { DeviceInfo } from './device';

const ua = navigator.userAgent;
const osVersion = ua.match(/(?:Mac OS X|Windows NT|Android|OS) ([\d._]+)/)?.[1]?.replace(/_/g, '.') ?? '';

export const device: DeviceInfo = {
	os: 'web',
	osVersion,
	model: 'browser',
	manufacturer: '',
	language: navigator.language.split('-')[0] ?? '',
	region: navigator.language.split('-')[1] ?? '',
};
