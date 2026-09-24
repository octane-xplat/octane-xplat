// Haptics — web leaf. navigator.vibrate exists on Android Chrome only;
// iOS Safari and desktop report unsupported via the Capability contract.
import type { Capability } from './types';

export interface HapticsImpl {
	impact(style?: 'light' | 'medium' | 'heavy'): void;
	notification(kind: 'success' | 'warning' | 'error'): void;
	selection(): void;
}

const vibrate = (ms: number | number[]) =>
	typeof navigator !== 'undefined' && 'vibrate' in navigator && navigator.vibrate(ms);

export const haptics: Capability<HapticsImpl> = {
	supported: typeof navigator !== 'undefined' && 'vibrate' in navigator,
	ensure: async () => ('vibrate' in navigator ? 'granted' : 'unsupported'),
	impl: {
		impact: (style) => vibrate(style === 'heavy' ? 30 : style === 'medium' ? 20 : 10),
		notification: (kind) => vibrate(kind === 'error' ? [50, 60, 50] : kind === 'warning' ? [30, 40, 30] : 15),
		selection: () => vibrate(5),
	},
};
