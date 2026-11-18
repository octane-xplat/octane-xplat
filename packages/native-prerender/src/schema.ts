export type Literal = null | boolean | number | string | Literal[] | LiteralObject
export type LiteralObject = { [key: string]: Literal }
export type ContainerKind = 'masonview' | 'scrollview'
export type PlaceholderKind = 'activityindicator'
export type HostKind = ContainerKind | 'label' | '#text' | PlaceholderKind
/** Unsupported leaf hosts mount an empty, authored-size Mason box; hydration replaces it. */
export const PLACEHOLDER_HOSTS: Readonly<Record<PlaceholderKind, readonly string[]>> =
  Object.freeze({
    activityindicator: Object.freeze(['id', 'className', 'style', 'busy']),
  })
export function isPlaceholderKind(value: unknown): value is PlaceholderKind {
  return typeof value === 'string' && Object.hasOwn(PLACEHOLDER_HOSTS, value)
}
/** Mason layout containers; `scrollview` is MasonKit's Scroll (a Mason view with scroll overflow). */
export function isContainerKind(value: unknown): value is ContainerKind {
  return value === 'masonview' || value === 'scrollview'
}
export function isHostKind(value: unknown): value is HostKind {
  return (
    isContainerKind(value) || value === 'label' || value === '#text' || isPlaceholderKind(value)
  )
}
export type LogicalNode = {
  index: number
  path: string
  parent: number | null
  kind: HostKind
  props: LiteralObject
}
export type StyleRecord = {
  node: number
  style: Record<string, string | number>
  cssKeys: string[]
  inheritedKeys: string[]
}
export type SafeAreaInsetInput =
  | 'safeAreaTop'
  | 'safeAreaRight'
  | 'safeAreaBottom'
  | 'safeAreaLeft'
export type LaunchConstraint =
  | { input: 'fontScale'; equals: 1 }
  | { input: 'reducedMotion'; equals: boolean }
  | { input: 'width' | 'height'; min: number; max: number }
  | { input: SafeAreaInsetInput; equals: number }
export type StartupArtifact = {
  version: 1
  platform: 'ios' | 'android'
  hostContract: 'mason-label-v1'
  build: string
  seed: LiteralObject
  constraints: LaunchConstraint[]
  nodes: LogicalNode[]
  variants: { light: StyleRecord[]; dark: StyleRecord[] }
}
export const ARTIFACT_LIMITS = Object.freeze({
  nodes: 1024,
  depth: 64,
  values: 100000,
  bytes: 1048576,
  debugBytes: 8388608,
})
export const STYLE_KEYS: readonly string[] = Object.freeze([
  'alignItems',
  'alignSelf',
  'backgroundColor',
  'borderRadius',
  'borderWidth',
  'color',
  'columnGap',
  'cornerShape',
  'display',
  'flexDirection',
  'flexGrow',
  'flexShrink',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'height',
  'justifyContent',
  'lineHeight',
  'maxHeight',
  'maxWidth',
  'minWidth',
  'minHeight',
  'opacity',
  'overflowX',
  'overflowY',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'rowGap',
  'textOverflow',
  'userSelect',
  'whiteSpace',
  'width',
])

export class ArtifactError extends Error {
  constructor(message: string) {
    super('Native startup IR: ' + message)
  }
}
export function requireArtifact(value: unknown, message: string): asserts value {
  if (!value) {throw new ArtifactError(message)}
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value))
  )
}
export function record(value: unknown, path: string): Record<string, unknown> {
  requireArtifact(isRecord(value), path + ' must be a plain object')
  for (const key of Reflect.ownKeys(value)) {
    requireArtifact(typeof key === 'string', path + ' contains a symbol key')
    const descriptor = Object.getOwnPropertyDescriptor(value, key)
    requireArtifact(
      descriptor?.enumerable && Object.hasOwn(descriptor, 'value'),
      path + ' contains a hidden property or accessor',
    )
  }
  return value
}
function keys(value: Record<string, unknown>, expected: string[], path: string) {
  requireArtifact(
    Object.keys(value).sort().join(',') === expected.sort().join(','),
    path + ' fields differ',
  )
}
export function string(value: unknown, path: string): string {
  requireArtifact(
    typeof value === 'string' && value.isWellFormed() && value.length <= 65536,
    path + ' must be a bounded Unicode string',
  )
  return value
}
export function integer(value: unknown, min: number, max: number, path: string): number {
  requireArtifact(
    typeof value === 'number' && Number.isSafeInteger(value) && value >= min && value <= max,
    path + ' is out of range',
  )
  return value
}
export function copyLiteral(value: unknown): Literal {
  let remaining = ARTIFACT_LIMITS.values
  function visit(value: unknown, depth: number): Literal {
    requireArtifact(--remaining >= 0 && depth < 24, 'literal complexity limit')
    if (value === null || typeof value === 'boolean') {return value}
    if (typeof value === 'string') {return string(value, 'literal')}
    if (typeof value === 'number') {
      requireArtifact(Number.isFinite(value), 'non-finite literal')
      return value === 0 ? 0 : value
    }
    if (Array.isArray(value)) {
      requireArtifact(value.length <= 1024, 'literal array limit')
      requireArtifact(
        Reflect.ownKeys(value).length === value.length + 1,
        'sparse array or extra properties',
      )
      return Array.from({ length: value.length }, (_, i) => {
        const descriptor = Object.getOwnPropertyDescriptor(value, String(i))
        requireArtifact(
          descriptor && Object.hasOwn(descriptor, 'value'),
          'sparse or accessor array',
        )
        return visit(descriptor.value, depth + 1)
      })
    }
    const input = record(value, 'literal')
    requireArtifact(Object.keys(input).length <= 256, 'literal object limit')
    const result: LiteralObject = Object.create(null)
    for (const key of Object.keys(input).sort()) {
      string(key, 'literal key')
      result[key] = visit(input[key], depth + 1)
    }
    return result
  }
  return visit(value, 0)
}
export function copyProps(value: unknown): LiteralObject {
  record(value, 'props')
  const copied = copyLiteral(value)
  requireArtifact(
    copied !== null && typeof copied === 'object' && !Array.isArray(copied),
    'props must be an object',
  )
  return copied
}

