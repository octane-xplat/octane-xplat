/// <reference types="vite/client" />
import '@xplat/astryx-sandbox/icons'
import '@octane-xplat/ui/theme/chrome.css'
import exampleStyles from '@xplat/astryx-sandbox/styles.css?inline'

// Example styles belong to preview documents, not the branded gallery page.
const params = new URLSearchParams(location.search)
const view =
  params.get('view') ??
  (params.has('story') || location.hash.startsWith('#/story/') ? 'story' : 'gallery')

if (view === 'frame' || view === 'story') {
  // Static Workshop HTML links every emitted CSS asset. Keep these app-wide
  // rules as CSS text so they cannot be linked into the gallery document.
  const stylesheet = document.createElement('style')
  stylesheet.textContent = exampleStyles
  document.head.append(stylesheet)
}

export const providers = []

export default providers
