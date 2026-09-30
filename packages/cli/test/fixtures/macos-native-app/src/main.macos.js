const app = NSApplication.sharedApplication
app.setActivationPolicy(2)
const c = xplat_c_value()
const objc = XplatObjCProbe.value()
const swift = XplatSwiftProbe.value()
const zig = xplat_zig_value()
if (c < 40 || objc !== c + 2 || swift !== 43 || zig !== 44) {
	throw Error('Native language values differ')
}

if (typeof NSView === 'undefined' || typeof sqlite3_open !== 'function') {
	throw Error('SDK metadata lost')
}

console.log(`NATIVE_VALUES c=${c} objc=${objc} swift=${swift} zig=${zig}`)
if (__hostEnv('NODE_ENV') === 'development') {
	setInterval(() => console.log(`NATIVE_TICK c=${xplat_c_value()}`), 500)
} else {
	setTimeout(() => app.terminate(null), 50)
}
