// Web: the glb is served from apps/web/public by the dev server.
export async function readModelBytes(): Promise<ArrayBuffer> {
  const response = await fetch('/DamagedHelmet.glb')
  if (!response.ok) {
    throw new Error(`engine demo: fetch /DamagedHelmet.glb -> ${response.status}`)
  }
  return response.arrayBuffer()
}
