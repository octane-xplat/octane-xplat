import { events, util, assert, buffer, querystring, stream, requireNode } from '../dist/index.js'

type Context = {
  assert(name: string, actual: unknown, expected?: unknown): void
  record(name: string, value: unknown): void
}

/** Shared behavior cases execute in the app realm, before any UI root mounts. */
export async function run(ctx: Context) {
  const check = (name: string, actual: unknown, expected: unknown = true) =>
    ctx.assert(name, actual, expected)

  const B = buffer.Buffer

  for (const name of ['events', 'util', 'assert', 'buffer', 'querystring', 'stream']) {
    check(`${name} spelling identity`, requireNode(name) === requireNode(`node:${name}`))
  }

  for (const name of ['node:fs', 'node:stream/promises', 'events-extra', 'toString']) {
    let rejected = false

    try {
      requireNode(name)
    } catch {
      rejected = true
    }

    check(`${name} rejected`, rejected)
  }

  const emitter = new events()
  const once = events.once(emitter, 'value')

  emitter.emit('value', 42)
  check('events.once value', (await once)[0], 42)
  check('events.once releases listener', emitter.listenerCount('value'), 0)
  check('util formatting', util.format('%s-%d', 'item', 3), 'item-3')
  check(
    'util codecs',
    new util.TextDecoder().decode(new util.TextEncoder().encode('héllo')),
    'héllo',
  )

  check('assert callable', typeof assert, 'function')
  assert.deepStrictEqual({ items: [1, 2] }, { items: [1, 2] })

  let assertionRejected = false

  try {
    assert.strictEqual(1, 2)
  } catch {
    assertionRejected = true
  }

  check('assert rejects unequal values', assertionRejected)
  check(
    'querystring repeated values',
    JSON.stringify(querystring.parse('a=1&a=2')),
    '{"a":["1","2"]}',
  )

  check('querystring null prototype', Object.getPrototypeOf(querystring.parse('a=1')), null)

  const ab = new ArrayBuffer(2)

  B.from(ab)[0] = 9
  check('Buffer shares ArrayBuffer bytes', new Uint8Array(ab)[0], 9)

  const original = B.from([1, 2])

  original.slice(0, 1)[0] = 9
  check('Buffer slice shares bytes', original[0], 9)
  check('Buffer invalid hex stops', B.from('1ag123', 'hex').toString('hex'), '1a')
  check('Buffer concat truncates', B.concat([B.from([1, 2, 3])], 2).toString('hex'), '0102')

  const target = B.alloc(2)

  check('Buffer copy truncates count', B.from([1, 2, 3]).copy(target), 2)
  check('Buffer copy truncates bytes', target.toString('hex'), '0102')
  check('Buffer fill offset pattern', B.alloc(5).fill('ab', 1, 5).toString('hex'), '0061626162')
  check('Buffer Uint16 elements', B.from(new Uint16Array([0x1234, 0x5678])).toString('hex'), '3478')
  check('Buffer padded base64 byte length', B.byteLength('YQ==', 'base64'), 1)
  check('Buffer ASCII clears high bit', B.from([255]).toString('ascii').charCodeAt(0), 127)

  const readable = new stream.Readable({ highWaterMark: 1, read() {} })

  check('stream EventEmitter identity', readable instanceof events)
  check('readable push backpressure', readable.push('ab'), false)
  readable.destroy()

  let writes = 0
  const writable = new stream.Writable({
    write(_chunk, _encoding, callback) {
      writes++
      callback()
    },
  })

  writable.cork()
  writable.write('a')
  check('cork defers writes', writes, 0)
  writable.uncork()
  check('uncork releases writes', writes, 1)
  writable.destroy()

  const decoded = new stream.Readable({ read() {} })

  decoded.setEncoding('utf8')
  decoded.push('abc')
  check('setEncoding returns strings', decoded.read(), 'abc')
  decoded.destroy()

  const closed = new stream.Readable({ read() {} })
  const premature = new Promise<string | undefined>((resolve) =>
    stream.finished(closed, (error) => resolve(error?.code)),
  )

  closed.destroy()
  check('finished rejects premature close', await premature, 'ERR_STREAM_PREMATURE_CLOSE')

  let received: unknown
  const sink = new stream.Writable({
    write(chunk, _encoding, callback) {
      received = chunk
      callback()
    },
  })

  await stream.promises.pipeline(stream.Readable.from([B.from('ok')]), sink)
  check('pipeline Buffer identity', received instanceof B)
  check('promise pipeline output', String(received), 'ok')
  ctx.record('nodeConformance', true)
}
