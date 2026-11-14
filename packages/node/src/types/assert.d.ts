export type AssertionMessage = string | Error
export type ExpectedError = RegExp | Function | Readonly<Record<string, unknown>>
export interface AssertionFailure extends Error {
  code: 'ERR_ASSERTION'
  actual: unknown
  expected: unknown
  operator: string
  generatedMessage: boolean
}

export interface AssertModule {
  (value: unknown, message?: AssertionMessage): asserts value
  AssertionError: new (options?: {
    message?: AssertionMessage
    actual?: unknown
    expected?: unknown
    operator?: string
  }) => AssertionFailure
  ok(value: unknown, message?: AssertionMessage): asserts value
  fail(message?: AssertionMessage): never
  equal(actual: unknown, expected: unknown, message?: AssertionMessage): void
  notEqual(actual: unknown, expected: unknown, message?: AssertionMessage): void
  strictEqual(actual: unknown, expected: unknown, message?: AssertionMessage): void
  notStrictEqual(actual: unknown, expected: unknown, message?: AssertionMessage): void
  deepEqual(actual: unknown, expected: unknown, message?: AssertionMessage): void
  notDeepEqual(actual: unknown, expected: unknown, message?: AssertionMessage): void
  deepStrictEqual(actual: unknown, expected: unknown, message?: AssertionMessage): void
  notDeepStrictEqual(actual: unknown, expected: unknown, message?: AssertionMessage): void
  throws(fn: () => unknown, expected?: ExpectedError, message?: AssertionMessage): unknown
  doesNotThrow(fn: () => unknown, expected?: ExpectedError, message?: AssertionMessage): void
  rejects(
    fn: PromiseLike<unknown> | (() => unknown),
    expected?: ExpectedError,
    message?: AssertionMessage,
  ): Promise<unknown>
  doesNotReject(
    fn: PromiseLike<unknown> | (() => unknown),
    expected?: ExpectedError,
    message?: AssertionMessage,
  ): Promise<unknown>
  ifError(value: unknown): void
  match(value: string, regexp: RegExp, message?: AssertionMessage): void
  doesNotMatch(value: string, regexp: RegExp, message?: AssertionMessage): void
  strict: AssertModule
}