/** Validate and detach the portable logical tree before native allocation. */
export function validateNodes(input: unknown): LogicalNode[] {
  requireArtifact(
    Array.isArray(input) && input.length > 0 && input.length <= ARTIFACT_LIMITS.nodes,
    'node count',
  )
  const nodes: LogicalNode[] = []
  const children: number[][] = input.map(() => [])
  for (const [index, value] of input.entries()) {
    const node = record(value, 'node')
    keys(node, ['index', 'path', 'parent', 'kind', 'props'], 'node')
    requireArtifact(node.index === index, 'node index')
    const kind = node.kind
    requireArtifact(isHostKind(kind), 'unsupported host kind')
    let parent: number | null = null
    if (index === 0)
      {requireArtifact(node.parent === null && kind !== '#text', 'root kind or parent')}
    else {
      parent = integer(node.parent, 0, index - 1, 'node parent')
      const owner = nodes[parent]
      requireArtifact(
        isContainerKind(owner.kind)
          ? kind !== '#text'
          : owner.kind === 'label' && kind === '#text',
        'invalid child kind',
      )
    }
    const path = parent === null ? '0' : nodes[parent].path + '/' + children[parent].length
    requireArtifact(node.path === path, 'node address')
    requireArtifact(path.split('/').length <= ARTIFACT_LIMITS.depth, 'tree depth')
    const props = copyProps(node.props)
    if (kind === '#text') {
      requireArtifact(Object.keys(props).join(',') === 'value', 'text props')
      string(props.value, 'canonical text value')
    } else if (isPlaceholderKind(kind)) {
      const allowed = PLACEHOLDER_HOSTS[kind]
      for (const key of Object.keys(props)) {
        requireArtifact(allowed.includes(key), 'unsupported host prop ' + key)
        if (key === 'id' || key === 'className') {string(props[key], 'host prop ' + key)}
        else if (key === 'busy') {requireArtifact(typeof props[key] === 'boolean', 'boolean host prop')}
        else {validateStyle(props[key])}
      }
    } else {
      for (const key of Object.keys(props)) {
        if (
          [
            'id',
            'className',
            'text',
            'testID',
            'whiteSpace',
            'accessibilityRole',
            'accessibilityLabel',
            'accessibilityHint',
            'accessibilityState',
            'accessibilityValue',
          ].includes(key)
        )
          {string(props[key], 'host prop ' + key)}
        else if (['accessible', 'isEnabled', 'iosIgnoreSafeArea'].includes(key))
          {requireArtifact(typeof props[key] === 'boolean', 'boolean host prop')}
        else if (key === 'maxLines') {integer(props[key], 0, 1000000, key)}
        else if (key === 'orientation')
          {requireArtifact(kind === 'scrollview' && ['vertical', 'horizontal'].includes(props[key] as string), 'scroll orientation')}
        else if (key === 'style') {validateStyle(props[key])}
        else {throw new ArtifactError('unsupported host prop ' + key)}
      }
      requireArtifact(kind === 'label' || props.text === undefined, 'container text prop')
    }
    nodes.push({ index, path, parent, kind, props })
    if (parent !== null) {children[parent].push(index)}
  }
  let next = 0
  function visit(index: number) {
    requireArtifact(index === next++, 'nodes must use depth-first order')
    const node = nodes[index]
    requireArtifact(
      node.kind !== 'label' || !children[index].length || node.props.text === undefined,
      'ambiguous label content',
    )
    for (const child of children[index]) {visit(child)}
  }
  visit(0)
  requireArtifact(next === nodes.length, 'unreachable node')
  return nodes
}
function validateStyle(value: unknown): Record<string, string | number> {
  const input = record(value, 'style')
  const style: Record<string, string | number> = Object.create(null)
  for (const key of Object.keys(input).sort()) {
    const value = input[key]
    requireArtifact(STYLE_KEYS.includes(key), 'unsupported style ' + key)
    if (typeof value === 'string' && key !== 'opacity') {style[key] = string(value, 'style value')}
    else {
      requireArtifact(typeof value === 'number' && Number.isFinite(value), 'style value')
      requireArtifact(key !== 'opacity' || (value >= 0 && value <= 1), 'style value')
      style[key] = value === 0 ? 0 : value
    }
  }
  return style
}
function provenance(value: unknown, style: Record<string, string | number>): string[] {
  requireArtifact(Array.isArray(value) && value.length <= STYLE_KEYS.length, 'style provenance')
  const result = value.map((key) => string(key, 'style provenance key'))
  requireArtifact(
    new Set(result).size === result.length && result.every((key) => Object.hasOwn(style, key)),
    'style provenance keys',
  )
  return result.sort()
}
export function validateArtifact(input: unknown): StartupArtifact {
  const value = record(input, 'artifact')
  keys(
    value,
    ['version', 'platform', 'hostContract', 'build', 'seed', 'constraints', 'nodes', 'variants'],
    'artifact',
  )
  requireArtifact(
    value.version === 1 && value.hostContract === 'mason-label-v1',
    'unsupported schema or host contract',
  )
  const platform = value.platform
  requireArtifact(platform === 'ios' || platform === 'android', 'unsupported platform')
  const build = string(value.build, 'build identity')
  requireArtifact(/^[a-f0-9]{64}$/.test(build), 'expected SHA-256 build identity')
  const seed = copyProps(value.seed)
  const nodes = validateNodes(value.nodes)
  requireArtifact(
    Array.isArray(value.constraints) && value.constraints.length <= 8,
    'launch constraints',
  )
  const seen = new Set<string>()
  const constraints: LaunchConstraint[] = value.constraints.map((input) => {
    const constraint = record(input, 'constraint')
    const name = constraint.input
    requireArtifact(typeof name === 'string' && !seen.has(name), 'duplicate or invalid constraint')
    seen.add(name)
    if (name === 'fontScale') {
      keys(constraint, ['input', 'equals'], 'font scale constraint')
      requireArtifact(constraint.equals === 1, 'unsupported native font scale')
      return { input: name, equals: 1 }
    }
    if (name === 'reducedMotion') {
      keys(constraint, ['input', 'equals'], 'motion constraint')
      requireArtifact(typeof constraint.equals === 'boolean', 'motion constraint')
      return { input: name, equals: constraint.equals }
    }
    if (name.startsWith('safeArea')) {
      requireArtifact(
        ['safeAreaTop', 'safeAreaRight', 'safeAreaBottom', 'safeAreaLeft'].includes(name),
        'unknown launch input',
      )
      keys(constraint, ['input', 'equals'], 'safe area constraint')
      requireArtifact(
        typeof constraint.equals === 'number' &&
          Number.isFinite(constraint.equals) &&
          constraint.equals >= 0,
        'safe area inset',
      )
      return { input: name as SafeAreaInsetInput, equals: constraint.equals }
    }
    requireArtifact(name === 'width' || name === 'height', 'unknown launch input')
    keys(constraint, ['input', 'min', 'max'], 'dimension constraint')
    const min = constraint.min,
      max = constraint.max
    requireArtifact(
      typeof min === 'number' &&
        typeof max === 'number' &&
        Number.isFinite(min) &&
        Number.isFinite(max) &&
        min >= 0 &&
        max >= min,
      'dimension interval',
    )
    return { input: name, min, max }
  })
  requireArtifact(seen.has('fontScale'), 'native font scale preflight is required')
  const variants = record(value.variants, 'variants')
  keys(variants, ['light', 'dark'], 'variants')
  const visual = nodes.filter((node) => node.kind !== '#text')
  function variant(value: unknown): StyleRecord[] {
    requireArtifact(Array.isArray(value) && value.length === visual.length, 'variant node count')
    return value.map((value, index) => {
      const item = record(value, 'style record')
      keys(item, ['node', 'style', 'cssKeys', 'inheritedKeys'], 'style record')
      requireArtifact(item.node === visual[index].index, 'style node identity')
      const style = validateStyle(item.style)
      return {
        node: visual[index].index,
        style,
        cssKeys: provenance(item.cssKeys, style),
        inheritedKeys: provenance(item.inheritedKeys, style),
      }
    })
  }
  return {
    version: 1,
    platform,
    hostContract: 'mason-label-v1',
    build,
    seed,
    constraints,
    nodes,
    variants: { light: variant(variants.light), dark: variant(variants.dark) },
  }
}
