// Internal NativeScript adapter seam for the optional keyboard package.
// Kept separate from the component barrel so tracking imports no UI hosts.
export {
	subscribeKeyboardState,
	keyboardSnapshotForHost,
	keyboardHostOverlap,
	keyboardHostDisplacement,
	observeKeyboardDestination,
} from '../keyboard-inset'

export { KeyboardAvoidanceContext } from '../keyboard-avoidance-context'
export { ConsumedInsetsContext } from '../inset-consumption'
