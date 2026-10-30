/** Key-value secure storage façade (iOS Keychain / Android Keystore-backed
 *  shared preferences on native). */
export interface SecureStore {
	/** Read a stored value; resolves null when the key is absent. */
	get(key: string): Promise<string | null>
	/** Write a value; resolves false rather than rejecting on store failure. */
	set(key: string, value: string): Promise<boolean>
	/** Delete a key; resolves false when removal fails. */
	remove(key: string): Promise<boolean>
}
