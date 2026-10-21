import { createHash } from 'node:crypto'

/** Bundle identity shared by the macOS launcher and retained diagnostic runs. */
export function macOSDevBundleId(appRoot: string, manifest: any) {
	return (
		manifest.xplat?.targets?.macos?.package?.bundleIdentifier ??
		`org.octane.dev.${createHash('sha256').update(appRoot).digest('hex').slice(0, 16)}`
	)
}
