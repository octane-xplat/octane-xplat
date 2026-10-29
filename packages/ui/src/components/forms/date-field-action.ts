/** Run an app-owned date-field action and release loading on either outcome.
 * The app owns failure messaging through `status`. Rejection must not leave
 * a field busy or create an unhandled event-handler promise rejection. */
export function runDateChangeAction(
	action: () => void | Promise<void>,
	onSettled: () => void,
): void {
	let result: void | Promise<void>
	try {
		result = action()
	} catch {
		onSettled()
		return
	}

	void Promise.resolve(result).then(onSettled, onSettled)
}
