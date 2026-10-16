import {
	useKeyboard,
	useClipboard,
	useAnimation,
	type KeyboardEvent,
	type UseKeyboardOptions,
	type UseKeyboardResult,
	type UseClipboardOptions,
	type UseClipboardResult,
	type PanState,
	type SwipeEvent,
	type AnimationResult,
} from '@octane-xplat/ui'

const keys: UseKeyboardOptions = {
	onKeyDown(event: KeyboardEvent) {
		const code: string = event.code
		const composing: boolean = event.isComposing
		event.preventDefault()
		void [code, composing]
		// @ts-expect-error normalized events do not leak host objects
		void event.target
	},
}

const keyboard: UseKeyboardResult = useKeyboard(keys)
const supported: boolean = keyboard.isSupported
const options: UseClipboardOptions = {
	getItems: () => 'Hello',
	onCopy: (success: boolean) => void success,
	announce: 'Copied',
	resetAfterMs: 2000,
}

const clipboard: UseClipboardResult = useClipboard(options)
const copied: Promise<boolean> = clipboard.copy()
const direct: Promise<boolean> = clipboard.copy('Hello')
const pressed: Promise<boolean> = clipboard.clipboardProps.onPress()
const isCopied: boolean = clipboard.isCopied
const x = useAnimation(0, 'translateX')
const finished: Promise<AnimationResult> = x.to(40, { duration: 300 })
const spring: Promise<AnimationResult> = x.spring(0)
const phase: PanState = 'cancelled'
const direction: SwipeEvent['direction'] = 4
// @ts-expect-error unsupported phases cannot enter the shared event domain
const invalidPhase: PanState = 'changed'
// @ts-expect-error native direction flags are a bounded domain
const invalidDirection: SwipeEvent['direction'] = 3
void [
	supported,
	copied,
	direct,
	pressed,
	isCopied,
	finished,
	spring,
	phase,
	direction,
	invalidPhase,
	invalidDirection,
]
