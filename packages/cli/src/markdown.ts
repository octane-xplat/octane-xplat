// Markdown → the MdDoc AST that `@octane-xplat/ui`'s <Markdown> renders.
// Runs inside `xplat routes`/dev/build codegen — the parser is shared with
// the runtime so baked output and runtime parsing agree byte-for-byte. It is
// a pure parser (no DOM, no dependencies) imported from the ui package's
// source; `vite build` bundles it into the CLI, so it never reaches a
// runtime bundle through this path. Output stays JSON-serializable: it is
// embedded verbatim in routes.gen.data.ts.

import { parseMdDoc } from '../../ui/src/markdown/markdown-parse.ts'

/** Bake Markdown source into a versioned `MdDoc` (v2) for route codegen.
 *  The JSON round-trip drops absent optional fields (`start` on an unordered
 *  list, `delimiter`, `spread`, …) so the embedded literal is exactly what
 *  `JSON.parse` hands the runtime — assertRouteDataJson rejects undefined
 *  fields as silently-dropped data otherwise. */
export function mdToDoc(src: string) {
  return JSON.parse(JSON.stringify(parseMdDoc(src)))
}
