// Experimental host bootstrap; avoids the production shim's broader SDK needs.
globalThis.console = { log: (...args) => __hostLog(...args) }
