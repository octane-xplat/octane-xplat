import { MIME_EXTENSIONS } from './file-types.macos'

const framework = '/System/Library/Frameworks/UniformTypeIdentifiers.framework/UniformTypeIdentifiers'
const loaded = new WeakSet<object>()
const families: Record<string, string[]> = Object.assign(Object.create(null), {
	'image/*': ['public.image'], 'audio/*': ['public.audio'],
	'video/*': ['public.movie', 'public.video'], 'text/*': ['public.text'],
})
const mimeToken = /^[!#$%&'*+.^_`|~0-9a-z-]+$/

/** Load only this framework before touching node-api's lazy symbol getter. */
export function appKitFileTypeClass(host: Record<string, any> = globalThis): any | undefined {
	try {
		const descriptor = Object.getOwnPropertyDescriptor(host, 'UTType')
		// Explicit host/test bindings are safe without invoking a lazy getter.
		if (descriptor && 'value' in descriptor && descriptor.value != null) {return descriptor.value}
		if (!loaded.has(host)) {
			const bridge = host.objc
			const load = bridge?.import
			if (typeof load === 'function') {load.call(bridge, 'UniformTypeIdentifiers')}
			else {
				const dlopen = host.dlopen
				if (typeof dlopen !== 'function' || !dlopen.call(host, framework, 2)) {return undefined}
			}
			loaded.add(host)
		}
		return host.UTType
	} catch { return undefined }
}

function filterError(): Error {
	const error = new Error('AppKit could not resolve the requested file types; use explicit filename extensions or check the native type bridge')
	error.name = 'UnsupportedFileTypeError'
	return error
}

function identifier(type: any): string | undefined {
	try { const value = type?.identifier; return typeof value === 'string' && value.length ? value : undefined }
	catch { return undefined }
}

function lookup(Type: any, method: string, ...args: any[]): any {
	try { const invoke = Type?.[method]; return typeof invoke === 'function' ? invoke.call(Type, ...args) : undefined }
	catch { return undefined }
}

export function appKitTypeForExtension(Type: any, extension: string): any {
	return lookup(Type, 'typeWithFilenameExtension', extension)
}

export function appKitTypesForMIME(Type: any, mime: string): any[] {
	try {
		const result = lookup(Type, 'typesWithTagTagClassConformingToType', mime, 'public.mime-type', null)
		let values: any[] = []
		if (Array.isArray(result)) {values = result}
		else if (result && Number.isSafeInteger(result.count) && result.count >= 0 && typeof result.objectAtIndex === 'function') {
			for (let index = 0; index < result.count; index++) {values.push(result.objectAtIndex(index))}
		}
		if (!values.length) {values = [lookup(Type, 'typeWithMIMEType', mime)]}
		return values.filter(type => identifier(type) && type.dynamic !== true)
	} catch { return [] }
}

type Filter = { legacy: string[]; contentTypes?: any[] }

/** Resolve the whole union before mutating or presenting a native panel. */
export function appKitFileTypeFilter(accept: string, host: Record<string, any> = globalThis): Filter | null {
	if (typeof accept !== 'string') {throw filterError()}
	const tokens = [...new Set(accept.split(',').map(token => token.trim().toLowerCase()).filter(Boolean))]
	if (!tokens.length || tokens.includes('*/*')) {return null}
	const Type = appKitFileTypeClass(host)
	const entries: { legacy: string; type?: any }[] = []
	const extension = (value: string) => entries.push({ legacy: value, type: appKitTypeForExtension(Type, value) })
	for (const token of tokens) {
		if (token.startsWith('.')) {
			if (!/^\.[^/\\\s,*?\u0000-\u001f]+$/u.test(token) || token.slice(1).split('.').some(part => !part)) {throw filterError()}
			extension(token.slice(1))
		} else if (families[token]) {
			for (const id of families[token]) {entries.push({ legacy: id, type: lookup(Type, 'typeWithIdentifier', id) })}
		} else {
			const parts = token.split('/')
			if (parts.length !== 2 || parts.some(part => !mimeToken.test(part) || part.includes('*'))) {throw filterError()}
			const types = appKitTypesForMIME(Type, token)
			if (types.length) {for (const type of types) {entries.push({ legacy: identifier(type)!, type })}}
			else if (Object.prototype.hasOwnProperty.call(MIME_EXTENSIONS, token)) {for (const value of MIME_EXTENSIONS[token]) {extension(value)}}
			else {throw filterError()}
		}
	}
	const unique = [...new Map(entries.map(entry => [entry.legacy, entry])).values()]
	if (!unique.length) {throw filterError()}
	return {
		legacy: unique.map(entry => entry.legacy),
		...(unique.every(entry => identifier(entry.type)) ? { contentTypes: [...new Map(unique.map(entry => [identifier(entry.type), entry.type])).values()] } : {}),
	}
}

export function applyAppKitFileTypeFilter(panel: any, accept: string, host: Record<string, any> = globalThis): void {
	const filter = appKitFileTypeFilter(accept, host)
	panel.allowsOtherFileTypes = false
	if ('allowedContentTypes' in panel && (!filter || filter.contentTypes)) {panel.allowedContentTypes = filter?.contentTypes ?? []}
	else {panel.allowedFileTypes = filter?.legacy ?? null}
}
