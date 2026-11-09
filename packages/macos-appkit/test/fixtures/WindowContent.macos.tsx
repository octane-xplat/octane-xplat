/** @jsxImportSource @octane-xplat/jsx */

export const windowRefEvents: string[] = []

const trackRef = (view: any) => {
  if (view) {
    windowRefEvents.push('attach')
    return () => windowRefEvents.push('cleanup')
  }
}

export default function SecondaryWindow() {
  return <label text="secondary window" ref={trackRef} />
}
