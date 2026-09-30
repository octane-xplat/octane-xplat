/** @jsxImportSource @nativescript-community/octane */
import { use, useState } from 'octane'
import { signal$, skip, query$, type QueryContext, type QuerySignal } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'

export function Profile(props: { id: string; load: (id: string, context: QueryContext<string>) => Promise<string>; nextId?: string }) @{
	const selection$ = useSignal$(props.id)
	const profile$ = query$(() => selection$.get(), props.load)
	const state = profile$.snapshot()

	<>
		<label text={`${selection$.get()}:${state.status}:${profile$.latest('none')}:${state.refreshing}`} />
		<button text="retry" onTap={() => profile$.retry({ pending: true })} />
		<button text="refetch" onTap={() => profile$.refetch()} />
		<button text="reset" onTap={() => profile$.reset()} />
		<button text="select" onTap={() => selection$.set(props.nextId ?? props.id)} />
	</>
}


export const sharedSelection$ = signal$('')
export const sharedCalls: Array<{ id: string; signal: AbortSignal; resolve: (value: string) => void }> = []
const shared$ = query$(
	() => sharedSelection$.get() || skip,
	(id, { signal }) => new Promise<string>((resolve) => { sharedCalls.push({ id, signal, resolve }) }),
)

export function Reader(props: { onRender: () => void }) @{
	props.onRender()

	<label text={`${sharedSelection$.get()}:${shared$.snapshot().status}:${shared$.latest('none')}`} />
}

export function Retained(props: { pending: Promise<string>; fail: () => void }) @{
	const [pending, setPending] = useState<Promise<string> | null>(null)

	<>
		@try {
			const value = pending === null ? 'ready' : use(pending)
			<button text={value} onTap={() => setPending(props.pending)} />
		} @pending {
			<label text="pending" />
		}
		<button text="throw" onTap={props.fail} />
	</>
}

function QueryChild(props: { result$: QuerySignal<string> }) @{
	<label text={props.result$.latest('none')} />
}

export function NestedProfile(props: { load: (id: string, context: QueryContext<string>) => Promise<string> }) @{
	const result$ = query$(() => 'nested', props.load)
	const snapshot = result$.snapshot()

	<>
		<label text={snapshot.status} />
		<QueryChild result$={result$} />
	</>
}

export function SuspenseProfile(props: { load: (id: string, context: QueryContext<string>) => Promise<string> }) @{
	const result$ = query$(() => 'boundary', props.load)

	@try {
		<label text={result$.get()} />
	} @pending {
		<label text="pending" />
	} @catch (error, reset) {
		<button text={(error as Error).message} onTap={() => { result$.retry({ pending: true }); reset() }} />
	}
}
