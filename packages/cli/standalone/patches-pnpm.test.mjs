// Optional manual pnpm compatibility qualification; excluded from routine suites.
process.env.XPLAT_PATCH_MANAGER = 'pnpm'
await import('./patches-install.test.mjs')
