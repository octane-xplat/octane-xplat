export function recorderArguments({
  device,
  bundle,
  output,
  recordingOptions,
  diagnosticCosts,
}) {
  return [
    'xctrace',
    'record',
    '--device',
    device,
    '--template',
    diagnosticCosts ? 'Time Profiler' : 'Animation Hitches',
    '--instrument',
    'os_signpost',
    '--recording-options',
    recordingOptions,
    '--time-limit',
    '180s',
    '--output',
    output,
    '--no-prompt',
    '--launch',
    '--',
    bundle,
  ]
}
