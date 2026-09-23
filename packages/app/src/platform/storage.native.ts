import { ApplicationSettings } from '@nativescript/core';

/** Sync KV seam — NS ApplicationSettings (NSUserDefaults) on native,
 *  the web leaf uses the DOM's string store. String-only for v1;
 *  serialize objects at the edge. */
export const storage = {
	getString: (k: string): string | null => ApplicationSettings.getString(k) ?? null,
	setString: (k: string, v: string): void => { ApplicationSettings.setString(k, v); },
	remove: (k: string): void => { ApplicationSettings.remove(k); },
};
