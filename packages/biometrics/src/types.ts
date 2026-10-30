/** Biometric verification façade (Face ID / Touch ID / Android BIOMETRIC_STRONG). */
export interface BiometricsImpl {
	/** Prompt the user for biometric verification, showing `reason` as the
	 *  dialog title/message. Resolves false on failure, cancel, or lockout —
	 *  it does not reject. Only one prompt runs at a time; overlapping calls
	 *  resolve false immediately rather than queuing. */
	verify(reason: string): Promise<boolean>
}

export { UnavailabilityError } from '@octane-xplat/lib/capability'
export type {
	Permissioned,
	PermissionResponse,
	PermissionStatus,
	Service,
} from '@octane-xplat/lib/capability'
