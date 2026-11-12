export function paint(host: Element | null, id: string, property: string): string | null {
  const shape = host?.querySelector('#' + id)
  if (!shape) {
    return null
  }
  const value = getComputedStyle(shape).getPropertyValue(property)
  if (value === 'none') {
    return value
  }
  const components = value.match(/^rgb\((\d+), (\d+), (\d+)\)$/)
  if (!components) {
    throw new Error(`Unexpected paint ${value}`)
  }
  return '#' + components.slice(1).map((v) => Number(v).toString(16).padStart(2, '0')).join('')
}
