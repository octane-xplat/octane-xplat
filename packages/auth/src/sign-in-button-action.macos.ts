import type { AppleSignInButtonProps, SignInResult } from './types'

type ActionProps = Pick<AppleSignInButtonProps, 'disabled' | 'onPress' | 'onResult'>

/** One mounted button owns one pending action; no native controller is cancelled here. */
export function createSignInButtonAction(read: () => ActionProps, signIn: () => Promise<SignInResult>) {
	let owner: object | null = null
	let pending: object | null = null
	let dispatching = false
	return {
		mount() {
			const lease = {}
			owner = lease; pending = null
			return () => { if (owner === lease) { owner = null; pending = null } }
		},
		press() {
			const lease = owner
			if (!lease || pending || dispatching) return
			const before = read()
			if (owner !== lease || before.disabled) return
			const attempt = {}
			pending = attempt; dispatching = true
			let started = false
			const current = () => owner === lease && pending === attempt
			const deliver = (result: SignInResult) => {
				if (!current()) return
				pending = null
				const callback = read().onResult
				if (owner === lease) callback?.(result)
			}
			const failure = (): SignInResult => ({ status: 'error', message: 'Sign-in failed' })
			try {
				before.onPress?.() // Notification hook; its return value is not a gate.
				const after = read()
				if (!current() || after.disabled) return
				let result: Promise<SignInResult>
				try { result = signIn() } catch { result = Promise.resolve(failure()) }
				started = true
				// Consume provider rejection only. Consumer callbacks keep their own errors.
				void Promise.resolve(result).then(deliver, () => deliver(failure()))
			} finally {
				dispatching = false
				if (!started && pending === attempt) pending = null
			}
		},
	}
}
