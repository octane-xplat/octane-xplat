// The runner checks the PASS marker: a host exit alone does not prove assertions.
const expectDeclared = __hostEnv('XPLAT_PROBE_DECLARED') === '1'
const library = dlopen(__hostEnv('XPLAT_PROBE_DYLIB'), 2 | 8) // RTLD_NOW | RTLD_GLOBAL
if (!library) {
	throw Error('Custom dylib failed to load')
}
if (!dlsym(library, 'xplat_probe_add')) {
	throw Error('Custom export missing')
}
if (expectDeclared) {
	if (typeof xplat_probe_add !== 'function') {
		throw Error('Custom declaration missing')
	}
	if (xplat_probe_add(19, 23) !== 42) {
		throw Error('Native sum differs')
	}
	if (xplat_probe_add(-7, 2) !== -5) {
		throw Error('Signed native sum differs')
	}
	console.log('PASS custom metadata: xplat_probe_add(19, 23) = 42; (-7, 2) = -5')
} else {
	if (typeof xplat_probe_add !== 'undefined') {
		throw Error('Control unexpectedly declares custom function')
	}

	console.log('PASS shipped metadata: dylib export exists; JS declaration absent')
}
// Keep the handle open for the process lifetime; runtime functions retain pointers.
