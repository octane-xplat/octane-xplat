import { analyseComplexValue, buildTransformer, color } from 'motion-dom'

/** Values understood by Motion's property codecs. */
export type MotionData = number | string

export const channelKeys = ['opacity', 'x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate'] as const
export const lengthKeys = [
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'top',
  'right',
  'bottom',
  'left',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'marginTop',
  'marginRight',
  'marginBottom',
  'marginLeft',
  'rowGap',
  'columnGap',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomRightRadius',
  'borderBottomLeftRadius',
] as const
export const compoundKeys = ['borderRadius', 'boxShadow', 'clipPath'] as const
export type MotionProperty =
  | (typeof channelKeys)[number]
  | (typeof lengthKeys)[number]
  | (typeof compoundKeys)[number]
export const propertyKeys: readonly MotionProperty[] = [
  ...channelKeys,
  ...lengthKeys,
  ...compoundKeys,
]

export type TargetErrorCode =
  | 'unsupported-property'
  | 'unsupported-platform'
  | 'invalid-value'
  | 'unresolved-reference'
  | 'incompatible-values'
  | 'conflicting-owner'

/** A rejected Motion value. Validation never silently snaps an incompatible clip. */
export class MotionTargetError extends Error {
  readonly name: string = 'MotionTargetError'
  readonly code: TargetErrorCode
  readonly property: string
  readonly value: unknown
  readonly reason: string
  readonly platform: string
  constructor(
    code: TargetErrorCode,
    property: string,
    value: unknown,
    reason: string,
    platform = 'shared',
  ) {
    super(`motion: ${property}: ${reason}`)
    this.code = code
    this.property = property
    this.value = value
    this.reason = reason
    this.platform = platform
  }
}

export interface ValueReferences {
  width: number
  height: number
  parentWidth?: number
  parentHeight?: number
  viewportWidth?: number
  viewportHeight?: number
  fontSize?: number
  rootFontSize?: number
}

export interface ParsedValue {
  numbers: number[]
  signature: string
  units: string[]
  serialize(numbers: number[]): MotionData
}

const numeric = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i
const dimension =
  /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(px|dip|%|vw|vh|em|rem|deg|rad|turn)?$/i
const corners = new Set<string>(lengthKeys.filter((key) => key.endsWith('Radius')))
const unitless = new Set(['opacity', 'scale', 'scaleX', 'scaleY'])
const vertical = new Set(['y', 'height', 'minHeight', 'maxHeight', 'top', 'bottom', 'rowGap'])
const fail = (
  property: string,
  value: unknown,
  reason: string,
  code: TargetErrorCode = 'invalid-value',
): never => {
  throw new MotionTargetError(code, property, value, reason)
}
const finite = (n: number, property: string, value: unknown) =>
  Number.isFinite(n) ? n : fail(property, value, 'expected finite coordinates')
const formatted = (n: number) => String(Object.is(n, -0) ? 0 : Number(n.toFixed(6)))

export function isMotionProperty(key: string): key is MotionProperty {
  return propertyKeys.some((name) => name === key)
}

function reference(property: string, refs: ValueReferences): number | undefined {
  if (property === 'x') {
    return refs.width
  }
  if (property === 'y') {
    return refs.height
  }
  if (corners.has(property)) {
    return refs.width
  }
  return vertical.has(property) ? refs.parentHeight : refs.parentWidth
}

