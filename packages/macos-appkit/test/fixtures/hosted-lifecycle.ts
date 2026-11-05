import { installPackedPlugin, pluginRetirements } from './packed-plugin'
import Hosted from './Hosted'

export async function checkHostedLifecycle(root: any, nativeWindow: any) {
  const check = (condition: boolean, message: string) => {
    if (!condition) {
      throw Error('Hosted surfaces: ' + message)
    }
  }
  const settle = () =>
    new Promise<void>((resolve) =>
      setTimeout(() => {
        nativeWindow.contentView.layoutSubtreeIfNeeded()
        resolve()
      }, 100),
    )
  let callbacks = 0
  const onTime = () => {
    callbacks++
  }
  installPackedPlugin('acquired')
  root.render(Hosted, { phase: 0, onTime })
  await settle()
  const debug = root.__macosDebug
  const image = debug.findId('hosted-image')
  const animated = debug.findId('hosted-animated')
  const pager = debug.findId('hosted-pager')
  const web = debug.findId('hosted-web')
  const video = debug.findId('hosted-video')
  check(image?.image != null && animated?.image != null, 'native image sources decoded')
  check(animated.animates === true, 'animated image starts enabled')
  check(pager?.documentView != null, 'pager owns native document')
  check(Number(pager.documentView.subviews.count) === 2, 'pager owns two page hosts')
  check(web?.navigationDelegate != null, 'webview owns navigation delegate')
  const player = video?.player
  check(player != null, 'video owns player')
  // Trigger actual native KVO selector delivery without media or physical input.
  player.willChangeValueForKey('timeControlStatus')
  player.didChangeValueForKey('timeControlStatus')
  installPackedPlugin('replacement')
  root.render(Hosted, { phase: 1, onTime })
  await settle()
  check(
    debug.findId('hosted-image') === image && debug.findId('hosted-video') === video,
    'updates retain native identities',
  )
  check(image.image == null, 'removed image source clears')
  check(animated.animates === false, 'animated playback prop clears')
  check(Number(pager.documentView.subviews.count) === 1, 'pager removes the retired page host')
  root.unmount()
  check(
    pluginRetirements.join(',') === 'acquired',
    'plugin retirement retains acquired registration',
  )
  const retired = callbacks
  check(video.player == null, 'video player detaches')
  check(pager.documentView == null, 'pager document detaches')
  check(web.navigationDelegate == null, 'web navigation delegate retires')
  player.willChangeValueForKey('timeControlStatus')
  player.didChangeValueForKey('timeControlStatus')
  await settle()
  check(callbacks === retired, 'retired native time delivery is inert')
  console.log('PACKED_HOSTED_SURFACES_OK')
}
