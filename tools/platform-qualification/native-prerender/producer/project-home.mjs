import { matchPreparedVisualTree } from '../match-tree.mjs'

function portable(value) {
  if (value === null || ['string', 'boolean'].includes(typeof value)) return value
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (Array.isArray(value)) return value.map(portable)
  if (
    value &&
    typeof value === 'object' &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value))
  ) {
    const result = {}
    for (const key of Object.keys(value).sort()) {
      const descriptor = Object.getOwnPropertyDescriptor(value, key)
      if (!Object.hasOwn(descriptor, 'value')) throw new Error('Home producer: property accessor')
      if (descriptor.value !== undefined) result[key] = portable(descriptor.value)
    }
    return result
  }
  throw new Error('Home producer: nonportable host property')
}

export function projectHome(commands) {
  const created = new Map()
  const roots = []
  const parented = new Set()
  for (const command of commands) {
    if (command.op === 'create') {
      if (created.has(command.id) || !['masonview', 'label', '#text'].includes(command.type))
        throw new Error('Home producer: unsupported or duplicate host')
      created.set(command.id, { ...command, props: portable(command.props), children: [] })
    } else if (command.op === 'insert') {
      const node = created.get(command.id)
      const parent = command.parent === null ? null : created.get(command.parent)
      const siblings = command.parent === null ? roots : parent?.children
      if (!node || !siblings || parented.has(command.id))
        throw new Error('Home producer: invalid parent')
      const slot =
        command.before === null
          ? siblings.length
          : siblings.findIndex((node) => node.id === command.before)
      if (slot < 0) throw new Error('Home producer: invalid insertion anchor')
      siblings.splice(slot, 0, node)
      parented.add(command.id)
    } else {
      throw new Error('Home producer: unsupported initial command ' + command.op)
    }
  }
  if (created.size !== 27 || roots.length !== 1)
    throw new Error('Home producer: unexpected fixed Home topology')
  const nodes = []
  const visited = new Set()
  function visit(record, parent, path, depth) {
    if (depth > 32 || visited.has(record.id) || !['label', 'masonview'].includes(record.type))
      throw new Error('Home producer: invalid visual topology')
    visited.add(record.id)
    const node = {
      index: nodes.length,
      path,
      kind: record.type,
      parent,
      props: record.props,
      children: [],
      text: record.props.text ?? '',
    }
    nodes.push(node)
    if (record.type === 'label') {
      if (
        record.children.some(
          (child) => child.type !== '#text' || child.children.length || visited.has(child.id),
        ) ||
        (record.children.length && record.props.text !== undefined)
      )
        throw new Error('Home producer: unsupported label content')
      if (record.children.length)
        node.text = record.children
          .map((child) => {
            visited.add(child.id)
            const value = child.props.value
            if (value != null && !['string', 'number', 'boolean'].includes(typeof value))
              throw new Error('Home producer: invalid text')
            return value == null ? '' : String(value)
          })
          .join('')
    } else {
      record.children.forEach((child, slot) =>
        node.children.push(visit(child, node.index, path + '/' + slot, depth + 1)),
      )
    }
    return node.index
  }
  visit(roots[0], null, '0', 0)
  if (visited.size !== created.size || nodes.length !== 19)
    throw new Error('Home producer: orphaned or unexpected nodes')
  // Reuse the hydration-side validator, including all source props and text.
  matchPreparedVisualTree(commands, nodes, 27)
  return nodes
}
