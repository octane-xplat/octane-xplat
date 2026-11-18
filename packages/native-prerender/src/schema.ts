export type Literal = null | boolean | number | string | Literal[] | LiteralObject
export type LiteralObject = { [key: string]: Literal }
export type ContainerKind = 'masonview' | 'scrollview'
export type PlaceholderKind = 'activityindicator' | 'svgview' | 'image'
export type HostKind = ContainerKind | 'label' | '#text' | PlaceholderKind
export type PlaceholderPropType = 'string' | 'boolean' | 'style'
/**
 * Unsupported leaf hosts mount an empty, authored-size Mason box; hydration
 * replaces it. Each entry is the allowed prop table with its value type.
 */
export const PLACEHOLDER_HOSTS: Readonly<
  Record<PlaceholderKind, Readonly<Record<string, PlaceholderPropType>>>
> = Object.freeze({
  activityindicator: Object.freeze({
    id: 'string',
    className: 'string',
    style: 'style',
    busy: 'boolean',
  }),
  svgview: Object.freeze({
    id: 'string',
    className: 'string',
    style: 'style',
    src: 'string',
    stretch: 'string',
    accessible: 'boolean',
    accessibilityLabel: 'string',
  }),
  image: Object.freeze({
    id: 'string',
    className: 'string',
    style: 'style',
    stretch: 'string',
    loadMode: 'string',
    accessibilityLabel: 'string',
  }),
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
/**
 * A persisted string setting resolved once before native mount. The first cut
 * only supports enum-string reads from the same store `ApplicationSettings`
 * uses; `default` is the value used when the stored key is absent. A resolved
 * value outside `values` (with `default === null` the absent/`null` point also
 * belongs to the domain) never selects a tree.
 */
export type LaunchInput = {
  name: string
  source: 'appSettings.string'
  values: string[]
  default: string | null
}
/**
 * One prerendered tree for a launch-input bind. `bind` carries every declared
 * input name with either one of its declared values or `null` (only declared
 * when the input's `default` is `null`). Each tree owns its logical nodes and
 * both system-appearance style variants, so binds may differ in topology.
 */
export type StartupTree = {
  bind: LiteralObject
  nodes: LogicalNode[]
  variants: { light: StyleRecord[]; dark: StyleRecord[] }
}
/**
 * Artifacts without `launchInputs` keep the flat `nodes` + `variants` form
 * (byte-for-byte compatible). Artifacts with launch inputs carry the
 * declaration plus one `StartupTree` per point of the declared input product;
 * launch resolves each input and must fall back to JavaScript boot when the
 * resolved values match no bind.
 */
export type StartupArtifact = {
  version: 1
  platform: 'ios' | 'android'
  hostContract: 'mason-label-v1'
  build: string
  seed: LiteralObject
  constraints: LaunchConstraint[]
} & (
  | {
      nodes: LogicalNode[]
      variants: { light: StyleRecord[]; dark: StyleRecord[] }
      launchInputs?: never
      trees?: never
    }
  | {
      launchInputs: LaunchInput[]
      trees: StartupTree[]
      nodes?: never
      variants?: never
    }
)
export const ARTIFACT_LIMITS = Object.freeze({
  nodes: 1024,
  depth: 64,
  values: 100000,
  bytes: 1048576,
  debugBytes: 8388608,
  launchInputs: 8,
  launchValues: 4,
  trees: 8,
})
/** Total logical nodes across the artifact; also the header node count. */
export function artifactNodeCount(artifact: StartupArtifact): number {
  return artifact.trees
    ? artifact.trees.reduce((count, tree) => count + tree.nodes.length, 0)
    : artifact.nodes.length
}
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
  'gridColumn',
  'gridRow',
  'gridTemplateColumns',
  'gridTemplateRows',
  'height',
  'justifyContent',
  'justifySelf',
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

/**
 * Bounded enum-style style values, aligned with the native Mason backend
 * contract. The loading `Button` grid (one shared 1x1 cell plus self
 * alignments) is the whole supported subset; unlisted keys stay structural.
 */
export const STYLE_VALUE_BOUNDS: Readonly<Record<string, readonly string[]>> = Object.freeze({
  alignSelf: Object.freeze(['center', 'stretch']),
  display: Object.freeze(['block', 'flex', 'grid']),
  gridColumn: Object.freeze(['1']),
  gridRow: Object.freeze(['1']),
  gridTemplateColumns: Object.freeze(['1fr']),
  gridTemplateRows: Object.freeze(['1fr']),
  justifySelf: Object.freeze(['center', 'stretch']),
})
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
        const type = allowed[key]
        requireArtifact(type !== undefined, 'unsupported host prop ' + key)
        if (type === 'string') {string(props[key], 'host prop ' + key)}
        else if (type === 'boolean')
          {requireArtifact(typeof props[key] === 'boolean', 'boolean host prop')}
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
    const bounds = STYLE_VALUE_BOUNDS[key]
    if (bounds !== undefined)
      {requireArtifact(typeof value === 'string' && bounds.includes(value), 'style value')}
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
function validateVariants(
  input: unknown,
  visual: LogicalNode[],
): { light: StyleRecord[]; dark: StyleRecord[] } {
  const variants = record(input, 'variants')
  keys(variants, ['light', 'dark'], 'variants')
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
  return { light: variant(variants.light), dark: variant(variants.dark) }
}
function validateLaunchInputs(input: unknown): LaunchInput[] {
  requireArtifact(
    Array.isArray(input) && input.length >= 1 && input.length <= ARTIFACT_LIMITS.launchInputs,
    'launch inputs',
  )
  const seen = new Set<string>()
  const launchInputs = input.map((value) => {
    const item = record(value, 'launch input')
    keys(item, ['name', 'source', 'values', 'default'], 'launch input')
    const name = string(item.name, 'launch input name')
    requireArtifact(
      name.length <= 128 && /^[\x20-\x7e]+$/.test(name),
      'launch input name must be printable ASCII',
    )
    requireArtifact(!seen.has(name), 'duplicate launch input')
    seen.add(name)
    requireArtifact(item.source === 'appSettings.string', 'unsupported launch input source')
    requireArtifact(
      Array.isArray(item.values) &&
        item.values.length >= 1 &&
        item.values.length <= ARTIFACT_LIMITS.launchValues,
      'launch input values',
    )
    const values = item.values.map((value) => string(value, 'launch input value'))
    requireArtifact(new Set(values).size === values.length, 'duplicate launch input value')
    requireArtifact(
      item.default === null || values.includes(item.default as string),
      'launch input default',
    )
    return { name, source: 'appSettings.string' as const, values, default: item.default as string | null }
  })
  const product = launchInputs.reduce(
    (count, item) => count * (item.values.length + (item.default === null ? 1 : 0)),
    1,
  )
  requireArtifact(product <= ARTIFACT_LIMITS.trees, 'launch input product')
  return launchInputs
}
function validateTrees(input: unknown, launchInputs: LaunchInput[]): StartupTree[] {
  const domains = launchInputs.map((item) =>
    new Set<Literal>(item.default === null ? [...item.values, null] : item.values),
  )
  const product = domains.reduce((count, domain) => count * domain.size, 1)
  requireArtifact(Array.isArray(input) && input.length === product, 'tree count')
  let total = 0
  const seen = new Set<string>()
  const trees = input.map((value) => {
    const tree = record(value, 'tree')
    keys(tree, ['bind', 'nodes', 'variants'], 'tree')
    const input = record(tree.bind, 'tree bind')
    const bind: LiteralObject = Object.create(null)
    for (const [index, item] of launchInputs.entries()) {
      const value = input[item.name]
      requireArtifact(
        value !== undefined && domains[index].has(value as Literal),
        'tree bind value outside declared domain',
      )
      bind[item.name] = value as Literal
    }
    requireArtifact(Object.keys(input).length === launchInputs.length, 'tree bind inputs differ')
    const nodes = validateNodes(tree.nodes)
    total += nodes.length
    requireArtifact(total <= ARTIFACT_LIMITS.nodes, 'tree node count')
    const visual = nodes.filter((node) => node.kind !== '#text')
    const variants = validateVariants(tree.variants, visual)
    const canonical = launchInputs
      .map((item) => item.name + '=' + JSON.stringify(bind[item.name]))
      .join('&')
    requireArtifact(!seen.has(canonical), 'duplicate tree bind')
    seen.add(canonical)
    return { bind, nodes, variants }
  })
  return trees
}
export function validateArtifact(input: unknown): StartupArtifact {
  const value = record(input, 'artifact')
  const layered =
    Object.hasOwn(value, 'launchInputs') || Object.hasOwn(value, 'trees')
      ? ['version', 'platform', 'hostContract', 'build', 'seed', 'constraints', 'launchInputs', 'trees']
      : ['version', 'platform', 'hostContract', 'build', 'seed', 'constraints', 'nodes', 'variants']
  keys(value, layered, 'artifact')
  requireArtifact(
    value.version === 1 && value.hostContract === 'mason-label-v1',
    'unsupported schema or host contract',
  )
  const platform = value.platform
  requireArtifact(platform === 'ios' || platform === 'android', 'unsupported platform')
  const build = string(value.build, 'build identity')
  requireArtifact(/^[a-f0-9]{64}$/.test(build), 'expected SHA-256 build identity')
  const seed = copyProps(value.seed)
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
  if (Object.hasOwn(value, 'launchInputs') || Object.hasOwn(value, 'trees')) {
    const launchInputs = validateLaunchInputs(value.launchInputs)
    const trees = validateTrees(value.trees, launchInputs)
    return {
      version: 1,
      platform,
      hostContract: 'mason-label-v1',
      build,
      seed,
      constraints,
      launchInputs,
      trees,
    }
  }
  const nodes = validateNodes(value.nodes)
  const visual = nodes.filter((node) => node.kind !== '#text')
  return {
    version: 1,
    platform,
    hostContract: 'mason-label-v1',
    build,
    seed,
    constraints,
    nodes,
    variants: validateVariants(value.variants, visual),
  }
}
