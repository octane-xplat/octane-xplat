import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
if (process.platform !== 'linux') {
	throw new Error('Run GTK API checks on andromeda.local inside its Linux VM')
}
const result = spawnSync('gjs', ['-m', fileURLToPath(new URL('./gtk-api.js', import.meta.url))], {
	stdio: 'inherit',
})
process.exit(result.status ?? 1)
