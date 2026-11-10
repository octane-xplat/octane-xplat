/** @jsxImportSource @octane-xplat/jsx */
export function usePresentation(open: boolean, Panel: any, props: any) {
  return open ? <Panel {...props} /> : null
}
