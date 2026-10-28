import type { StreamRequestOptions, StreamResponse } from './types'
export type * from './types'
/** Native Linux/Windows streaming is not qualified by this leaf. */
export function requestStream(
	_url: string,
	_options?: StreamRequestOptions,
): Promise<StreamResponse> {
	return Promise.reject(new Error('Incremental HTTP is unsupported on this native host'))
}