interface Slot {
  number: number
  unit: string
}
function length(text: string, property: string, refs?: ValueReferences, basis?: number): Slot {
  const match = dimension.exec(text)
  if (!match) {
    return fail(property, text, 'expected a complete numeric length or angle')
  }
  let number = finite(Number(match[1]), property, text)
  const unit = match[2]?.toLowerCase() ?? ''
  if (unitless.has(property)) {
    if (unit) {
      return fail(property, text, 'expected a unitless number')
    }
    return { number, unit: '' }
  }
  if (property === 'rotate') {
    if (!['', 'deg', 'rad', 'turn'].includes(unit)) {
      return fail(property, text, 'expected deg, rad, or turn')
    }
    if (unit === 'rad') {
      number *= 180 / Math.PI
    }
    if (unit === 'turn') {
      number *= 360
    }
    return { number, unit: 'deg' }
  }
  if (['deg', 'rad', 'turn'].includes(unit)) {
    return fail(property, text, 'an angle is not a length')
  }
  if (!unit || unit === 'px' || unit === 'dip') {
    return { number, unit: 'px' }
  }
  if (!refs) {
    return { number, unit }
  }
  const metric =
    unit === '%'
      ? (basis ?? reference(property, refs))
      : unit === 'vw'
        ? refs.viewportWidth
        : unit === 'vh'
          ? refs.viewportHeight
          : unit === 'em'
            ? refs.fontSize
            : refs.rootFontSize
  if (metric === undefined || !Number.isFinite(metric) || metric < 0) {
    return fail(
      property,
      text,
      `cannot resolve ${unit} without a definite reference`,
      'unresolved-reference',
    )
  }
  number *= unit === '%' || unit === 'vw' || unit === 'vh' ? metric / 100 : metric
  return { number, unit: 'px' }
}

function scalar(value: MotionData, property: string, refs?: ValueReferences): ParsedValue {
  const slot = length(
    String(value),
    property || (/(deg|rad|turn)$/.test(String(value)) ? 'rotate' : ''),
    refs,
  )
  const channel = channelKeys.some((key) => key === property)
  return {
    numbers: [slot.number],
    signature: 'scalar',
    units: [slot.unit],
    serialize: ([n]) =>
      (channel && ['', 'px', 'deg'].includes(slot.unit)) || (typeof value === 'number' && !property)
        ? n
        : formatted(n) + slot.unit,
  }
}

function expand<T>(items: T[], property: string): [T, T, T, T] {
  if (!items.length || items.length > 4) {
    return fail(property, items, 'expected one to four values')
  }
  const [a, b = a, c = a, d = b] = items
  return [a, b, c, d]
}

function tokens(text: string): string[] {
  return text.trim().split(/\s+/).filter(Boolean)
}

function compound(slots: Slot[], template: string, signature = template): ParsedValue {
  // Upstream handles token extraction and serialization, after semantic validation.
  const info = analyseComplexValue(template)
  const serialize = buildTransformer(info)
  return {
    numbers: slots.map((slot) => slot.number),
    units: slots.map((slot) => slot.unit),
    signature: signature.replace(/0(?:px|dip|%|vw|vh|em|rem)/g, '#'),
    serialize: (numbers) => serialize(numbers),
  }
}

function radii(
  text: string,
  property: string,
  refs?: ValueReferences,
  width = refs?.width,
  height = refs?.height,
): { slots: Slot[]; text: string } {
  const groups = text.split('/')
  if (groups.length > 2) {
    return fail(property, text, 'invalid elliptical radius shorthand')
  }
  const horizontal = expand(tokens(groups[0]), property).map((token) =>
    length(token, property, refs, width),
  )
  const y = expand(tokens(groups[1] ?? groups[0]), property).map((token) =>
    length(token, property, refs, height),
  )
  if ([...horizontal, ...y].some((slot) => slot.number < 0)) {
    return fail(property, text, 'radii cannot be negative')
  }
  return {
    slots: [...horizontal, ...y],
    text:
      horizontal.map((slot) => `0${slot.unit}`).join(' ') +
      ' / ' +
      y.map((slot) => `0${slot.unit}`).join(' '),
  }
}

