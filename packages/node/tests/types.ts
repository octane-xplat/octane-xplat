import assert from '@octane-xplat/node/assert'
import { Buffer } from '@octane-xplat/node/buffer'
import EventEmitter from '@octane-xplat/node/events'
import { Readable, Writable } from '@octane-xplat/node/stream'
import { parse } from '@octane-xplat/node/querystring'
import { format, TextEncoder, promisify } from '@octane-xplat/node/util'
import { requireNode } from '@octane-xplat/node'

assert.strictEqual(Buffer.from('hello').toString(), 'hello')

const emitter = new EventEmitter()

emitter.on('number', (value: number) => format('%d', value))

const read = new Readable({ read() {} })
const write = new Writable({
  write(_chunk, _encoding, done) {
    done()
  },
})

read.pipe(write)
parse('a=1')
new TextEncoder().encode('hello')
requireNode('node:buffer').Buffer.from([1, 2])

const add = promisify(
  (left: number, right: number, callback: (error: unknown, result?: number) => void) =>
    callback(null, left + right),
)

const result: Promise<number> = add(1, 2)

void result
// @ts-expect-error Listener registrations require a callable listener.
emitter.on('bad', 3)
// @ts-expect-error Buffer values are not arbitrary objects.
requireNode('buffer').Buffer.from({ wrong: true })
