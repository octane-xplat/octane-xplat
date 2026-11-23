import { share, type ShareResult } from '@octane-xplat/share'

// 1. Call one of these functions from a user action, such as a button press.
export async function shareMessage(): Promise<string> {
  try {
    return describeResult(await share.text('A note to share'))
  } catch {
    return 'Could not share the message. Please try again.'
  }
}

export async function shareLink(): Promise<string> {
  try {
    return describeResult(await share.url('https://example.com/trips/42', 'Summer trip'))
  } catch {
    return 'Could not share the link. Please try again.'
  }
}

// 2. Show the returned message on screen; a shared result does not prove delivery.
function describeResult(result: ShareResult): string {
  switch (result) {
    case 'shared': return 'The share flow was opened or completed.'
    case 'copied': return 'Copied to the clipboard.'
    case 'cancelled': return 'Sharing was cancelled.'
    case 'unavailable': return 'Sharing is unavailable on this device.'
  }
}
