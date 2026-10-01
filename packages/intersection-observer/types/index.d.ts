import type {
	IntersectionObserverConstructor,
	UseIntersectionObserverOptions,
	UseIntersectionObserverResult,
} from './types.js'

export declare const IntersectionObserver: IntersectionObserverConstructor
export declare const supported: boolean
export declare function useIntersectionObserver(
	options?: UseIntersectionObserverOptions,
): UseIntersectionObserverResult

export * from './types.js'
