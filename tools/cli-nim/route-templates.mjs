// Extract the native command descriptor from the canonical TypeScript command.
import { createRequire } from 'node:module'
const require = createRequire(new URL('../../packages/cli/package.json', import.meta.url))
const { parseModule } = require('@tsrx/core')

function nodes(root, predicate) {
 const found = []
 function visit(value) {
  if (value === null || typeof value !== 'object') {return}
  if (predicate(value)) {found.push(value)}
  for (const child of Object.values(value)) {
   if (Array.isArray(child)) {child.forEach(visit)}
   else {visit(child)}
  }
 }
 visit(root)
 return found
}
function single(values, label) {
 if (values.length !== 1) {throw Error(`Expected one canonical route ${label}, got ${values.length}`)}
 return values[0]
}
function commandDescriptor(source, name) {
 const ast = parseModule(source, `${name}.ts`)
 const declaration = single(nodes(ast, node => node.type === 'VariableDeclarator' && node.id?.name === name), 'command').init
 const property = (node, key) => single(node.properties.filter(item => (item.key?.name ?? item.key?.value) === key), key).value
 if (declaration.type !== 'CallExpression' || declaration.callee.name !== 'command') {throw Error(`Unsupported ${name} command declaration`)}
 const args = property(declaration.arguments[0], 'args')
 const flags = args.properties.map(entry => {
  const call = entry.value
  if (call.type !== 'CallExpression' || !['flag','option'].includes(call.callee.name)) {throw Error(`Unsupported ${name} flag`)}
  const config = call.arguments[0]
  const string = key => { const value = property(config,key); if (typeof value.value !== 'string') {throw Error(`Unsupported ${name} ${key}`);} return value.value }
  if (call.callee.name === 'option') {
   const type = property(config,'type')
   if (type.type !== 'CallExpression' || type.callee.name !== 'optional' || type.arguments[0]?.name !== 'string') {throw Error(`Unsupported ${name} option type`)}
  }
  return { flag: string('long'), ...(config.properties.some(item => item.key?.name === 'short') ? { short: string('short') } : {}), type: call.callee.name === 'flag' ? 'boolean' : 'string',
   description: string('description'), ...(call.callee.name === 'flag' ? { default: false } : {}) }
 })
 return { name, flags, positionals: [] }
}
export const routeCommandDescriptor = source => commandDescriptor(source, 'routes')
export const typecheckCommandDescriptor = source => commandDescriptor(source, 'typecheck')
export const buildCommandDescriptor = source => commandDescriptor(source, 'build')
