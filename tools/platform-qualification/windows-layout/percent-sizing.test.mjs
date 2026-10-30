import fs from 'node:fs'
import assert from 'node:assert/strict'
if (!process.argv[2]) {
	throw new Error('Usage: node percent-sizing.test.mjs <upstream View .ts or package .js>')
}

const source = fs.readFileSync(process.argv[2], 'utf8')
const typed = source.includes('\tprivate _clearPercentParent()')
const start = source.indexOf(
	typed ? '\tprivate _clearPercentParent()' : '    _clearPercentParent()',
)

const end = source.indexOf('// XAML lays views out natively', start)
assert(start >= 0 && end > start, 'percentage lifecycle methods missing')
let methods = source.slice(start, end).replaceAll('private ', '').replaceAll(': void', '')
const applyStart = source.indexOf(
	typed ? '\tprivate _applyPercentSizing()' : '    _applyPercentSizing()',
)

const applyEnd = source.indexOf('[backgroundInternalProperty.getDefault]', applyStart)
methods += source
	.slice(applyStart, applyEnd)
	.replaceAll('private ', '')
	.replaceAll(': void', '')
	.replaceAll(' as any', '')
	.replaceAll(' as View', '')

const queue = []
const ViewCommon = { layoutChangedEvent: 'layoutChanged' }
const View = Function(
	'ViewCommon',
	'setTimeout',
	'toXamlLength',
	`return class View { constructor(){this.isLoaded=true;this._percentWidth=.5;this._percentHeight=1;this._percentParent=null;this._percentSizingGeneration=0;this._percentSizingPending=false;this._percentParentChanged=()=>this._schedulePercentSizing();this.listeners=new Set();this.style={listeners:new Map(),on(name,fn){if(!this.listeners.has(name))this.listeners.set(name,new Set());this.listeners.get(name).add(fn)},off(name,fn){const list=this.listeners.get(name);list?.delete(fn);if(list?.size===0)this.listeners.delete(name)}};this.nativeViewProtected={Width:NaN,Height:NaN,ActualWidth:200,ActualHeight:60};} on(_,fn){this.listeners.add(fn)} off(_,fn){this.listeners.delete(fn)} ${methods} }`,
)(
	ViewCommon,
	(fn) => queue.push(fn),
	(v) => (typeof v === 'number' ? v : 0),
)

const flush = () => {
	while (queue.length) {
		queue.shift()()
	}
}

const a = new View(),
	b = new View(),
	child = new View()

child.parent = a
const unrelated = () => {}
a.on('layoutChanged', unrelated)
child._syncPercentParent()
flush()
assert.equal(child.nativeViewProtected.Width, 100)
assert.equal(child.nativeViewProtected.Height, 60)
a.nativeViewProtected.ActualWidth = 300
a.nativeViewProtected.ActualHeight = 90
for (const fn of a.listeners) {
	fn()
}

flush()
assert.equal(child.nativeViewProtected.Width, 150)
assert.equal(child.nativeViewProtected.Height, 90)
child._syncPercentParent()
child.parent = b
child._syncPercentParent()
flush()
assert.equal(a.listeners.size, 1)
assert(a.listeners.has(unrelated))
assert.equal(b.listeners.size, 1)
assert.equal(child.nativeViewProtected.Width, 100)
child._percentWidth = null
child._percentHeight = null
child._syncPercentParent()
assert.equal(b.listeners.size, 0)
child._percentWidth = 1
child._syncPercentParent()
child.isLoaded = false
child._clearPercentParent()
flush()
assert.equal(b.listeners.size, 0)
assert.equal(child.nativeViewProtected.Width, 100)
child.isLoaded = true
child._syncPercentParent()
flush()
assert.equal(child.nativeViewProtected.Width, 200)
child._clearPercentParent()
assert.equal(b.listeners.size, 0)

b.style.paddingLeft = 17
b.style.paddingRight = 13
child._syncPercentParent()
flush()
assert.equal(child.nativeViewProtected.Width, 170)
b.style.paddingLeft = 23
for (const fn of b.style.listeners.get('paddingLeftChange') ?? []) {
	fn()
}

flush()
assert.equal(child.nativeViewProtected.Width, 164)
b.style.paddingLeft = 210
for (const fn of b.style.listeners.get('paddingLeftChange') ?? []) {
	fn()
}

flush()
assert.equal(child.nativeViewProtected.Width, 0)
child._clearPercentParent()
assert.equal(b.style.listeners.size, 0)
console.log(
	'PASS: extracted source lifecycle, independent listeners, content padding, padding changes, zero content extent',
)
