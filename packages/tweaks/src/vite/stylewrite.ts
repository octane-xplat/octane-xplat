// Property-level style writeback for Save: set an existing literal, add a new
// property (one-line or multi-line formatting, nested paths incl. creating the
// parent object), and delete a property with its comma/line. All positions are
// UTF-16 offsets. After splicing the caller re-parses and re-extracts; a
// mismatch aborts the save (see save.ts transaction).
import type { StyleDraft, StyleValue } from '../protocol.ts'
import { serializeLiteral } from './serialize.ts'
import { extractStyles, type StyleSite } from './styles.ts'
import type { EstreeNode } from './extract.ts'

export interface StyleEdit {
  site: StyleSite
  draft: StyleDraft // merged draft to apply
}

function isIdentifier(s: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(s)
}

function propKey(s: string): string {
  return isIdentifier(s) ? s : JSON.stringify(s)
}

// Detect the file's quote style near the replaced literal.
function quoteStyle(code: string, node: EstreeNode): "'" | '"' {
  const raw = code.slice(node.start, node.end)

  return raw.startsWith('"') ? '"' : "'"
}

function indentOf(code: string, offset: number): string {
  const start = code.lastIndexOf('\n', offset - 1) + 1
  let i = start

  while (i < code.length && (code[i] === ' ' || code[i] === '\t')) {
    i++
  }

  return code.slice(start, i)
}

interface Splice {
  start: number
  end: number
  text: string
}

function findObjectAtPath(obj: EstreeNode, segments: string[]): EstreeNode | null {
  let cur = obj

  for (const seg of segments) {
    let next: EstreeNode | null = null

    for (const p of (cur.properties as EstreeNode[]) ?? []) {
      if (p.type !== 'Property') {
        continue
      }

      const k = p.key as EstreeNode
      const name =
        k.type === 'Identifier' ? (k.name as string) : k.type === 'Literal' ? String(k.value) : null

      if (name === seg && (p.value as EstreeNode).type === 'ObjectExpression') {
        next = p.value as EstreeNode
        break
      }
    }

    if (!next) {
      return null
    }

    cur = next
  }

  return cur
}

// Build the splices for one site. `set` keys win over `delete` (server already
// normalizes: a draft only carries delete for paths that exist or were added).
export function planStyleEdit(code: string, site: StyleSite, draft: StyleDraft): Splice[] {
  const splices: Splice[] = []
  const deleted = new Set(draft.delete)
  const deletedProps = new Set<EstreeNode>()

  for (const key of draft.delete) {
    const n = site.propNodes.get(key)

    if (n) {
      deletedProps.add(n.prop)
    }
  }

  for (const [key, value] of Object.entries(draft.set)) {
    const path = key.split('.')
    const existing = site.propNodes.get(key)

    if (existing) {
      // Replace value, preserving quote style for strings.
      const text =
        typeof value === 'string'
          ? serializeLiteral(value, quoteStyle(code, existing.value))
          : String(value)

      splices.push({ start: existing.value.start, end: existing.value.end, text })
      continue
    }

    // Add: locate the parent object (creating it if the parent path doesn't exist).
    const parentPath = path.slice(0, -1)
    let target = site.object

    if (parentPath.length) {
      const found = findObjectAtPath(site.object, parentPath)

      if (found) {
        target = found
      } else {
        // Create `_hover: { color: 'x' }` — add the whole chain at the root object.
        const chain = buildChain(
          parentPath,
          path[path.length - 1],
          value,
          code,
          site.object,
          deletedProps,
        )

        splices.push(chain)
        continue
      }
    }

    splices.push(addProp(code, target, path[path.length - 1], value, deletedProps))
  }

  for (const key of draft.delete) {
    const node = site.propNodes.get(key)

    if (!node) {
      continue
    } // draft-added (no source) or already gone

    splices.push(deleteProp(code, node.prop))
  }

  return splices.sort((a, b) => b.start - a.start)
}

function buildChain(
  parentPath: string[],
  lastKey: string,
  value: StyleValue,
  code: string,
  root: EstreeNode,
  deleted: Set<EstreeNode>,
): Splice {
  // Emit `{ k1: { k2: { last: v } } }` — formatted like the file's own multiline
  // style only when the root object is multiline; nested parents get one-line
  // objects to keep the edit compact.
  const inner = `${propKey(lastKey)}: ${typeof value === 'string' ? serializeLiteral(value, "'") : String(value)}`
  let text = `{ ${inner} }`

  // Inner parents become nested objects; the outermost parent is a property.
  for (let i = parentPath.length - 1; i >= 1; i--) {
    text = `{ ${propKey(parentPath[i])}: ${text} }`
  }

  return addRaw(code, root, `${propKey(parentPath[0])}: ${text}`, deleted)
}

// Insert a property into an existing object literal.
function addProp(
  code: string,
  obj: EstreeNode,
  key: string,
  value: StyleValue,
  deleted: Set<EstreeNode>,
): Splice {
  return addRaw(
    code,
    obj,
    `${propKey(key)}: ${typeof value === 'string' ? serializeLiteral(value, "'") : String(value)}`,
    deleted,
  )
}

function addRaw(code: string, obj: EstreeNode, propText: string, deleted: Set<EstreeNode>): Splice {
  const props = ((obj.properties as EstreeNode[]) ?? []).filter((p) => !deleted.has(p))
  const open = obj.start // '{'
  const close = obj.end - 1 // '}'

  if (!props.length) {
    const oneLine = !code.slice(open, close).includes('\n')

    return {
      start: open + 1,
      end: close,
      text: oneLine
        ? ` ${propText} `
        : `\n${indentOf(code, open)}\t${propText}\n${indentOf(code, open)}`,
    }
  }

  const last = props[props.length - 1]
  const first = props[0]
  const multiline = code.slice(obj.start, obj.end).includes('\n')

  if (!multiline) {
    // `{ a: 1 }` → `{ a: 1, b: 2 }`
    return { start: last.end, end: last.end, text: `, ${propText}` }
  }

  // Sibling indentation = first prop's indent; match trailing comma presence.
  const indent = indentOf(code, first.start)
  const after = code.slice(last.end, close)
  const comma = after.match(/^\s*,/)

  if (comma) {
    // Insert after the existing trailing comma.
    const at = last.end + comma[0].length

    return { start: at, end: at, text: `\n${indent}${propText},` }
  }

  return {
    start: last.end,
    end: last.end,
    text: `,\n${indent}${propText},`,
  }
}

// Remove a property plus its comma; drop the whole line when it owns one.
function deleteProp(code: string, prop: EstreeNode): Splice {
  // Extend to the following comma, else the preceding one.
  let start = prop.start
  let end = prop.end

  if (code[end] === ',') {
    end++
  } else if (code[start - 1] === ',') {
    start--
  }

  // If the prop owns its line (only whitespace around), drop the line break too.
  const lineStart = code.lastIndexOf('\n', start - 1) + 1
  const before = code.slice(lineStart, start)
  const nlAfter = code.indexOf('\n', end)
  const after = nlAfter < 0 ? '' : code.slice(end, nlAfter)

  if (/^\s*$/.test(before) && /^\s*$/.test(after)) {
    start = lineStart
    end = nlAfter < 0 ? end : nlAfter + 1
  }

  return { start, end, text: '' }
}

export function applySplices(code: string, splices: Splice[]): string {
  let out = code

  for (const s of [...splices].sort((a, b) => b.start - a.start)) {
    out = out.slice(0, s.start) + s.text + out.slice(s.end)
  }

  return out
}
