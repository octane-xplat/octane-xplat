// @octane-xplat/ui/android — Android-authentic widgets. OS chrome is the
// point: these resolve only in native builds (the `ui/android` subpath has
// no `web` export condition). Use inside `.android.tsrx`/`.native.tsrx`
// files, or behind `isAndroid` in `.native` code — a shared `.tsrx` that
// imports this path fails the web build on purpose.

export { MaterialSwitch } from './MaterialSwitch.android.tsrx'
export { SeekBar } from './SeekBar.android.tsrx'
export { CircularProgressIndicator } from './CircularProgressIndicator.android.tsrx'
export { RecyclerView } from './RecyclerView.android.tsrx'
export { BottomNavigationView } from './BottomNavigationView.android.tsrx'
export type { TabSpec } from './BottomNavigationView.android.tsrx'
export { MaterialDialog } from './MaterialDialog.android.tsrx'
export { openModal } from './openModal.android'
export { DrawerLayout } from './DrawerLayout.android.tsrx'

export type {
	SwitchProps,
	SliderProps,
	ActivityIndicatorProps,
	ListProps,
	TabsProps,
	ModalProps,
	ModalOpenOptions,
	ModalOpenResult,
	OpenModal,
	DrawerProps,
} from '../props'
