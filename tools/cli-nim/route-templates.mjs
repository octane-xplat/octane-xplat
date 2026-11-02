// Extract inert code-generation text, never evaluate CLI command expressions.
// Nim supplies every interpolation; expression fingerprints force a port review
// when the canonical TypeScript renderer changes its dynamic structure.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
const require = createRequire(new URL('../../packages/cli/package.json', import.meta.url))
const { parseModule } = require('@tsrx/core')

function nodes(root, predicate) {
 const found = []
 function visit(value) {
  if (value === null || typeof value !== 'object') return
  if (predicate(value)) found.push(value)
  for (const child of Object.values(value)) {
   if (Array.isArray(child)) child.forEach(visit)
   else visit(child)
  }
 }
 visit(root)
 return found
}
function single(values, label) {
 if (values.length !== 1) throw Error(`Expected one canonical route ${label}, got ${values.length}`)
 return values[0]
}
export function routeCommandDescriptor(source) {
 const ast = parseModule(source, 'routes.ts')
 const declaration = single(nodes(ast, node => node.type === 'VariableDeclarator' && node.id?.name === 'routes'), 'command').init
 const property = (node, key) => single(node.properties.filter(item => (item.key?.name ?? item.key?.value) === key), key).value
 if (declaration.type !== 'CallExpression' || declaration.callee.name !== 'command') throw Error('Unsupported routes command declaration')
 const args = property(declaration.arguments[0], 'args')
 const flags = args.properties.map(entry => {
  const call = entry.value
  if (call.type !== 'CallExpression' || !['flag','option'].includes(call.callee.name)) throw Error('Unsupported routes flag')
  const config = call.arguments[0]
  const string = key => { const value = property(config,key); if (typeof value.value !== 'string') throw Error(`Unsupported routes ${key}`); return value.value }
  if (call.callee.name === 'option') {
   const type = property(config,'type')
   if (type.type !== 'CallExpression' || type.callee.name !== 'optional' || type.arguments[0]?.name !== 'string') throw Error('Unsupported routes option type')
  }
  return { flag: string('long'), short: string('short'), type: call.callee.name === 'flag' ? 'boolean' : 'string',
   description: string('description'), ...(call.callee.name === 'flag' ? { default: false } : {}) }
 })
 return { name: 'routes', flags, positionals: [] }
}
export function routeTemplateData(source, file = 'routes.ts') {
 const ast = parseModule(source, file)
 const variable = name => single(nodes(ast, node => node.type === 'VariableDeclarator' && node.id?.name === name), name).init
 const platform = variable('writePlatform')
 const templates = {
  contracts: variable('src'), registration: variable('registration'), data: variable('dataSrc').body,
  markdown: variable('mdGlue').consequent, catalog: variable('shared').body,
  platform: single(nodes(platform.body, node => node.type === 'CallExpression' && node.callee?.name === 'emit' && node.arguments[0]?.name === 'path'), 'platform writer').arguments[1],
  exportShapes: single(nodes(ast, node => node.type === 'TemplateLiteral' && node.quasis[0]?.value?.cooked?.startsWith('type RouteExportShapes = {')), 'export shapes'),
 }
 const data = {}, shapes = {}
 for (const [name, template] of Object.entries(templates)) {
  if (template.type !== 'TemplateLiteral' || template.quasis.some(quasi => typeof quasi.value.cooked !== 'string')) throw Error(`Unsupported route ${name} template`)
  const expressions = template.expressions.map(expression => source.slice(expression.start, expression.end).replace(/\r\n?/g, '\n'))
  const shapeHash = createHash('sha256').update(JSON.stringify(expressions)).digest('hex')
  data[name] = { parts: template.quasis.map(quasi => quasi.value.cooked), shapeHash }
  shapes[name] = { shapeHash, expressions }
 }
 return { data, shapes }
}
export function writeRouteTemplates(root) {
 const file = join(root, 'packages/cli/src/commands/routes.ts')
 const { data, shapes } = routeTemplateData(readFileSync(file, 'utf8'), file)
 const output = join(root, 'packages/cli/nim/route_templates.json')
 const encoded = JSON.stringify(data)
 let previous
 try { previous = readFileSync(output, 'utf8') } catch (error) { if (error.code !== 'ENOENT') throw error }
 if (previous !== encoded) writeFileSync(output, encoded)
 const work = join(root, 'research/nim-cli')
 mkdirSync(work, { recursive: true })
 writeFileSync(join(work, 'route-template-shapes.json'), JSON.stringify(shapes, null, 2) + '\n')
 return shapes
}
