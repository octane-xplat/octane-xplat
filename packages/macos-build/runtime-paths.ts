// Packaged workers keep their native payloads beside emitted modules in dist/.
export const srcUrl = (metaUrl: string, name: string): URL => new URL(`./${name}`, metaUrl)
export const distUrl = srcUrl
export const siblingUrl = (metaUrl: string, name: string): URL =>
	new URL(`./${name}${metaUrl.endsWith('.ts') ? '.ts' : '.js'}`, metaUrl)
