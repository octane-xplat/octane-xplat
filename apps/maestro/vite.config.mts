import { defineConfig } from 'vite'
import { xplatNative } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => xplatNative(mode))
