import { describe, expect, it } from 'vitest'
import {
  mapAndroidSpeechError,
  mapAppleSpeechError,
  mapWebSpeechError,
} from '../src/error-map'
import type { SpeechRecognitionErrorCode } from '../src/types'

describe('mapWebSpeechError', () => {
  const cases: [string, SpeechRecognitionErrorCode][] = [
    ['not-allowed', 'permission-denied'],
    ['service-not-allowed', 'service-unavailable'],
    ['network', 'network'],
    ['audio-capture', 'audio-capture'],
    ['no-speech', 'no-speech'],
    ['language-not-supported', 'language-unsupported'],
    ['aborted', 'interrupted'],
    ['bad-grammar', 'unknown'],
    ['phrases-not-supported', 'unknown'],
    ['audio-timeout', 'unknown'],
    ['', 'unknown'],
    ['something-new', 'unknown'],
  ]

  for (const [error, code] of cases) {
    it(`maps '${error}' to '${code}'`, () => {
      const mapped = mapWebSpeechError(error)
      expect(mapped.code).toBe(code)
      expect(mapped.nativeCode).toBe(error)
      expect(mapped.name).toBe('SpeechRecognitionError')
    })
  }
})

describe('mapAndroidSpeechError', () => {
  const cases: [number, SpeechRecognitionErrorCode][] = [
    [1, 'network'],
    [2, 'network'],
    [3, 'audio-capture'],
    [4, 'service-unavailable'],
    [10, 'service-unavailable'],
    [11, 'service-unavailable'],
    [5, 'unknown'],
    [6, 'no-speech'],
    [7, 'no-speech'],
    [8, 'busy'],
    [9, 'permission-denied'],
    [12, 'language-unsupported'],
    [13, 'language-unsupported'],
    [0, 'unknown'],
    [14, 'unknown'],
    [99, 'unknown'],
  ]

  for (const [error, code] of cases) {
    it(`maps ${error} to '${code}'`, () => {
      const mapped = mapAndroidSpeechError(error)
      expect(mapped.code).toBe(code)
      expect(mapped.nativeCode).toBe(error)
    })
  }
})

describe('mapAppleSpeechError', () => {
  const facadeCases: [number, SpeechRecognitionErrorCode][] = [
    [1, 'language-unsupported'],
    [2, 'service-unavailable'],
    [3, 'audio-capture'],
    [4, 'audio-capture'],
    [5, 'audio-capture'],
    [0, 'unknown'],
    [99, 'unknown'],
  ]

  for (const [errorCode, code] of facadeCases) {
    it(`maps facade code ${errorCode} to '${code}'`, () => {
      const mapped = mapAppleSpeechError('XplatSpeechRecognizer', errorCode)
      expect(mapped.code).toBe(code)
      expect(mapped.nativeCode).toBe(`XplatSpeechRecognizer:${errorCode}`)
    })
  }

  it('maps NSURLErrorDomain wholesale to network', () => {
    expect(mapAppleSpeechError('NSURLErrorDomain', -1009).code).toBe('network')
    expect(mapAppleSpeechError('NSURLErrorDomain', -1001).code).toBe('network')
  })

  const assistantCases: [number, SpeechRecognitionErrorCode][] = [
    [1110, 'no-speech'],
    [203, 'service-unavailable'],
    [1101, 'unknown'],
    [7, 'unknown'],
  ]

  for (const [errorCode, code] of assistantCases) {
    it(`maps kAFAssistantErrorDomain ${errorCode} to '${code}'`, () => {
      const mapped = mapAppleSpeechError('kAFAssistantErrorDomain', errorCode)
      expect(mapped.code).toBe(code)
      expect(mapped.nativeCode).toBe(`kAFAssistantErrorDomain:${errorCode}`)
    })
  }

  it('falls through unmapped domains to unknown', () => {
    const mapped = mapAppleSpeechError('SFSpeechErrorDomain', 1)
    expect(mapped.code).toBe('unknown')
    expect(mapped.nativeCode).toBe('SFSpeechErrorDomain:1')
  })

  it('prefers the facade message when provided', () => {
    expect(mapAppleSpeechError('X', 1, 'no audio input').message).toBe('no audio input')
    expect(mapAppleSpeechError('X', 1).message).toBe('Speech recognition failed: X:1')
  })
})
