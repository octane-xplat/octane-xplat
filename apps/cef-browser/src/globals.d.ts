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
declare const process: { env: { NODE_ENV?: string }; cwd(): string }
