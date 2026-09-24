// Haptics — Taptic Engine (iOS) / Vibrator (Android) via @nativescript/haptics.
import { Haptics, HapticImpactType, HapticNotificationType } from '@nativescript/haptics';
import type { Capability } from './types';
import type { HapticsImpl } from './types';

export const haptics: Capability<HapticsImpl> = {
	supported: true,
	ensure: async () => 'granted',
	impl: {
		impact: (style = 'light') =>
			Haptics.impact(
				style === 'heavy' ? HapticImpactType.HEAVY
				: style === 'medium' ? HapticImpactType.MEDIUM
				: HapticImpactType.LIGHT,
			),
		notification: (kind) =>
			Haptics.notification(
				kind === 'error' ? HapticNotificationType.ERROR
				: kind === 'warning' ? HapticNotificationType.WARNING
				: HapticNotificationType.SUCCESS,
			),
		selection: () => Haptics.selection(),
	},
};