function clip(value: string, refs?: ValueReferences): ParsedValue {
  const property = 'clipPath'
  if (value === 'none') {
    return { numbers: [], units: [], signature: 'none', serialize: () => 'none' }
  }
  const match = /^(inset|circle|ellipse|polygon|path)\((.*)\)$/s.exec(value)
  if (!match) {
    return fail(property, value, 'expected inset(), circle(), ellipse(), polygon(), or path()')
  }
  const [, shape, body] = match
  if (shape === 'path') {
    return path(body)
  }
  if (shape === 'inset') {
    const parts = body.split(/\s+round\s+/)
    if (parts.length > 2) {
      return fail(property, value, 'invalid inset round clause')
    }
    const slots = expand(tokens(parts[0]), property).map((token, i) =>
      length(token, property, refs, i % 2 ? refs?.width : refs?.height),
    )
    const w = refs && refs.width - slots[1].number - slots[3].number
    const h = refs && refs.height - slots[0].number - slots[2].number
    const radius = radii(
      parts[1] ?? '0',
      property,
      refs,
      w === undefined ? undefined : Math.max(0, w),
      h === undefined ? undefined : Math.max(0, h),
    )
    const template = `inset(${slots.map((slot) => `0${slot.unit}`).join(' ')} round ${radius.text})`
    return compound([...slots, ...radius.slots], template)
  }
  if (shape === 'polygon') {
    const groups = body.split(',').map((part) => part.trim())
    const rule = groups[0] === 'evenodd' || groups[0] === 'nonzero' ? groups.shift()! : 'nonzero'
    if (groups.length < 3) {
      return fail(property, value, 'polygon requires at least three vertices')
    }
    const slots: Slot[] = []
    const points = groups.map((group) => {
      const point = tokens(group)
      if (point.length !== 2) {
        return fail(property, value, 'polygon vertices require x and y')
      }
      const pair = point.map((text, axis) =>
        length(text, property, refs, axis ? refs?.height : refs?.width),
      )
      slots.push(...pair)
      return pair.map((slot) => `0${slot.unit}`).join(' ')
    })
    return compound(slots, `polygon(${rule}, ${points.join(', ')})`)
  }
  const parts = body.trim().split(/\s+at\s+/)
  if (parts.length > 2) {
    return fail(property, value, 'invalid shape center')
  }
  const sizes = tokens(parts[0])
  if (sizes.length !== (shape === 'circle' ? 1 : 2)) {
    return fail(property, value, 'expected numeric radii')
  }
  const center = tokens(parts[1] ?? '50% 50%')
  if (center.length !== 2) {
    return fail(property, value, 'expected numeric center x and y')
  }
  const slots = sizes.map((token, i) =>
    length(
      token,
      property,
      refs,
      shape === 'circle'
        ? refs && Math.hypot(refs.width, refs.height) / Math.SQRT2
        : i
          ? refs?.height
          : refs?.width,
    ),
  )
  if (slots.some((slot) => slot.number < 0)) {
    return fail(property, value, 'radii cannot be negative')
  }
  slots.push(
    ...center.map((token, i) => length(token, property, refs, i ? refs?.height : refs?.width)),
  )
  return compound(
    slots,
    `${shape}(${slots
      .slice(0, sizes.length)
      .map((slot) => `0${slot.unit}`)
      .join(' ')} at ${slots
      .slice(sizes.length)
      .map((slot) => `0${slot.unit}`)
      .join(' ')})`,
  )
}

