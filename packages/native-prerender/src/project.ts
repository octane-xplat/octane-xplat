import {
  ARTIFACT_LIMITS,
  isHostKind,
  isPlaceholderKind,
  copyLiteral,
  integer,
  record,
  requireArtifact,
  validateNodes,
} from './schema.ts'
import type { HostKind, LiteralObject, LogicalNode } from './schema.ts'

type PendingNode = { id: number; kind: HostKind; props: LiteralObject; children: PendingNode[] }
export type PreparedProjection = { nodes: LogicalNode[]; logicalByCommandId: Map<number, number> }
export type VisualNode = {
  index: number
  logicalNode: number
  path: string
  parent: number | null
  kind: 'masonview' | 'scrollview' | 'label' | 'placeholder'
  /** The logical kind a placeholder replaces at hydration; unset on real hosts. */
  hostKind?: HostKind
  props: LiteralObject
  children: number[]
  text: string
}
export type PreparedMatch = {
  logicalByCommandId: Map<number, number>
  visualByCommandId: Map<number, number>
}

// Mirror the nativescript-octane driver's clsx-style className join.
function normalizeClass(value: unknown): string {
  if (typeof value === 'number') {
    return value ? String(value) : ''
  }
  if (typeof value === 'string') {
    return value
  }
  if (Array.isArray(value)) {
    return value.map(normalizeClass).filter(Boolean).join(' ')
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .filter((key) => Reflect.get(value, key))
      .join(' ')
  }
  return ''
}

function commandProps(input: unknown): LiteralObject {
  function object(input: unknown, depth: number): LiteralObject {
    requireArtifact(depth < 24, 'command props nesting limit')
    const props = record(input, 'command props')
    const portable: LiteralObject = Object.create(null)
    for (const key of Object.keys(props).sort()) {
      const value = props[key]
      if (value === undefined) {continue}
      portable[key] =
        depth === 0 && key === 'className'
          ? normalizeClass(value)
          : value !== null && typeof value === 'object' && !Array.isArray(value)
            ? object(value, depth + 1)
            : copyLiteral(value)
    }
    return portable
  }
  return object(input, 0)
}

/** Command IDs belong only to this prepared batch and never enter artifact nodes. */
export function projectPreparedTree(input: unknown): PreparedProjection {
  requireArtifact(
    Array.isArray(input) && input.length <= ARTIFACT_LIMITS.nodes * 4,
    'prepared command count',
  )
  const created = new Map<number, PendingNode>()
  const parented = new Set<number>()
  const roots: PendingNode[] = []
  for (const value of input) {
    const command = record(value, 'prepared command')
    const id = integer(command.id, 0, Number.MAX_SAFE_INTEGER, 'command id')
    if (command.op === 'create') {
      const kind = command.type
      requireArtifact(
        !created.has(id) && created.size < ARTIFACT_LIMITS.nodes,
        'duplicate or excessive hosts',
      )
      requireArtifact(isHostKind(kind), 'unsupported host kind')
      const props = commandProps(command.props)
      if (kind === '#text') {
        const value = props.value
        requireArtifact(
          value == null || ['string', 'number', 'boolean'].includes(typeof value),
          'nonportable text value',
        )
        // Resolve ECMAScript number/boolean formatting once; native consumers
        // must not reproduce String(number) or lose logical text-slot boundaries.
        props.value = value == null ? '' : String(value)
      }
      created.set(id, { id, kind, props, children: [] })
    } else if (command.op === 'insert') {
      const node = created.get(id)
      const parent =
        command.parent === null
          ? null
          : created.get(integer(command.parent, 0, Number.MAX_SAFE_INTEGER, 'parent command id'))
      requireArtifact(
        node && (command.parent === null || parent) && !parented.has(id),
        'unknown or repeated insertion',
      )
      requireArtifact(parent?.kind !== '#text', 'text host cannot own children')
      const siblings = parent ? parent.children : roots
      const before =
        command.before === null
          ? siblings.length
          : siblings.findIndex((item) => item.id === command.before)
      requireArtifact(before >= 0, 'unknown insertion anchor')
      siblings.splice(before, 0, node)
      parented.add(id)
    } else {
      // Event closures are reconstructed by client preparation, never persisted.
      requireArtifact(
        command.op === 'event' && created.has(id) && created.get(id)?.kind !== '#text',
        'unsupported initial command',
      )
    }
  }
  requireArtifact(
    roots.length === 1 && created.size === parented.size,
    'one complete root required',
  )
  const nodes: LogicalNode[] = []
  const logicalByCommandId = new Map<number, number>()
  function visit(node: PendingNode, parent: number | null, path: string, depth: number) {
    requireArtifact(
      depth < ARTIFACT_LIMITS.depth && !logicalByCommandId.has(node.id),
      'cyclic or excessive tree',
    )
    const index = nodes.length
    logicalByCommandId.set(node.id, index)
    nodes.push({ index, path, parent, kind: node.kind, props: node.props })
    node.children.forEach((child, slot) => visit(child, index, path + '/' + slot, depth + 1))
  }
  visit(roots[0], null, '0', 0)
  requireArtifact(nodes.length === created.size, 'unreachable hosts')
  return { nodes: validateNodes(nodes), logicalByCommandId }
}

/** Native projection is derived from logical ownership, including Label text slots. */
export function projectVisualTree(input: unknown): VisualNode[] {
  const nodes = validateNodes(input)
  const visual: VisualNode[] = []
  const indices = new Map<number, number>()
  for (const node of nodes) {
    if (node.kind === '#text') {
      const owner = node.parent === null ? undefined : indices.get(node.parent)
      requireArtifact(owner !== undefined, 'text owner missing')
      const value = node.props.value
      visual[owner].text += value === null ? '' : String(value)
      continue
    }
    const index = visual.length
    const parent = node.parent === null ? null : indices.get(node.parent)
    requireArtifact(parent !== undefined, 'visual parent missing')
    const path = parent === null ? '0' : visual[parent].path + '/' + visual[parent].children.length
    const value = node.props.text
    const text = value === undefined ? '' : value
    requireArtifact(typeof text === 'string', 'label text')
    const kind = isPlaceholderKind(node.kind) ? 'placeholder' : node.kind
    const placeholder = kind === 'placeholder'
    visual.push({
      index,
      logicalNode: node.index,
      path,
      parent,
      kind,
      ...(placeholder ? { hostKind: node.kind } : {}),
      props: node.props,
      children: [],
      text,
    })
    indices.set(node.index, index)
    if (parent !== null) {visual[parent].children.push(index)}
  }
  return visual
}

/** Match full text ownership before any native claim; folded text alone is insufficient. */
export function matchPreparedTree(commands: unknown, expected: unknown): PreparedMatch {
  const projected = projectPreparedTree(commands)
  const nodes = validateNodes(expected)
  requireArtifact(
    JSON.stringify(projected.nodes) === JSON.stringify(nodes),
    'prepared logical tree differs',
  )
  const visual = new Map(projectVisualTree(nodes).map((node) => [node.logicalNode, node.index]))
  const visualByCommandId = new Map<number, number>()
  for (const [id, logical] of projected.logicalByCommandId) {
    const index = visual.get(logical)
    if (index !== undefined) {visualByCommandId.set(id, index)}
  }
  return { logicalByCommandId: projected.logicalByCommandId, visualByCommandId }
}
