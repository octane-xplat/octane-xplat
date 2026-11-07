import '@xplat/astryx-sandbox/icons'
import '@octane-xplat/ui/theme/chrome.css'

// Example styles belong to preview documents, not the branded gallery page.
const params = new URLSearchParams(location.search)
const view =
  params.get('view') ??
  (params.has('story') || location.hash.startsWith('#/story/') ? 'story' : 'gallery')

if (view === 'frame' || view === 'story') {
  await import('@xplat/astryx-sandbox/styles.css')
}

export const providers = []

export default providers
