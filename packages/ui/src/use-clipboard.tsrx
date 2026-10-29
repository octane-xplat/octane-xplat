import { useCallback, useEffect, useRef, useState } from 'octane'
import { announce } from '@octane-xplat/platform'
import { copyText } from './clipboard-write'

/**
 * How long `isCopied` stays true after a successful copy before reverting.
 * Matches the pinned Astryx default — long enough for a copy → check flip to
 * register without lingering.
 */
const DEFAULT_RESET_AFTER_MS = 2000

/** Text-only copy trigger. Unlike React Aria's rich clipboard hook, this
 * attaches to a shared Pressable through onPress; it does not handle paste.
 * Options shape follows Astryx `useClipboard` (`announce`, `resetAfterMs`),
 * extended with the existing `getItems`/`onCopy` contract. */
export interface UseClipboardOptions {
	/** Produce the text to copy when `copy()`/`onPress` runs without an
	 * argument. Omit when every call site passes text to `copy(text)`. */
	getItems?: () => string
	/** Called after each attempt while the hook is mounted; false includes
	 * unavailable/denied writes, a throwing getItems producer, and calls with
	 * no text to write. */
	onCopy?: (success: boolean) => void
	/** Message announced to a polite live region on a successful copy.
	 * Omit to skip the announcement. */
	announce?: string
	/** Milliseconds `isCopied` stays true after a successful copy before it
	 * reverts to false.
	 * @default 2000 */
	resetAfterMs?: number
}

/**
 * `useClipboard` result — `copy(text)`, transient `isCopied`, and the
 * `clipboardProps` press attachment.
 */
export interface UseClipboardResult {
	/** Write `text` — or `getItems()` when omitted — to the clipboard. On
	 * success flips `isCopied` to true, announces the configured message,
	 * restarts the reset timer, and resolves true. A failed attempt leaves
	 * `isCopied` unchanged and resolves false; `onCopy` observes either
	 * outcome before the promise resolves. After unmount, an in-flight write still
	 * resolves its outcome without publishing feedback; held triggers resolve
	 * false without starting another write. */
	copy: (text?: string) => Promise<boolean>
	/** True for `resetAfterMs` after the most recent successful copy. */
	isCopied: boolean
	clipboardProps: {
		onPress: () => Promise<boolean>
	}
}

/**
 * Copy text to the clipboard — resolves a boolean for success and tracks a
 * transient `isCopied` flag with its own reset timer. Rapid re-copies
 * restart the timer so the confirmation always lasts the full duration, and
 * the timer is cleaned up on unmount. Retired triggers cannot start writes,
 * and completed in-flight writes skip feedback after their owner retires.
 *
 * @see UseClipboardResult.
 */
export function useClipboard(options: UseClipboardOptions = {}): UseClipboardResult {
	const {
		getItems,
		onCopy,
		announce: announceMessage,
		resetAfterMs = DEFAULT_RESET_AFTER_MS,
	} = options

	const [isCopied, setIsCopied] = useState(false)
	const lifetime = useRef({
		active: true,
		generation: 0,
		resetVersion: 0,
		timer: null as ReturnType<typeof setTimeout> | null,
	})

	useEffect(() => {
		const owner = lifetime.current
		owner.active = true
		return () => {
			// Retire first: even an already queued timer or write completion is inert.
			owner.active = false
			owner.generation++
			owner.resetVersion++
			const timer = owner.timer
			owner.timer = null
			if (timer != null) clearTimeout(timer)
		}
	}, [])

	const copy = useCallback(
		async (text?: string): Promise<boolean> => {
			const owner = lifetime.current
			const generation = owner.generation
			const isCurrent = () => owner.active && owner.generation === generation
			if (!isCurrent()) return false
			let value: string | undefined
			try {
				value = text ?? getItems?.()
			} catch {
				// The text producer can fail before the platform write starts.
			}
			if (!isCurrent()) return false

			let success = false
			if (value !== undefined) {
				try { success = await copyText(value) } catch { /* Failed platform write. */ }
			}
			if (!isCurrent()) return success

			if (success) {
				setIsCopied(true)
				if (!isCurrent()) return success
				const version = ++owner.resetVersion
				const previous = owner.timer
				owner.timer = null
				if (previous != null) clearTimeout(previous)
				if (!isCurrent()) return success
				owner.timer = setTimeout(() => {
					if (!isCurrent() || owner.resetVersion !== version) return
					owner.timer = null
					setIsCopied(false)
				}, resetAfterMs)

				// Own the timer before an announcement can reenter/unmount the owner.
				if (announceMessage && isCurrent()) {
					try { announce(announceMessage) } catch {
						// Announcement availability cannot change a completed write.
					}
				}
			}

			if (isCurrent()) onCopy?.(success)
			return success
		},
		[getItems, onCopy, announceMessage, resetAfterMs],
	)

	// Wrap rather than alias copy: hosts may forward their activation event,
	// which must not be read as copy text.
	const onPress = useCallback(() => copy(), [copy])

	return { copy, isCopied, clipboardProps: { onPress } }
}
