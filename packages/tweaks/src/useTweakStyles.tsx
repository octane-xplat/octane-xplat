// Dev-only style preview runtime for instrumented inline `style={{…}}` sites.
// The Vite plugin injects `const __tw = useTweakStyles()` at the top of each
// component with sites and wraps objects as `__tw("<id>", {…})`. Sites inside
// nested callbacks use the outer component's __tw.
//
// `createUseTweakStyles(tag)` lets a platform leaf annotate the merged style
// object — the web leaf tags `--tw-site` so click-to-pick can hit-test
// elements back to their site id. Native uses the untagged default.
import { useEffect, useRef, useState } from 'octane'
import { client } from './client'
import type { TweakValue } from './protocol'

export function createUseTweakStyles(
  tag?: (id: string, style: Record<string, TweakValue>) => Record<string, TweakValue>,
) {
  return function useTweakStyles() {
    // rendered = ids seen this render pass; reported = ids mounted on server.
    const rendered = useRef<Set<string>>(new Set())
    const reported = useRef<Set<string>>(new Set())
    const [, bump] = useState(0)

    // A new render pass starts here: the set must hold only ids rendered THIS
    // pass, or a site hidden by a same-component conditional never unmounts.
    rendered.current.clear()

    // Effect deps on a per-render counter: Octane needs a changing dep to run
    // after every commit.
    const pass = useRef(0)

    pass.current += 1

    useEffect(() => {
      // After every commit, diff this pass's rendered ids against the reported
      // set — sites behind a false conditional are not mounted.
      const r = rendered.current

      for (const id of r) {
        if (!reported.current.has(id)) {
          client.mountStyle(id)
        }
      }

      for (const id of reported.current) {
        if (!r.has(id)) {
          client.unmountStyle(id)
        }
      }

      reported.current = new Set(r)
    }, [pass.current])

    useEffect(() => {
      const off = client.onStyles(() => bump((n) => n + 1))

      return () => {
        off()
        for (const id of reported.current) {
          client.unmountStyle(id)
        }

        reported.current.clear()
      }
    }, [])

    return (id: string, obj: Record<string, TweakValue>): Record<string, TweakValue> => {
      rendered.current.add(id)

      const override = client.getStyle(id)
      let merged = obj

      if (override) {
        merged = { ...obj }
        for (const [k, v] of Object.entries(override.set)) {
          merged[k] = v
        }

        for (const k of override.delete) {
          delete merged[k]
        }
      }

      return tag ? tag(id, merged) : merged
    }
  }
}

export const useTweakStyles = createUseTweakStyles()
