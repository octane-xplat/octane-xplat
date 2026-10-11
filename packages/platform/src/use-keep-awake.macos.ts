// Typechecking shim; renderer builds select the .tsrx implementation.
import type { KeepAwakeOptions } from './keep-awake.types'
export declare function useKeepAwake(tag?: string, options?: KeepAwakeOptions): void
