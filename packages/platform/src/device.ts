/** Shared device-info shape — value-level read, no hooks. */
export interface DeviceInfo {
	os: 'web' | 'ios' | 'android';
	osVersion: string;
	model: string;
	manufacturer: string;
	language: string;
	region: string;
}
