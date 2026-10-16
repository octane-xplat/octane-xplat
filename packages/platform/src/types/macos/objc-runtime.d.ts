// Generated from @nativescript/objc-node-api ambient globals — module form.

// Regenerate: pnpm --filter @octane-xplat/platform generate:native-types

import { NSData } from './Foundation'

export function NativeClass(cls: Function): void

export class NativeObject implements interop.PointerObject {
	readonly __brand__: interop.PointerObject['__brand__']
}

export declare const objc: {
	importFramework(framework: string): void
	import(framework: string): void
	registerClass(cls: Function): void
	registerBlock<T extends CallableFunction>(encoding: string, fn: T): T
	autoreleasepool<T>(fn: () => T): T
	getArrayBuffer(ptr: interop.Pointer, size: number): ArrayBuffer
}

export namespace interop {
	export type Type = number

	export const types: {
		void: Type
		bool: Type
		int8: Type
		uint8: Type
		int16: Type
		uint16: Type
		int32: Type
		uint32: Type
		int64: Type
		uint64: Type
		float: Type
		double: Type
		UTF8CString: Type
		unichar: Type
		id: Type
		protocol: Type
		class: Type
		SEL: Type
	}

	export interface PointerObject {
		readonly __brand__: unique symbol
	}

	export class Pointer implements PointerObject {
		readonly __brand__: interop.PointerObject['__brand__']

		constructor(address: number)

		add(offset: number): Pointer
		subtract(offset: number): Pointer
		toNumber(): number
	}

	export type PointerConvertible = PointerObject | ArrayBufferView | ArrayBuffer | null

	// Sometimes when accepting an object pointer, we have no strong type info.
	// In which case practically any JS object is acceptable. Even JS class instances
	// since they get bridged in a special JSObject objc class.
	// Simple types like numbers, strings, arrays, object literals are also
	// converted to Objective-C equivalents.
	// deno-lint-ignore no-explicit-any
	export type Object = any

	// deno-lint-ignore no-explicit-any
	export class Reference<T = any> implements PointerObject {
		readonly __brand__: interop.PointerObject['__brand__']

		value: T

		constructor(value: T)
		constructor(type: Type, value: T)
		constructor(type: Type, pointer: Pointer)
		constructor()
	}

	export type Enum<_T extends Record<string, number>> = number

	export function addMethod<T extends abstract new (...args: unknown[]) => unknown>(
		constructor: T,
		method: (this: InstanceType<T>, ...args: unknown[]) => unknown,
	): void

	export function addProtocol(constructor: unknown, protocol: PointerObject): void

	export function adopt(ptr: Pointer): Pointer
	export function free(ptr: Pointer): void
	export function sizeof(obj: unknown): number
	export function alloc(size: number): Pointer
	export function handleof(obj: unknown): Pointer
	export function bufferFromData(data: NSData): ArrayBuffer
}

export function CGPointMake(x: number, y: number): { x: number; y: number }

export let NSMakePoint: typeof CGPointMake

export function CGSizeMake(width: number, height: number): { width: number; height: number }

export let NSMakeSize: typeof CGSizeMake

export function CGRectMake(
	x: number,
	y: number,
	width: number,
	height: number,
): {
	origin: { x: number; y: number }
	size: { width: number; height: number }
}

export let NSMakeRect: typeof CGRectMake

export function UIMakeEdgeInsets(
	top: number,
	left: number,
	bottom: number,
	right: number,
): { top: number; left: number; bottom: number; right: number }

export function NSMakeRange(location: number, length: number): { location: number; length: number }
