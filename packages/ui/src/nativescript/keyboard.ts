// Internal NativeScript adapter seam for the optional keyboard package.
// Kept separate from the component barrel so tracking imports no UI hosts.
export {
	subscribeKeyboardState,
	keyboardSnapshotForHost,
	keyboardWindowForHost,
	keyboardHostOverlap,
	keyboardHostDisplacement,
	observeKeyboardDestination,
} from '../internal/keyboard/keyboard-inset'

export { KeyboardAvoidanceContext } from '../internal/keyboard/keyboard-avoidance-context'
export { ConsumedInsetsContext } from '../components/layout/inset-consumption'
