export interface XplatMacOSOptions {
  /** App directory used to resolve its toolchain and renderer. Defaults to cwd. */
  root?: string
  /** Bundle the renderer and Octane for the host. Defaults to true. */
  packaged?: boolean
  /** Enable Octane's universal component HMR. Defaults to false. */
  hmr?: boolean
  /** Override the application entry; defaults to src/main.ts when packaged. */
  entry?: string
  outDir?: string
  /** Additional file patterns excluded from the Octane compiler. */
  exclude?: string[]
  /** Override renderer rules; defaults to all reachable TSX/TSRX source. */
  rules?: unknown[]
}
