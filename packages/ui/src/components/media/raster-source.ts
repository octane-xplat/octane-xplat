import { ImageSource } from '@nativescript/core'

export function resolveRasterSource(source: string): string | object | null {
	const comma = source.indexOf(',')
	if (source.startsWith('data:') && comma > 0 && source.slice(0, comma).endsWith(';base64')) {
		return ImageSource.fromBase64Sync(source.slice(comma + 1))
	}

	return source
}
