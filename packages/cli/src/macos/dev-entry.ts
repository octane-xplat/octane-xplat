// @ts-nocheck — .mjs→.ts port: annotations pending (transitional)
import { runMacOSDev } from './dev.ts'
try {
	await runMacOSDev(process.argv[2])
} catch (error) {
	console.error(String(error))
	process.exitCode = 1
}
