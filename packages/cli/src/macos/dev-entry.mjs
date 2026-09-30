import { runMacOSDev } from './dev.mjs'
try {
	await runMacOSDev(process.argv[2])
} catch (error) {
	console.error(String(error))
	process.exitCode = 1
}
