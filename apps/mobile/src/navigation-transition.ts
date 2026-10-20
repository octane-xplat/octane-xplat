import { FadeTransition } from '@nativescript/core'
/** Source-check fallback; device builds select the audited OS leaf. */
export function createFixtureTransition() {
	return new FadeTransition(100)
}
