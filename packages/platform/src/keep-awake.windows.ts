import type { KeepAwakeImpl } from './keep-awake.types'
export { KeepAwakeDefaultTag } from './keep-awake.types'
export type { KeepAwakeImpl, KeepAwakeOptions } from './keep-awake.types'
const unsupported = async () => false
export const keepAwake: KeepAwakeImpl = {
	activate: unsupported,
	deactivate: unsupported,
	isActivated: unsupported,
	isAvailable: unsupported,
}
