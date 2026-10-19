export interface FocusScrollRuntime {
	owner(host: object): object | null
	read(owner: object): number | null
	write(owner: object, offset: number): void
	watchManual(host: object, listener: () => void): () => void
}
