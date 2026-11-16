// Minimal stdio client for the repository's installed TypeScript 7 server.
import { spawn } from 'node:child_process'
import { pathToFileURL } from 'node:url'

export function nativeLsp(cwd, compiler) {
  const child = spawn(process.execPath, [compiler, '--lsp', '--stdio'], { cwd })
  let buffered = Buffer.alloc(0)
  let next = 0
  let stderr = ''
  const pending = new Map()
  const send = (message) => {
    const body = JSON.stringify({ jsonrpc: '2.0', ...message })

    child.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`)
  }

  child.stderr.on('data', (data) => {
    stderr += data
  })

  child.stdin.on('error', () => {})
  child.on('exit', (code) => {
    for (const p of pending.values()) {
      p.reject(new Error(`LSP exited ${code}: ${stderr}`))
    }
  })

  child.stdout.on('data', (data) => {
    buffered = Buffer.concat([buffered, data])
    for (;;) {
      const end = buffered.indexOf('\r\n\r\n')

      if (end < 0) {
        break
      }

      const size = Number(/Content-Length: (\d+)/i.exec(buffered.subarray(0, end).toString())[1])

      if (buffered.length < end + 4 + size) {
        break
      }

      const message = JSON.parse(buffered.subarray(end + 4, end + 4 + size).toString())

      buffered = buffered.subarray(end + 4 + size)
      if (message.method && message.id !== undefined) {
        send({
          id: message.id,
          result:
            message.method === 'workspace/configuration'
              ? message.params.items.map(() => null)
              : null,
        })
      } else if (message.id !== undefined) {
        const p = pending.get(message.id)

        pending.delete(message.id)
        if (message.error) {
          p?.reject(new Error(JSON.stringify(message.error)))
        } else {
          p?.resolve(message.result)
        }
      }
    }
  })

  const request = (method, params) =>
    new Promise((resolve, reject) => {
      const id = ++next
      const timer = setTimeout(() => reject(new Error(`LSP timeout: ${method}; ${stderr}`)), 45000)

      pending.set(id, {
        resolve: (value) => {
          clearTimeout(timer)
          resolve(value)
        },
        reject: (error) => {
          clearTimeout(timer)
          reject(error)
        },
      })

      send({ id, method, params })
    })

  const notify = (method, params) => send({ method, params })

  return {
    request,
    notify,
    async initialize() {
      await request('initialize', {
        processId: process.pid,
        rootUri: pathToFileURL(cwd).href,
        workspaceFolders: [{ uri: pathToFileURL(cwd).href, name: 'fixture' }],
        initializationOptions: { runExternalCode: true },
        capabilities: {
          workspace: { configuration: true, workspaceFolders: true },
          textDocument: {
            diagnostic: { dynamicRegistration: true },
            hover: { dynamicRegistration: true, contentFormat: ['plaintext'] },
          },
        },
      })

      notify('initialized', {})
    },
    open(file, text) {
      const uri = pathToFileURL(file).href

      notify('textDocument/didOpen', {
        textDocument: {
          uri,
          languageId: file.endsWith('.tsrx') ? 'tsrx' : 'typescript',
          version: 1,
          text,
        },
      })

      return { uri }
    },
    close() {
      child.kill()
    },
  }
}
