/** Report a failed press action (`clickAction`, `pressedChangeAction`).
 *  A consumer `onActionError` receives the error; without one the error is
 *  re-thrown on a fresh task so it surfaces as an uncaught asynchronous
 *  error instead of being silently swallowed by pending-state cleanup. */
export function reportActionError(error: unknown, onActionError?: (error: unknown) => void): void {
	if (onActionError != null) {
		onActionError(error)
		return
	}

	setTimeout(() => {
		throw error
	}, 0)
}
