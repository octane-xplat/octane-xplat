import type { Target } from './types'
export interface HostAdapter {
	read(): Target
	write(values: Target): void
	restore(): void
}
