/** Sync KV seam — localStorage on web. */
export const storage = {
	getString: (k: string): string | null => localStorage.getItem(k),
	setString: (k: string, v: string): void => { localStorage.setItem(k, v); },
	remove: (k: string): void => { localStorage.removeItem(k); },
};
