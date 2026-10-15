// Hand-authored additions to the generated SDK surface.
import type { CGPoint, CGSize, CGRect } from './CoreFoundation'
import type { NSObject } from './Runtime'

export type NSClass<T> = {
	new (...args: any[]): T
	alloc(): T
	[key: string]: any
}

// The generator emits only the CoreGraphics spellings; AppKit code and docs
// use the NS aliases for the same structs.
export type NSPoint = CGPoint
export type NSSize = CGSize
export type NSRect = CGRect
