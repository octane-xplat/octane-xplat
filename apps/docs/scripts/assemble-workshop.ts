import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const source = resolve(root, '../component-workshop/dist')

if (!existsSync(resolve(source, 'index.html'))) {
  throw new Error('Build @xplat/component-workshop before assembling docs')
}

const destination = resolve(root, 'dist/workshop')

rmSync(destination, { recursive: true, force: true })
mkdirSync(destination, { recursive: true })
cpSync(source, destination, { recursive: true })

const examples = resolve(source, 'template-assets')

if (existsSync(examples)) {
  cpSync(examples, resolve(root, 'dist/template-assets'), { recursive: true })
}
