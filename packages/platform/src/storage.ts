import { Application, ApplicationSettings } from '@nativescript/core'

/** Sync KV seam — NS ApplicationSettings (NSUserDefaults) on native,
 *  the web leaf uses the DOM's string store. String-only for v1;
 *  serialize objects at the edge.
 *
 *  Writes dirty the in-memory cache immediately but reach the platform
 *  store asynchronously (cfprefsd on iOS, the SharedPreferences writer on
 *  Android) — a hard kill before delivery loses them. Pending writes flush
 *  automatically on suspend/exit; call flush() after any write that must
 *  survive termination at an arbitrary point. */
export const storage = {
	getString: (k: string): string | null => ApplicationSettings.getString(k) ?? null,
	setString: (k: string, v: string): void => {
		ApplicationSettings.setString(k, v)
	},
	remove: (k: string): void => {
		ApplicationSettings.remove(k)
	},
	/** Block until pending writes reach the platform store. Returns the
	 *  platform's own confirmation — NSUserDefaults `synchronize` on iOS,
	 *  SharedPreferences `commit` on Android. Safe to call repeatedly;
	 *  with nothing pending it is a cheap no-op. */
	flush: (): boolean => ApplicationSettings.flush(),
}

// Hand pending writes to the platform store before the OS can freeze or
// kill the process — the lifecycle wiring consumers previously hand-rolled.
Application.on(Application.suspendEvent, storage.flush)
Application.on(Application.exitEvent, storage.flush)
