import { native } from '@octane-xplat/build/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => native(mode))
