export interface InspectOptions {
  showHidden?: boolean
  depth?: number | null
  colors?: boolean
  customInspect?: boolean
  maxArrayLength?: number | null
}

export interface Utf8Encoder {
  readonly encoding: string
  encode(value?: string): Uint8Array
  encodeInto(value: string, destination: Uint8Array): { read: number; written: number }
}

export interface Utf8Decoder {
  readonly encoding: string
  readonly fatal: boolean
  readonly ignoreBOM: boolean
  decode(value?: ArrayBuffer | ArrayBufferView, options?: { stream?: boolean }): string
}

export interface UtilModule {
  format(value?: unknown, ...args: unknown[]): string
  formatWithOptions(options: InspectOptions, value?: unknown, ...args: unknown[]): string
  inspect: {
    (value: unknown, options?: InspectOptions): string
    custom: symbol
    defaultOptions: InspectOptions
  }
  inherits(constructor: Function, parent: Function): void
  isDeepStrictEqual(left: unknown, right: unknown): boolean
  types: {
    isDate(value: unknown): boolean
    isRegExp(value: unknown): boolean
    isPromise(value: unknown): boolean
    isNativeError(value: unknown): boolean
    isMap(value: unknown): boolean
    isSet(value: unknown): boolean
    isUint8Array(value: unknown): boolean
    isTypedArray(value: unknown): boolean
    isArrayBuffer(value: unknown): boolean
    isDataView(value: unknown): boolean
  }
  promisify: {
    <Args extends unknown[], Result>(
      fn: (...args: [...Args, (error: unknown, result?: Result) => void]) => unknown,
    ): (...args: Args) => Promise<Result>
    custom: symbol
  }
  callbackify<Args extends unknown[], Result>(
    fn: (...args: Args) => Result | PromiseLike<Result>,
  ): (...args: [...Args, (error: unknown, result?: Result) => void]) => void
  deprecate<Fn extends Function>(fn: Fn, message: string, code?: string): Fn
  TextEncoder: new () => Utf8Encoder
  TextDecoder: new (
    encoding?: string,
    options?: { fatal?: boolean; ignoreBOM?: boolean },
  ) => Utf8Decoder
  debuglog(section: string): (...args: unknown[]) => void
  log(...args: unknown[]): void
  error(...args: unknown[]): void
  toUSVString(value: unknown): string
  stripVTControlCharacters(value: string): string
}
