import { expect, it } from 'vitest'
import { keyboardNativeScope } from '../src/native-scope'

it('releases native resources in reverse order even when one cleanup fails', () => {
	const scope = keyboardNativeScope(),
		calls: number[] = []
	scope.defer(() => {
		calls.push(1)
	})
	scope.defer(() => {
		calls.push(2)
		throw new Error('disposed native object')
	})
	scope.defer(() => {
		calls.push(3)
	})
	expect(() => scope.release()).toThrow(AggregateError)
	expect(calls).toEqual([3, 2, 1])
	scope.release()
	expect(calls).toEqual([3, 2, 1])
})
