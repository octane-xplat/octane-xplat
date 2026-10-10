import { SharedCameraSession } from './session-core'
import type { BackendPreviewListener } from './session-core'
import { createSessionBackend } from './session-backend'
import { CameraCaptureError } from './types'
import type { CameraSession, CameraSessionConfig } from './types'

/** Create a shared camera owner: one acquisition shared between a
 *  `CameraView` preview (`session` prop) and at most one movie-recording
 *  attempt. Creating a session never prompts for permission or acquires
 *  hardware — both happen when a session-backed preview activates or a
 *  permission request runs.
 *
 *  Recording support is delivered per platform; `capabilities()` reports
 *  honest `supported`/`available` state on every host. */
export function createCameraSession(config: CameraSessionConfig = {}): CameraSession {
	return new SharedCameraSession(createSessionBackend(config), config)
}

/** Package-internal: attach `host` as the session's preview surface.
 *  Used by `CameraView` when its `session` prop is set; detaching the
 *  returned function requests stop on an in-flight attempt and releases
 *  camera ownership once finalization settles. */
export function attachSessionPreview(
	session: CameraSession,
	host: unknown,
	listener?: BackendPreviewListener,
): () => void {
	if (!(session instanceof SharedCameraSession)) {
		throw new CameraCaptureError({
			kind: 'invalidArgument',
			operation: 'attachPreview',
			message: 'session was not created by createCameraSession',
		})
	}

	return session.attach(host, listener)
}
