import { defineConfig } from 'vite'
import { macos } from '@octane-xplat/cli/macos/vite'

export default defineConfig(({ mode }) => macos(mode, { entry: 'src/main.ts' }))
