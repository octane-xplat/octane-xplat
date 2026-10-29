import type { HostedAuth } from '@octane-xplat/auth'
import { createStore } from '@octane-xplat/ui/data'

export interface AccountState {
	status: 'checking' | 'anonymous' | 'authenticated' | 'error' | 'unsupported'
	subject: string | null
	authority: number
	message: string
	needsSignOutRetry: boolean
}

/** App-owned UI state. Instantiate once per application session owner. */
export function createAccountSession(auth: HostedAuth) {
	const state = createStore<AccountState>({
		status: 'checking',
		subject: null,
		authority: 0,
		message: 'Checking sign-in…',
		needsSignOutRetry: false,
	})
	let generation = 0
	let clearingCredentials = false
	const signedOut = (message: string, status: AccountState['status'] = 'anonymous') => {
		state.update((previous) => ({
			status,
			subject: null,
			authority: previous.authority + 1,
			message,
			needsSignOutRetry: false,
		}))
	}
	async function loadAccount(owner: number) {
		const response = await auth.fetch('/api/me')
		if (owner !== generation) {return}
		if (response.status === 401) {
			await signOut()
			return
		}
		if (!response.ok) {throw new Error('Account service unavailable')}
		const account: unknown = await response.json()
		if (owner !== generation) {return}
		if (
			typeof account !== 'object' ||
			account === null ||
			!('subject' in account) ||
			typeof account.subject !== 'string' ||
			!account.subject
		)
			{throw new Error('Invalid account response')}
		const subject = account.subject
		state.update((previous) => ({
			status: 'authenticated',
			subject,
			authority: previous.authority + (previous.subject === subject ? 0 : 1),
			message: 'Signed in.',
			needsSignOutRetry: false,
		}))
	}
	function failed(owner: number) {
		if (owner !== generation) {return}
		state.update((previous) => ({
			...previous,
			status: 'error',
			subject: null,
			authority: previous.authority + 1,
			message: 'Could not check your account. Check the connection and try again.',
		}))
	}
	async function restore() {
		if (clearingCredentials || state.getSnapshot().needsSignOutRetry) {return}
		const owner = ++generation
		if (!auth.supported) {
			signedOut('This sign-in method is unavailable on this target.', 'unsupported')
			return
		}
		state.update((previous) => ({ ...previous, status: 'checking', message: 'Checking sign-in…' }))
		try {
			if ((await auth.restore()) === 'unauthenticated') {
				if (owner === generation) {signedOut('Signed out.')}
				return
			}
			await loadAccount(owner)
		} catch {
			failed(owner)
		}
	}
	async function signIn() {
		if (clearingCredentials || state.getSnapshot().needsSignOutRetry) {return}
		const owner = ++generation
		state.update((previous) => ({ ...previous, status: 'checking', message: 'Opening sign-in…' }))
		try {
			const result = await auth.signIn()
			if (owner !== generation) {return}
			if (result.status === 'success') {await loadAccount(owner)}
			else
				{signedOut(
					result.status === 'cancelled' ? 'Sign-in cancelled.' : 'Sign-in failed. Try again.',
				)}
		} catch {
			failed(owner)
		}
	}
	async function signOut() {
		if (clearingCredentials) {return}
		clearingCredentials = true
		const owner = ++generation
		signedOut('Signing out…', 'checking')
		try {
			await auth.signOut()
			if (owner === generation) {signedOut('Signed out.')}
		} catch {
			if (owner !== generation) {return}
			state.update((previous) => ({
				...previous,
				status: 'error',
				needsSignOutRetry: true,
				message: 'Saved sign-in could not be removed. Retry sign-out before restarting.',
			}))
		} finally {
			clearingCredentials = false
		}
	}
	return { state, restore, signIn, signOut }
}
