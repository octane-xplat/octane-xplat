// No-op on web — the dump there comes from tools/web-verification/scripts/parity.ts
// driving the /parity route in a real browser instead.
export function onParityStageOpen(_fn: () => void): void {}
