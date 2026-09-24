// Runtime permissions — web leaf. Browsers grant most capabilities per-API
// (clipboard/notification have their own ensure()); this generic seam covers
// feature-detection for the rest.
export type PermissionKind = 'notifications' | 'camera' | 'photos' | 'location';

export const permissions = {
	async ensure(kind: PermissionKind): Promise<'granted' | 'denied' | 'unsupported'> {
		switch (kind) {
			case 'notifications': {
				if (typeof Notification === 'undefined') return 'unsupported';
				if (Notification.permission === 'granted') return 'granted';
				if (Notification.permission === 'denied') return 'denied';
				return (await Notification.requestPermission()) === 'granted' ? 'granted' : 'denied';
			}
			case 'camera':
			case 'photos': {
				if (!navigator.mediaDevices?.getUserMedia) return 'unsupported';
				try {
					const s = await navigator.mediaDevices.getUserMedia({ video: true });
					s.getTracks().forEach((t) => t.stop());
					return 'granted';
				} catch {
					return 'denied';
				}
			}
			case 'location': {
				if (!('geolocation' in navigator)) return 'unsupported';
				return new Promise((resolve) =>
					navigator.geolocation.getCurrentPosition(
						() => resolve('granted'),
						(e) => resolve(e.code === e.PERMISSION_DENIED ? 'denied' : 'unsupported'),
						{ timeout: 15000 },
					),
				);
			}
		}
	},
};
