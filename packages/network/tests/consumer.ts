import { decodeNdjson } from 'rouzer/ndjson'
import { requestStream } from '../src/index.web'
export async function messages(url: string) {
	const response = await requestStream(url)
	return decodeNdjson<{ text: string }>(response.body)
}
