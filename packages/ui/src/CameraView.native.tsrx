/** @jsxImportSource @nativescript-community/octane */
import { useCallback, useEffect, useRef, useState } from 'octane';
import { registerElement } from '@nativescript-community/octane';
import type { Attributes } from '@nativescript-community/octane/intrinsics';
import { isAndroid } from '@nativescript/core';
import { CameraPlus } from '@nstudio/nativescript-camera-plus';
import type { CameraViewHandle, CameraViewProps } from './props';
import { cx } from './cx';
import { applyEscapeProps, nativeAccessibilityRole, nativeAccessibilityState } from './escape-props';
import { layoutChildProps } from './layout-child.native';
import { cameraHardwarePresent, ensureCameraPermission } from './camera-permission.native';

declare module '@nativescript-community/octane/intrinsics' {
	interface NativeScriptElements {
		cameraplus: Attributes<typeof CameraPlus>;
	}
}

// @nstudio/nativescript-camera-plus — CameraX FancyCamera on Android,
// SwiftyCam (AVCaptureSession preview) on iOS. It is a required peer: this
// leaf sits in the shared native barrel, so every native app must declare
// the plugin for the /ns/m dev bridge to resolve it under the app root.
registerElement('cameraplus', CameraPlus);

/** CameraView — live preview only. The leaf gates the plugin view on a
 *  granted camera permission, so `active={false}` and denial both leave an
 *  empty frame. Chrome is reset: the plugin's flash/toggle/capture/gallery
 *  buttons are switched off — preview pixels only. `facing` flips through
 *  `toggleCamera` (the plugin constructs rear-only;
 *  `CameraPlus.defaultCamera` is a pre-constructor static the driver can't
 *  reach). onReady maps the NS `loaded` event — the nearest shared
 *  "surface live" signal the plugin offers. */
export function CameraView(props: CameraViewProps) @{
	const host = useRef<any>(null);
	const wired = useRef<any>(null);
	// The plugin always constructs on the rear lens; the first flips are
	// tracked here so a prop write becomes one toggleCamera call.
	const currentFacing = useRef<'front' | 'back'>('back');
	const [granted, setGranted] = useState(false);
	const facing = props.facing ?? 'back';
	const active = props.active !== false;

	// Stable identity — an inline closure re-fires ref(null)/ref(v) per
	// render, which would bounce host.current around the effects below.
	const bindHost = useCallback((v: any) => {
		host.current = v;
	}, []);

	useEffect(() => {
		if (!active) {
			setGranted(false);
			return;
		}

		if (!cameraHardwarePresent()) {
			props.onError?.({ message: 'camera unsupported' });
			return;
		}

		let alive = true;
		ensureCameraPermission().then((ok) => {
			if (!alive) return;
			setGranted(ok);
			if (!ok) props.onError?.({ message: 'camera permission denied' });
		});

		return () => {
			alive = false;
		};
	}, [active]);

	useEffect(() => {
		const cam = host.current;
		if (!cam || wired.current === cam) return;
		wired.current = cam;
		// Not a typed JSX attr on CameraPlus — set it imperatively.
		cam.doubleTapCameraSwitch = false;
		applyEscapeProps(cam, props);
		props.bind?.({ native: cam } satisfies CameraViewHandle);
		// Permission was granted before the view existed, so the plugin's
		// permission-result listener can never fire — nudge the preview.
		if (isAndroid) {
			try {
				cam.camera?.startPreview?.();
			} catch {}
		}
	});

	// Lens flips — fires whenever `facing` diverges from the live camera.
	useEffect(() => {
		const cam = host.current;
		if (!cam || facing === currentFacing.current) return;
		currentFacing.current = facing;
		try {
			cam.toggleCamera?.();
		} catch {}
	});

	<gridlayout
		id={props.id}
		rows="*"
		columns="*"
		className={cx('vx-stack', 'vx-cameraview', props.className)}
		style={props.style}
		{...layoutChildProps(props)}
		accessible={props.accessible}
		accessibilityLabel={props.accessibilityLabel}
		accessibilityRole={nativeAccessibilityRole(props.accessibilityRole) as any}
		accessibilityHint={props.accessibilityHint}
		accessibilityValue={props.accessibilityValue}
		accessibilityState={nativeAccessibilityState(props.accessibilityState) as any}
		accessibilityLiveRegion={props.accessibilityLiveRegion as any}
	>
		@if (active && granted) {
			<cameraplus
				ref={bindHost}
				showFlashIcon={false}
				showToggleIcon={false}
				showCaptureIcon={false}
				showGalleryIcon={false}
				confirmPhotos={false}
				saveToGallery={false}
				onLoaded={() => props.onReady?.()}
				onError={(e: any) =>
					props.onError?.({
						message: e?.message ?? e?.data?.message ?? 'camera error',
					})
				}
			/>
		}
	</gridlayout>
}
