import { describe, expect, it, vi } from 'vitest'

vi.mock('@nativescript/core', () => ({
	Application: {
		on: () => {},
		off: () => {},
		suspendEvent: 'suspend',
		resumeEvent: 'resume',
	},
}))

import {
	accessStatusToPermission,
	captureFailureKind,
	chooseStandardProfile,
	deviceAccessStatusToPermission,
	orientationToRotation,
	panelToFacing,
	selectCameraDevice,
	videoOrientationToOrientation,
} from '../src/session-backend.windows'

// AppCapabilityAccessStatus / DeviceAccessStatus / Panel / rotation values are
// mirrored as plain numbers inside the adapter — these cases pin the mapping
// the WinUI host sees, without needing Windows itself.
describe('windows adapter permission mapping', () => {
	it('maps AppCapabilityAccessStatus to portable statuses', () => {
		expect(accessStatusToPermission(4)).toBe('granted')
		expect(accessStatusToPermission(2)).toBe('denied')
		expect(accessStatusToPermission(0)).toBe('restricted')
		expect(accessStatusToPermission(3)).toBe('notDetermined')
		expect(accessStatusToPermission(1)).toBe('notDeclared')
		expect(accessStatusToPermission(99)).toBe('unknown')
		expect(accessStatusToPermission(undefined)).toBe('unknown')
	})

	it('maps DeviceAccessStatus to portable statuses', () => {
		expect(deviceAccessStatusToPermission(1)).toBe('granted')
		expect(deviceAccessStatusToPermission(2)).toBe('denied')
		expect(deviceAccessStatusToPermission(3)).toBe('restricted')
		expect(deviceAccessStatusToPermission(0)).toBe('notDetermined')
		expect(deviceAccessStatusToPermission(undefined)).toBe('unknown')
	})
})

describe('windows adapter device selection', () => {
	const devices = [
		{ id: 'cam-front', label: 'Front camera', facing: 'front' as const },
		{ id: 'cam-back', label: 'Back camera', facing: 'back' as const },
		{ id: 'cam-usb', label: 'USB webcam' },
	]

	it('maps enclosure panels to facing without fabricating desktop facing', () => {
		expect(panelToFacing(1)).toBe('front')
		expect(panelToFacing(2)).toBe('back')
		expect(panelToFacing(0)).toBeUndefined()
		expect(panelToFacing(6)).toBeUndefined()
	})

	it('honors explicit device ids', () => {
		expect(selectCameraDevice({ deviceId: 'cam-usb' }, devices, undefined)?.id).toBe('cam-usb')
		expect(selectCameraDevice({ deviceId: 'missing' }, devices, undefined)).toBeUndefined()
	})

	it('honors front/back only when a panel reports it', () => {
		expect(selectCameraDevice('front', devices, undefined)?.id).toBe('cam-front')
		expect(selectCameraDevice('back', devices, undefined)?.id).toBe('cam-back')
		expect(selectCameraDevice('front', [devices[2]], undefined)).toBeUndefined()
	})

	it('prefers the OS default then back-facing then first device', () => {
		expect(selectCameraDevice('default', devices, 'cam-usb')?.id).toBe('cam-usb')
		expect(selectCameraDevice('default', devices, undefined)?.id).toBe('cam-back')
		expect(selectCameraDevice(undefined, [devices[2]], undefined)?.id).toBe('cam-usb')
	})
})

describe('windows adapter profile and orientation', () => {
	const profiles = [
		{ width: 1920, height: 1080, frameRate: 30 },
		{ width: 640, height: 480, frameRate: 30 },
		{ width: 1280, height: 720, frameRate: 30 },
	]

	it('selects 720p30 when offered and discloses the fallback otherwise', () => {
		expect(chooseStandardProfile(profiles)).toMatchObject({ width: 1280, height: 720, frameRate: 30 })
		expect(chooseStandardProfile([profiles[0], profiles[1]])).toMatchObject({
			width: 640,
			height: 480,
		})

		expect(chooseStandardProfile([])).toBeUndefined()
	})

	it('maps stored rotation degrees to cardinal orientations', () => {
		expect(videoOrientationToOrientation(0)).toBe('landscapeRight')
		expect(videoOrientationToOrientation(90)).toBe('portrait')
		expect(videoOrientationToOrientation(180)).toBe('landscapeLeft')
		expect(videoOrientationToOrientation(270)).toBe('portraitUpsideDown')
		expect(videoOrientationToOrientation(undefined)).toBe('unspecified')
	})

	it('maps requested orientations to record rotations', () => {
		expect(orientationToRotation('portrait')).toBe(1)
		expect(orientationToRotation('portraitUpsideDown')).toBe(3)
		expect(orientationToRotation('landscapeLeft')).toBe(2)
		expect(orientationToRotation('landscapeRight')).toBe(0)
		expect(orientationToRotation('unspecified')).toBeUndefined()
	})
})

describe('windows adapter failure classification', () => {
	it('maps access denial and busy hardware', () => {
		expect(captureFailureKind({ number: -2147024891 })).toBe('permissionDenied')
		expect(captureFailureKind({ message: 'Access is denied.' })).toBe('permissionDenied')
		expect(captureFailureKind({ code: -2147024814 })).toBe('unavailable')
		expect(captureFailureKind({ message: 'The device is in use' })).toBe('unavailable')
		expect(captureFailureKind({ message: 'No capture devices are available' })).toBe('unavailable')
		expect(captureFailureKind({ message: 'insufficient storage' })).toBe('insufficientStorage')
		expect(captureFailureKind(new Error('something else'))).toBe('captureFailed')
	})
})
