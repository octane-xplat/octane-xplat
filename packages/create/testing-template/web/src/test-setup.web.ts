import { vi } from 'vitest'

// jsdom has no system color-scheme producer. Keep component tests in light mode.
globalThis.matchMedia ??= (query: string) => ({
	media: query,
	matches: false,
	onchange: null,
	addListener() {},
	removeListener() {},
	addEventListener() {},
	removeEventListener() {},
	dispatchEvent: () => true,
})

// Node 26 also exposes a host localStorage getter. Use jsdom's window storage.
declare const jsdom: { window: Window }
vi.stubGlobal('localStorage', jsdom.window.localStorage)
