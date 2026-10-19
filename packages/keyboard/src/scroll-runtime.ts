import type { FocusScrollRuntime } from './scroll-runtime-types'
export const scrollRuntime: FocusScrollRuntime = {
	owner: () => null,
	read: () => null,
	write() {},
	watchManual: () => () => {},
}
