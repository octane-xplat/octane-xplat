/** @jsxImportSource @nativescript-community/octane */
import { signal$, skip } from 'octane/signals'
import { useSignal$ } from 'octane/signals/client'
import { cachedQuery$ } from '../src/query-cache'

export interface ProbeRequest {
	id: string
	signal: AbortSignal
	resolve: (value: string) => void
	reject: (error: Error) => void
}

// Module-level shared cached query: one document cell for every root, plus
// the shared cache entry underneath it.
export const sharedSelection$ = signal$('a')
export const sharedCalls: ProbeRequest[] = []
export const shared$ = cachedQuery$(
	['shared-profile'],
	() => sharedSelection$.get() || skip,
	(id: string, { signal }: { signal: AbortSignal }) =>
		new Promise<string>((resolve, reject) => sharedCalls.push({ id, signal, resolve, reject })),
)

export function SharedReader(props: { label?: string }) @{
	const snap = shared$.snapshot()

	<label text={`${props.label ?? 'root'}:${sharedSelection$.get()}:${snap.status}:${shared$.latest('none')}:${snap.refreshing}`} />
}

// Instance-scoped declarations: each mounted ProfileView owns its cell and
// selection; the cache entry is what two same-param screens share.
export function InstanceProfile(props: {
	id: string
	load: (id: string, context: { signal: AbortSignal; previous?: string }) => Promise<string>
}) @{
	const profile$ = cachedQuery$(['profile'], () => props.id, props.load)
	const snap = profile$.snapshot()

	<label text={`${props.id}:${snap.status}:${profile$.latest('none')}:${snap.refreshing}`} />
}

export function SwitchableProfile(props: {
	load: (id: string, context: { signal: AbortSignal; previous?: string }) => Promise<string>
	next: () => string
}) @{
	const selection$ = useSignal$('a')
	const profile$ = cachedQuery$(['switchable'], () => selection$.get(), props.load)
	const snap = profile$.snapshot()

	<>
		<label text={`${selection$.get()}:${snap.status}:${profile$.latest('none')}`} />
		<button text="next" onTap={() => selection$.set(props.next())} />
	</>
}
