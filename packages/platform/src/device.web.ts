import type { DeviceInfo } from './types'
import { locale } from './locale.web'

const ua = typeof navigator === 'undefined' ? '' : navigator.userAgent
const osVersion =
  ua.match(/(?:Mac OS X|Windows NT|Android|OS) ([\d._]+)/)?.[1]?.replace(/_/g, '.') ?? ''

export const device: DeviceInfo = {
  os: 'web',
  osVersion,
  model: 'browser',
  manufacturer: '',
  language: locale.language,
  region: locale.region,
}
