/** Windows has no Canvas WebGPU backend. Returns null before device
 *  acquisition — typed `any` to match the other platforms' getGPU signature. */
export function getGPU(): any {
  return null
}
