function requireCondition(value, message) {
  if (!value) throw new Error('Pre-render adoption: ' + message)
}

function canonical(value, path, depth = 0) {
  requireCondition(depth < 32, 'property nesting limit at ' + path)
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'number') {
    requireCondition(Number.isFinite(value), 'non-finite property at ' + path)
    return value
  }
  requireCondition(typeof value === 'object', 'nonportable property at ' + path)
  const prototype = Object.getPrototypeOf(value)
  requireCondition(
    Array.isArray(value) || prototype === Object.prototype || prototype === null,
    'nonplain property at ' + path,
  )
  if (Array.isArray(value))
    return value.map((item, index) => canonical(item, path + '/' + index, depth + 1))
  const result = Object.create(null)
  for (const key of Object.keys(value).sort()) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    requireCondition(Object.hasOwn(descriptor, 'value'), 'property accessor at ' + path + '/' + key)
    if (descriptor.value !== undefined)
      result[key] = canonical(descriptor.value, path + '/' + key, depth + 1)
  }
  return result
}

function propsKey(props, path) {
  requireCondition(
    props !== null && typeof props === 'object' && !Array.isArray(props),
    'invalid props at ' + path,
  )
  return JSON.stringify(canonical(props, path))
}

/** Match the fixed container/Label projection before consuming any native claims.
 * IDs returned here belong only to this prepared batch; never serialize them.
 * This checks visual topology, initial props/text and logical node count. It is
 * not a production IR decoder, native-class check or stable compiler identity.
 */
export function matchPreparedVisualTree(commands, expectedNodes, logicalNodeCount) {
  requireCondition(Array.isArray(commands) && Array.isArray(expectedNodes), 'expected arrays')
  requireCondition(
    Number.isSafeInteger(logicalNodeCount) && logicalNodeCount > 0 && logicalNodeCount <= 1024,
    'invalid logical node count',
  )
  const created = new Map()
  const parented = new Set()
  const roots = []
  for (const command of commands) {
    requireCondition(command !== null && typeof command === 'object', 'invalid command')
    if (command.op === 'create') {
      requireCondition(
        Number.isSafeInteger(command.id) && command.id >= 0 && !created.has(command.id),
        'invalid or duplicate command identity',
      )
      requireCondition(
        ['masonview', 'label', '#text'].includes(command.type),
        'unsupported initial host type',
      )
      propsKey(command.props, 'command props')
      created.set(command.id, { ...command, children: [] })
      requireCondition(created.size <= logicalNodeCount, 'too many logical nodes')
    } else if (command.op === 'insert') {
      const node = created.get(command.id)
      const parent = command.parent === null ? null : created.get(command.parent)
      requireCondition(node && (command.parent === null || parent), 'unknown insertion reference')
      requireCondition(parent?.type !== '#text', 'text cannot contain children')
      requireCondition(!parented.has(node.id), 'duplicate logical parent')
      const siblings = parent === null ? roots : parent.children
      const before =
        command.before === null
          ? siblings.length
          : siblings.findIndex((sibling) => sibling.id === command.before)
      requireCondition(before >= 0, 'unknown insertion anchor')
      siblings.splice(before, 0, node)
      parented.add(node.id)
    } else if (command.op === 'event') {
      const node = created.get(command.id)
      requireCondition(node && node.type !== '#text', 'unknown event host')
    } else {
      throw new Error('Pre-render adoption: unsupported initial command')
    }
  }
  requireCondition(
    created.size === logicalNodeCount && roots.length === 1,
    'logical topology differs',
  )
  const indicesByCommandId = new Map()
  const visited = new Set()
  function visit(node, path, parent, depth) {
    requireCondition(depth < 64 && !visited.has(node.id), 'cyclic or excessive tree depth')
    visited.add(node.id)
    const index = indicesByCommandId.size
    const expected = expectedNodes[index]
    requireCondition(
      expected &&
        expected.index === index &&
        expected.path === path &&
        expected.parent === parent &&
        expected.kind === node.type,
      'visual topology differs at ' + path,
    )
    requireCondition(
      propsKey(node.props, path) === propsKey(expected.props, path),
      'initial props differ at ' + path,
    )
    requireCondition(Array.isArray(expected.children), 'invalid visual children at ' + path)
    indicesByCommandId.set(node.id, index)
    if (node.type === 'label') {
      requireCondition(
        expected.children.length === 0 && node.children.every((child) => child.type === '#text'),
        'unsupported Label child at ' + path,
      )
      requireCondition(
        node.children.length === 0 || node.props.text === undefined,
        'ambiguous Label text at ' + path,
      )
      let text = node.props.text ?? ''
      if (node.children.length)
        text = node.children
          .map((child) => {
            requireCondition(
              !visited.has(child.id) && child.children.length === 0,
              'invalid logical text node',
            )
            visited.add(child.id)
            const value = child.props.value
            requireCondition(
              value == null || ['string', 'number', 'boolean'].includes(typeof value),
              'nonportable text at ' + path,
            )
            return value == null ? '' : String(value)
          })
          .join('')
      requireCondition(
        typeof text === 'string' && text === expected.text,
        'initial text differs at ' + path,
      )
    } else {
      requireCondition(
        node.type === 'masonview' && node.children.length === expected.children.length,
        'visual child count differs at ' + path,
      )
      node.children.forEach((child, slot) => {
        requireCondition(
          expected.children[slot] === indicesByCommandId.size,
          'visual child index differs at ' + path,
        )
        visit(child, path + '/' + slot, index, depth + 1)
      })
    }
  }
  visit(roots[0], '0', null, 0)
  requireCondition(
    visited.size === created.size &&
      parented.size === created.size &&
      indicesByCommandId.size === expectedNodes.length,
    'unreachable or unmatched nodes',
  )
  return indicesByCommandId
}