function path(body: string): ParsedValue {
  const match = /^(?:(evenodd|nonzero)\s*,\s*)?(["'])(.*)\2$/s.exec(body.trim())
  if (!match) {
    return fail('clipPath', body, 'path requires quoted SVG data')
  }
  const rule = match[1] ?? 'nonzero'
  const data = match[3]
  if (data.length > 65536) {
    return fail('clipPath', body, 'path exceeds 65536 characters')
  }
  if (/(?:^|[a-z])\s*,|,\s*,|,\s*$/i.test(data)) {
    return fail('clipPath', body, 'invalid SVG separators')
  }
  const lex = /[a-z]|[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?/gi
  const raw: string[] = []
  let end = 0
  for (const token of data.matchAll(lex)) {
    if (!/^[\s,]*$/.test(data.slice(end, token.index))) {
      return fail('clipPath', body, 'invalid SVG path token')
    }
    raw.push(token[0])
    end = token.index! + token[0].length
  }
  if (!/^[\s,]*$/.test(data.slice(end))) {
    return fail('clipPath', body, 'invalid SVG path suffix')
  }
  const counts: Record<string, number> = {
    M: 2,
    L: 2,
    H: 1,
    V: 1,
    C: 6,
    S: 4,
    Q: 4,
    T: 2,
    A: 7,
    Z: 0,
  }
  const numbers: number[] = []
  const commands: string[] = []
  let x = 0,
    y = 0,
    sx = 0,
    sy = 0,
    cx = 0,
    cy = 0,
    previous = '',
    command = '',
    i = 0
  while (i < raw.length) {
    if (/^[a-z]$/i.test(raw[i])) {
      command = raw[i++]
    }
    const name = command.toUpperCase()
    if (!(name in counts) || (!commands.length && name !== 'M')) {
      return fail('clipPath', body, 'unsupported SVG command or missing initial move')
    }
    if (name === 'Z') {
      commands.push('Z')
      x = sx
      y = sy
      previous = 'Z'
      command = ''
      continue
    }
    const count = counts[name]
    const part = raw.slice(i, i + count)
    if (part.length !== count || part.some((token) => !numeric.test(token))) {
      return fail('clipPath', body, `invalid ${name} coordinates`)
    }
    i += count
    const a = part.map((token) => finite(Number(token), 'clipPath', body))
    const relative = command !== name
    const ox = relative ? x : 0,
      oy = relative ? y : 0
    let normalized = name
    if (name === 'H') {
      a[0] += ox
      a.push(y)
      normalized = 'L'
    } else if (name === 'V') {
      a[0] += oy
      a.unshift(x)
      normalized = 'L'
    } else if (name === 'A') {
      if (a[0] < 0 || a[1] < 0 || ![0, 1].includes(a[3]) || ![0, 1].includes(a[4])) {
        return fail('clipPath', body, 'invalid arc radii or flags')
      }
      a[5] += ox
      a[6] += oy
    } else {
      for (let j = 0; j < a.length; j += 2) {
        a[j] += ox
        a[j + 1] += oy
      }
      if (name === 'S') {
        a.unshift(previous === 'C' ? 2 * x - cx : x, previous === 'C' ? 2 * y - cy : y)
        normalized = 'C'
      }
      if (name === 'T') {
        a.unshift(previous === 'Q' ? 2 * x - cx : x, previous === 'Q' ? 2 * y - cy : y)
        normalized = 'Q'
      }
    }
    for (const coordinate of a) {
      finite(coordinate, 'clipPath', body)
    }
    x = a[a.length - 2]
    y = a[a.length - 1]
    if (normalized === 'M') {
      sx = x
      sy = y
      command = relative ? 'l' : 'L'
    }
    if (normalized === 'C' || normalized === 'Q') {
      cx = a[a.length - 4]
      cy = a[a.length - 3]
    }
    previous = normalized
    commands.push(normalized === 'A' ? `A:${a[3]}:${a[4]}` : normalized)
    numbers.push(...a)
    if (commands.length > 2048) {
      return fail('clipPath', body, 'path exceeds 2048 commands')
    }
  }
  if (!commands.length) {
    return fail('clipPath', body, 'empty path')
  }
  return {
    numbers,
    units: numbers.map(() => ''),
    signature: `path:${rule}:${commands.join('|')}`,
    serialize(sample) {
      let offset = 0
      const d = commands
        .map((command) => {
          const name = command[0],
            count = counts[name]
          const a = sample.slice(offset, offset + count)
          offset += count
          return (
            name +
            (count
              ? ' ' +
                a
                  .map((v, j) =>
                    name === 'A' && (j === 3 || j === 4) ? command.split(':')[j - 2] : formatted(v),
                  )
                  .join(' ')
              : '')
          )
        })
        .join(' ')
      return `path(${rule}, "${d}")`
    },
  }
}

function shadow(text: string, refs?: ValueReferences): ParsedValue {
  const property = 'boxShadow'
  // Split only outside color functions. The accepted grammar has no nested functions.
  const groups = text.split(/,(?![^()]*\))/)
  const numbers: number[] = []
  const units: string[] = []
  const serializers: ((sample: number[]) => string)[] = []
  for (const group of groups) {
    const match = /^(.*?)\s+(rgba\(([^()]*)\))$/.exec(group.trim())
    if (!match) {
      return fail(property, text, 'expected outset lengths followed by an explicit rgba() color')
    }
    const parts = tokens(match[1])
    if (parts.length < 2 || parts.length > 4) {
      return fail(property, text, 'expected two to four shadow lengths')
    }
    while (parts.length < 4) {
      parts.push('0')
    }
    const slots = parts.map((part) => length(part, property, refs))
    if (slots.some((slot) => !['px', 'em', 'rem'].includes(slot.unit))) {
      return fail(property, text, 'shadow lengths cannot use percentages or viewport units')
    }
    if (slots[2].number < 0) {
      return fail(property, text, 'shadow blur cannot be negative')
    }
    const rgba = match[3].split(',').map((part) => part.trim())
    if (rgba.length !== 4 || rgba.some((part) => !numeric.test(part))) {
      return fail(property, text, 'expected numeric rgba channels')
    }
    const channels = rgba.map((part) => finite(Number(part), property, text))
    if (channels.some((n, i) => n < 0 || n > (i === 3 ? 1 : 255))) {
      return fail(property, text, 'rgba channels are out of range')
    }
    const offset = numbers.length
    numbers.push(...slots.map((slot) => slot.number), ...channels)
    units.push(...slots.map((slot) => slot.unit), '', '', '', '')
    serializers.push((sample) => {
      const lengths = slots.map(
        (slot, i) =>
          formatted(i === 2 ? Math.max(0, sample[offset + i]) : sample[offset + i]) + slot.unit,
      )
      const c = sample.slice(offset + 4, offset + 8)
      const rendered = color.transform({ red: c[0], green: c[1], blue: c[2], alpha: c[3] })
      return lengths.join(' ') + ' ' + rendered
    })
  }
  return {
    numbers,
    units,
    signature: `shadow:${groups.length}`,
    serialize: (sample) => serializers.map((render) => render(sample)).join(', '),
  }
}

/** Parse supported values into numeric slots with a stable structural signature. */
export function parseMotionValue(
  value: MotionData,
  property = '',
  refs?: ValueReferences,
): ParsedValue {
  if (typeof value !== 'number' && typeof value !== 'string') {
    return fail(property, value, 'expected a number or string')
  }
  if (typeof value === 'number') {
    finite(value, property, value)
  }
  if (typeof value === 'string' && (value.length > 65536 || !value.trim())) {
    return fail(property, value, 'empty or oversized value')
  }
  if (property && !isMotionProperty(property)) {
    return fail(property, value, 'unsupported animation property', 'unsupported-property')
  }
  const text = String(value).trim()
  if (
    property === 'clipPath' ||
    (!property && /^(inset|circle|ellipse|polygon|path)\(/.test(text))
  ) {
    return clip(text, refs)
  }
  if (corners.has(property) && tokens(text).length === 2) {
    const pair = tokens(text).map((part, axis) =>
      length(part, property, refs, axis ? refs?.height : refs?.width),
    )
    if (pair.some((slot) => slot.number < 0)) {
      return fail(property, value, 'radii cannot be negative')
    }
    return compound(pair, pair.map((slot) => `0${slot.unit}`).join(' '))
  }
  if (property === 'borderRadius') {
    const radius = radii(text, property, refs)
    return compound(radius.slots, radius.text)
  }
  if (property === 'boxShadow') {
    return shadow(text, refs)
  }
  const parsed = scalar(value, property, refs)
  if (
    property &&
    parsed.numbers[0] < 0 &&
    !(
      property.startsWith('margin') ||
      [
        'x',
        'y',
        'rotate',
        'top',
        'right',
        'bottom',
        'left',
        'scale',
        'scaleX',
        'scaleY',
        'opacity',
      ].includes(property)
    )
  ) {
    return fail(property, value, 'this style length cannot be negative')
  }
  return parsed
}

/** Validate structure and units before touching playback ownership. */
export function compatibleMotionValues(from: ParsedValue, to: ParsedValue, property = ''): void {
  if (from.signature !== to.signature || from.numbers.length !== to.numbers.length) {
    fail(property, to.signature, 'incompatible value structure', 'incompatible-values')
  }
  if (from.units.some((unit, i) => unit !== to.units[i])) {
    fail(property, to.units, 'mixed units need resolved host references', 'unresolved-reference')
  }
}
