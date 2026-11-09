import { defineConfig } from 'vite'
import { native } from '@octane-xplat/cli/vite'

export default defineConfig(({ mode }) => native(mode))
