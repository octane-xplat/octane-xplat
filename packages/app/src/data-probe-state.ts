import { query$, signal$ } from 'octane/signals'

export const dataShared$ = signal$(0)
export const dataModuleRequests: number[] = []
export const dataSharedQuery$ = query$(
	() => dataShared$.get(),
	async (selection) => {
		dataModuleRequests.push(selection)
		return 'module:' + selection
	},
)

export const dataRequests: Array<{
	id: string
	signal: AbortSignal
	resolve: (value: string) => void
	reject: (error: Error) => void
}> = []
