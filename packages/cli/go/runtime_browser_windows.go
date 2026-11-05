//go:build windows

package main

func runtimeBrowserPlatformArgs() []string {
	// Keep Edge/Chrome inside the launched process tree instead of relaunching
	// through a broker. These are Playwright's Windows launch safeguards:
	// https://github.com/microsoft/playwright/blob/1482237ae441b56b777dd128d98606fe6d26b61c/packages/playwright-core/src/server/chromium/chromiumSwitches.ts
	return []string{"--edge-skip-compat-layer-relaunch", "--do-not-de-elevate"}
}
