// Locale — Device.language/region on native.
import { Device } from '@nativescript/core';
import type { Locale } from './locale.web';

export const locale: Locale = {
	tag: `${Device.language}-${Device.region}`,
	language: Device.language.split('-')[0] ?? '',
	region: Device.region,
};
