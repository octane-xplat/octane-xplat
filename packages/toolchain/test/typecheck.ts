import { defineConfig, type XplatViteConfig } from '../vite.js'

const fromObject: XplatViteConfig = defineConfig({ server: { port: 5200 } })
const fromFunction = defineConfig(({ mode }) => ({ define: { __MODE__: JSON.stringify(mode) } }))
const fromAsyncFunction = defineConfig(async ({ command }) => ({
  base: command === 'build' ? '/app/' : '/',
}))
const fromPromise = defineConfig(Promise.resolve({ base: '/' }))
const empty = defineConfig()

void [fromObject, fromFunction, fromAsyncFunction, fromPromise, empty]
