// Self-drive flag — always on native: the demosweep and theme probes
// exercise the [self] timers as part of their asserted flow; there's no
// URL param to gate them behind anyway.
export const SELF_DRIVE = true

// OS-mediated actions (pickers, browser, permission prompts) are never
// self-driven — sweeps run unattended. Flip locally when deliberately
// exercising an OS-UI flow on a device you're watching.
export const SELF_DRIVE_OS = false
