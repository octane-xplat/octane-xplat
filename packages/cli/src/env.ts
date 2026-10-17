// Runtime self-references to sibling modules. The same source runs both from
// src/ (.ts, in-repo type stripping) and dist/ (.js, published emit) — a path
// must follow whichever extension the caller itself was loaded under.
export const siblingUrl = (metaUrl: string, name: string) =>
	new URL(`./${name}${metaUrl.endsWith('.ts') ? '.ts' : '.js'}`, metaUrl)

// Payload files (prebuilt hosts, native payloads, .swift helpers, ambient
// typecheck globals) ship under src/ only — they are not emitted modules and
// duplicating them into dist/ would double the tarball. Resolve them through
// src/ whether the caller itself runs from src/ or dist/.
export const srcUrl = (metaUrl: string, name: string) =>
	new URL(`./${name}`, metaUrl.replace('/dist/', '/src/'))
