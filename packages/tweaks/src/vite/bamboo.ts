// Server-side Bamboo compile for preview: a draft-applied object literal →
// { className, css }. @bamboocss/node is an optional peer loaded dynamically
// through its Builder API — absent or failing, the site previews as
// 'unavailable' and Save still works.

export interface BambooCompile {
  className: string
  css: string
}

interface BambooContext {
  utility?: { getClassName(prop: string, value: unknown): string }
  encoder: { clone(): { processAtomic(obj: unknown, kind: string): void } }
  decoder: {
    clone(): {
      collectAtomic(enc: unknown): void
      classNames: Map<string, unknown> | string[]
    }
  }
  createSheet(): { processDecoder(dec: unknown): void; toCss(): string }
}

let ctxPromise: Promise<BambooContext | null> | null = null
let ctxRoot: string | null = null

async function getContext(root: string): Promise<BambooContext | null> {
  if (!ctxPromise || ctxRoot !== root) {
    ctxRoot = root
    ctxPromise = import('@bamboocss/node')
      .then((m) =>
        (
          m as unknown as {
            loadConfigAndCreateContext(o: { cwd: string; dev: boolean }): Promise<BambooContext>
          }
        ).loadConfigAndCreateContext({ cwd: root, dev: true }),
      )
      .catch(() => null)
  }

  return ctxPromise
}

// Rebuild the draft-applied object as a real value: draft set entries merge
// over the site's editable properties, deletes drop them, nested condition
// paths keep their parent shape.
export function draftObject(
  properties: { path: string[]; value: string | number | null; editable: boolean }[],
  draft: { set: Record<string, string | number>; delete: string[] },
): Record<string, unknown> {
  const deleted = new Set(draft.delete)
  const root: Record<string, unknown> = {}
  function setAt(obj: Record<string, unknown>, segs: string[], v: unknown) {
    let cur = obj

    for (const seg of segs.slice(0, -1)) {
      cur = (cur[seg] ??= {}) as Record<string, unknown>
    }

    cur[segs[segs.length - 1]] = v
  }

  for (const p of properties) {
    if (!p.editable || p.value === null || deleted.has(p.path.join('.'))) {
      continue
    }

    setAt(root, p.path, p.value)
  }

  for (const [key, v] of Object.entries(draft.set)) {
    setAt(root, key.split('.'), v)
  }

  return root
}

// Compile a site ({properties, draft}) into { className, css } entirely in
// memory: clone the encoder, processAtomic the draft object, collect atomic
// classes through a decoder clone, and emit the sheet from a fresh decoder.
export async function compileBambooObject(
  root: string,
  site: {
    properties: { path: string[]; value: string | number | null; editable: boolean }[]
    draft: { set: Record<string, string | number>; delete: string[] }
  },
): Promise<BambooCompile | null> {
  const ctx = await getContext(root)

  if (!ctx) {
    return null
  }

  try {
    const enc = ctx.encoder.clone()

    enc.processAtomic(draftObject(site.properties, site.draft), 'atomic')

    const dec = ctx.decoder.clone()

    dec.collectAtomic(enc)

    // decoder gives raw atomic names without condition prefixes; the exact
    // static-class string comes from the context's own utility map.
    const flat = draftObject(site.properties, site.draft)
    const names: string[] = []
    const walk = (obj: Record<string, unknown>, cond: string[]) => {
      for (const [k, v] of Object.entries(obj)) {
        if (v && typeof v === 'object') {
          walk(v as Record<string, unknown>, [...cond, k])
        } else if (ctx.utility?.getClassName) {
          const cls = ctx.utility.getClassName(k, v)

          if (cls) {
            names.push(cond.length ? `${cond.join(':')}:${cls}` : cls)
          }
        }
      }
    }

    walk(flat, [])

    const className = names.join(' ')
    const sheet = ctx.createSheet()

    sheet.processDecoder(dec)

    const css = sheet.toCss()

    return className ? { className, css } : null
  } catch {
    return null
  }
}
