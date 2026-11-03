// Run the actual public native entry and model jobs with already pinned assets.
process.env.XPLAT_GO_PORTABLE = '1'
await import('./docs-index.test.mjs')
