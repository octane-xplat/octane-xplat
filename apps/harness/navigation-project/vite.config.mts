import { defineConfig } from 'vite'
import { native } from '@octane-xplat/cli/vite'

// The preset covers project-relative modules outside this directory too.
// Custom absolute-path globs miss canonical IDs such as ../src/navigation-*.tsrx.
export default defineConfig(({ mode }) => native(mode))
