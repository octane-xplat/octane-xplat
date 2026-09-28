import { VIRTUAL_LIST_BENCH_MODE } from './virtual-list-benchmark-mode'

// Native self-drive normally runs the harness probes; the isolated VirtualList
// profile disables them so they cannot change tabs or overlays during a run.
export const SELF_DRIVE = !VIRTUAL_LIST_BENCH_MODE

// OS-mediated actions (pickers, browser, permission prompts) are never
// self-driven — sweeps run unattended. Flip locally when deliberately
// exercising an OS-UI flow on a device you're watching.
export const SELF_DRIVE_OS = false
