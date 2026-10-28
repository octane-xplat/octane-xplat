// Own only the transport's UTF-8 codec; never modify global encoding APIs.
export { TextDecoder as Decoder, TextEncoder as Encoder } from '@kayahr/text-encoding/no-encodings'
