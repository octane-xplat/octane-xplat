// Dev-only gate. @octane-xplat/tweaks/vite substitutes this marker with the
// literal `true` in served modules (and injects it via config.define for
// builds). Absent — or false — in production and whenever the plugin is not
// installed; the client then stays inert and useTweak returns its literal.
declare const __OCTANE_TWEAKS__: boolean | undefined
