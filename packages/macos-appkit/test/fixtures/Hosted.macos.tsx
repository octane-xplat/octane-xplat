/** @jsxImportSource @octane-xplat/jsx */
const pixel =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jG3sAAAAASUVORK5CYII='

export default function Hosted({ phase, onTime }: { phase: number; onTime: () => void }) {
  return (
    <masonview style={{ display: 'flex', flexDirection: 'column' }}>
      <webview
        id="hosted-web"
        src={phase ? 'about:blank#updated' : 'about:blank'}
        style={{ width: 180, height: 40 }}
      />
      <image id="hosted-image" src={phase ? undefined : pixel} style={{ width: 24, height: 24 }} />
      <animatedimage
        id="hosted-animated"
        src={pixel}
        autoPlayAnimations={phase === 0}
        style={{ width: 24, height: 24 }}
      />
      <placeholder id="hosted-plugin" style={{ width: 24, height: 24 }} />
      <pager
        id="hosted-pager"
        items={phase ? ['retained'] : ['first', 'second']}
        style={{ width: 180, height: 40 }}
      />
      <xplatvideo
        id="hosted-video"
        observeCurrentTime={true}
        onCurrentTimeUpdated={onTime}
        style={{ width: 180, height: 40 }}
      />
    </masonview>
  )
}
