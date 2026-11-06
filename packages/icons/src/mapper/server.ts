#!/usr/bin/env node
// Executable entry of the `.icon` content mapper: TypeScript 7.1+ spawns it
// through this package's `typescript.contentMapper.exec` manifest entry and
// talks JSON-RPC over stdio (Content-Length framing, matching
// @tsrx/content-mapper's rpc.js). stdout is reserved for protocol messages —
// console output is redirected to stderr.
import { Console } from 'node:console'

import { createIconContentMapper } from './mapper'

const stderr = new Console(process.stderr)
for (const name of ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const) {
  console[name] = stderr[name].bind(stderr)
}

const mapper = createIconContentMapper()
let buffered = Buffer.alloc(0)

process.stdin.on('data', (chunk: Buffer) => {
  buffered = Buffer.concat([buffered, chunk])
  for (;;) {
    const headerEnd = buffered.indexOf('\r\n\r\n')
    if (headerEnd < 0) {
      return
    }

    const lengthMatch = /^Content-Length:\s*(\d+)\s*$/im.exec(
      buffered.subarray(0, headerEnd).toString('ascii'),
    )

    if (!lengthMatch) {
      console.error('@octane-xplat/icons mapper: missing Content-Length header')
      process.exit(1)
    }

    const contentLength = Number(lengthMatch[1])
    const messageStart = headerEnd + 4
    if (buffered.length < messageStart + contentLength) {
      return
    }

    const body = buffered.subarray(messageStart, messageStart + contentLength).toString('utf8')
    buffered = buffered.subarray(messageStart + contentLength)
    let message: { jsonrpc: string; id?: number | string | null; method: string; params?: unknown }
    try {
      message = JSON.parse(body)
    } catch (error) {
      console.error('@octane-xplat/icons mapper: invalid JSON-RPC message', error)
      continue
    }

    if (message.id === undefined || message.id === null) {
      continue
    }

    try {
      let result: unknown
      switch (message.method) {
        case 'initialize':
          result = mapper.initialize(message.params as { positionEncodings?: string[] })
          break
        case 'openProject':
          result = mapper.openProject(message.params as Parameters<typeof mapper.openProject>[0])
          break
        case 'closeProject':
          result = mapper.closeProject(message.params as { projectHandle: string })
          break
        case 'transform':
          result = mapper.transform(message.params as Parameters<typeof mapper.transform>[0])
          break
        default:
          respond(message.id, undefined, {
            code: -32601,
            message: `Unknown method ${message.method}`,
          })

          continue
      }

      respond(message.id, result)
    } catch (error) {
      respond(message.id, undefined, {
        code: -32603,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }
})

process.stdin.on('error', (error) => {
  console.error(error)
  process.exitCode = 1
})

process.stdin.on('end', () => {
  process.exit(process.exitCode ?? 0)
})

function respond(
  id: number | string,
  result: unknown,
  error?: { code: number; message: string },
): void {
  const out = JSON.stringify(error ? { jsonrpc: '2.0', id, error } : { jsonrpc: '2.0', id, result })
  process.stdout.write(`Content-Length: ${Buffer.byteLength(out)}\r\n\r\n${out}`)
}
