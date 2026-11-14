import type * as BufferModule from 'buffer/'
import type StreamModule from 'readable-stream'
import type * as StreamPromises from 'node:stream/promises'
import type { EventEmitterConstructor } from './types/events.js'
import type { UtilModule } from './types/util.js'
import type { AssertModule } from './types/assert.js'
import type { QuerystringModule } from './types/querystring.js'

export const buffer: typeof BufferModule & {
  SlowBuffer(size: number): BufferModule.Buffer
  INSPECT_MAX_BYTES: number
  kMaxLength: number
}

export const stream: typeof StreamModule.Stream &
  typeof StreamModule & {
    promises: Pick<typeof StreamPromises, 'pipeline' | 'finished'>
  }

export const events: EventEmitterConstructor
export const util: UtilModule
export const assert: AssertModule
export const querystring: QuerystringModule
