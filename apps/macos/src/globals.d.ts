interface Console {
	log(...data: unknown[]): void
	info(...data: unknown[]): void
	warn(...data: unknown[]): void
	error(...data: unknown[]): void
	debug(...data: unknown[]): void
}

declare const console: Console
declare function setTimeout(callback: (...args: unknown[]) => void, delay?: number): number
declare function clearTimeout(handle?: number): void
declare function setInterval(callback: (...args: unknown[]) => void, delay?: number): number
declare function clearInterval(handle?: number): void

interface ImportMeta {
	glob<T = unknown>(patterns: string | string[], options?: { eager?: boolean }): Record<string, T>
}
