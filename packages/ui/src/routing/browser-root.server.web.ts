import type { createRoot as createBrowserRoot } from 'octane'

export const createRoot: typeof createBrowserRoot = () => {
	throw new Error('Browser overlay roots cannot be created during server rendering')
}
