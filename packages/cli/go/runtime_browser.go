package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"runtime"
	"slices"
	"strconv"
	"strings"
	"sync/atomic"
	"time"

	"github.com/coder/websocket"
)

var runtimeBrowserPath = regexp.MustCompile(`^/devtools/browser/[a-zA-Z0-9-]{1,128}$`)

func runtimeEnvironmentValue(environment []string, name string) string {
	for i := len(environment) - 1; i >= 0; i-- {
		key, value, ok := strings.Cut(environment[i], "=")
		if ok && ((runtime.GOOS == "windows" && strings.EqualFold(key, name)) || key == name) {
			return value
		}
	}
	return ""
}
func runtimeChromium(execution runtimeExecution) string {
	value := func(name string) string { return runtimeEnvironmentValue(execution.Environment, name) }
	candidates := []string{value("XPLAT_MCP_CHROMIUM")}
	switch runtime.GOOS {
	case "darwin":
		candidates = append(candidates, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Chromium.app/Contents/MacOS/Chromium", "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge")
	case "windows":
		for _, base := range []string{value("PROGRAMFILES"), value("PROGRAMFILES(X86)")} {
			if base != "" {
				candidates = append(candidates, filepath.Join(base, "Google/Chrome/Application/chrome.exe"), filepath.Join(base, "Microsoft/Edge/Application/msedge.exe"))
			}
		}
	case "linux":
		for _, directory := range filepath.SplitList(value("PATH")) {
			if filepath.IsAbs(directory) {
				for _, name := range []string{"chromium", "chromium-browser", "google-chrome", "google-chrome-stable"} {
					candidates = append(candidates, filepath.Join(directory, name))
				}
			}
		}
	}
	cache := value("PLAYWRIGHT_BROWSERS_PATH")
	if cache == "" {
		switch runtime.GOOS {
		case "darwin":
			cache = filepath.Join(value("HOME"), "Library/Caches/ms-playwright")
		case "windows":
			cache = filepath.Join(value("LOCALAPPDATA"), "ms-playwright")
		default:
			base := value("XDG_CACHE_HOME")
			if base == "" {
				base = filepath.Join(value("HOME"), ".cache")
			}
			cache = filepath.Join(base, "ms-playwright")
		}
	}
	if entries, err := os.ReadDir(cache); err == nil && len(entries) <= 128 {
		slices.Reverse(entries)
		for _, entry := range entries {
			if !entry.IsDir() || !strings.HasPrefix(entry.Name(), "chromium") {
				continue
			}
			base := filepath.Join(cache, entry.Name())
			for _, name := range []string{"chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing", "chrome-mac/Chromium.app/Contents/MacOS/Chromium", "chrome-linux/chrome", "chrome-linux64/chrome", "chrome-win/chrome.exe", "chrome-win64/chrome.exe", "chrome-headless-shell-linux64/chrome-headless-shell", "chrome-headless-shell-mac-arm64/chrome-headless-shell"} {
				candidates = append(candidates, filepath.Join(base, name))
			}
		}
	}
	for _, candidate := range candidates {
		if filepath.IsAbs(candidate) {
			if info, err := os.Stat(candidate); err == nil && info.Mode().IsRegular() && (runtime.GOOS == "windows" || info.Mode().Perm()&0111 != 0) {
				return candidate
			}
		}
	}
	return ""
}

// The returned joiner is required even when startup fails. It observes the
// managed process handle, never signals a PID learned from DevTools metadata.
func launchRuntimeBrowser(ctx context.Context, parent, address, mode string, failed context.CancelCauseFunc) (map[string]any, func() error, error) {
	execution := ctx.Value(runtimeExecutionKey{}).(runtimeExecution)
	program := runtimeChromium(execution)
	if program == "" {
		return nil, func() error { return nil }, nil
	}
	profile, err := privateDirectory(parent, "browser-")
	if err != nil {
		return nil, func() error { return nil }, err
	}
	// End first joins the engine, then closes the owned browser gracefully.
	// The joiner always escalates through the retained group/Job if needed.
	child, cancel := context.WithCancel(context.WithoutCancel(ctx))
	done := make(chan error, 1)
	var process processResult // Published by the done channel before join reads it.
	var closing atomic.Bool
	endpoint := ""
	args := []string{program, "--user-data-dir=" + profile, "--remote-debugging-address=127.0.0.1", "--remote-debugging-port=0", "--no-first-run", "--no-default-browser-check"}
	// A private automation browser must not start background extensions, sync,
	// sign-in or updater services. Follow Playwright's automation defaults,
	// retaining sandboxing and the application's ordinary network access.
	args = append(args, "--enable-automation", "--disable-background-networking", "--disable-component-update", "--disable-component-extensions-with-background-pages", "--disable-default-apps", "--disable-extensions", "--disable-sync", "--no-service-autorun", "--disable-features=DestroyProfileOnBrowserClose,msForceBrowserSignIn")
	args = append(args, runtimeBrowserPlatformArgs()...)
	if mode != "headed" {
		args = append(args, "--headless=new", "--disable-gpu")
	}
	args = append(args, address)
	go func() {
		var err error
		process, err = runProcess(child, args, parent, execution.Environment)
		if err == nil && !process.Cancelled && process.ExitCode != 0 {
			err = fmt.Errorf("Chromium exited %d", process.ExitCode)
		}
		done <- err
		if child.Err() == nil && !closing.Load() {
			failed(fmt.Errorf("Chromium exited while the session was active (exit %d): %v", process.ExitCode, err))
		}
	}()
	var observed error
	joined := false
	join := func() error {
		closing.Store(true)
		var closeFailure error
		if !joined && endpoint != "" {
			closeFailure = requestRuntimeBrowserClose(endpoint)
			// A browser can receive the request and close the connection before
			// acknowledging it. Still allow its managed process to finish.
			select {
			case observed = <-done:
				joined = true
			case <-time.After(5 * time.Second):
			}
		}
		joinedBeforeCancel := joined
		cancel()
		if !joined {
			observed = <-done
			joined = true
		}
		if requiresFailureEvidence(observed) {
			return fmt.Errorf("%w; browser profile retained at %s", observed, profile)
		}
		if err := removeRuntimeBrowserProfile(profile); err != nil {
			tail := func(value string, limit int) string {
				if len(value) > limit {
					value = strings.ToValidUTF8(value[len(value)-limit:], "�")
				}
				return value
			}
			failure := &cliError{
				Code:    "execution_failure",
				Message: fmt.Sprintf("browser profile retained at %s (DevTools close: %v; joined before cancellation: %t): %v", profile, closeFailure, joinedBeforeCancel, err),
				Context: map[string]any{"browserProcess": map[string]any{
					"exitCode": process.ExitCode, "cancelled": process.Cancelled,
					"stdout": tail(process.Stdout, 2048), "stderr": tail(process.Stderr, 4096),
					"truncated": process.Truncated,
				}},
			}
			return &runtimeSessionCleanupError{Err: failure}
		}
		return observed
	}
	deadline := time.NewTimer(30 * time.Second)
	defer deadline.Stop()
	for {
		if data, err := metadataBytes(filepath.Join(profile, "DevToolsActivePort"), 4096); err == nil {
			lines := strings.Split(strings.TrimSpace(string(data)), "\n")
			if len(lines) == 2 {
				port, e := strconv.Atoi(strings.TrimSpace(lines[0]))
				if e == nil && port > 0 && port <= 65535 && runtimeBrowserPath.MatchString(lines[1]) {
					endpoint = fmt.Sprintf("ws://127.0.0.1:%d%s", port, lines[1])
					kind := "headless"
					if mode == "headed" {
						kind = mode
					}
					return map[string]any{"devtoolsUrl": fmt.Sprintf("http://127.0.0.1:%d", port), "mode": kind, "ownership": "owned", "executable": program}, join, nil
				}
			}
		}
		select {
		case observed = <-done:
			joined = true
			return nil, join, fmt.Errorf("Chromium exited before DevTools readiness: %v", observed)
		case <-ctx.Done():
			return nil, join, ctx.Err()
		case <-deadline.C:
			return nil, join, fmt.Errorf("%w: Chromium did not publish DevTools readiness", context.DeadlineExceeded)
		case <-time.After(25 * time.Millisecond):
		}
	}
}

// The endpoint comes only from this launch's private profile. Do not redirect,
// proxy, or infer shutdown authority from a separately discovered process PID.
func requestRuntimeBrowserClose(endpoint string) error {
	address, err := url.Parse(endpoint)
	if err != nil || address.Scheme != "ws" || address.Hostname() != "127.0.0.1" || address.User != nil || address.RawQuery != "" || address.Fragment != "" || !runtimeBrowserPath.MatchString(address.Path) {
		return fmt.Errorf("invalid owned browser endpoint")
	}
	port, err := strconv.Atoi(address.Port())
	if err != nil || port < 1 || port > 65535 {
		return fmt.Errorf("invalid owned browser port")
	}
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	transport := &http.Transport{Proxy: nil}
	defer transport.CloseIdleConnections()
	client := &http.Client{Transport: transport, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	connection, _, err := websocket.Dial(ctx, endpoint, &websocket.DialOptions{HTTPClient: client})
	if err != nil {
		return err
	}
	defer connection.CloseNow()
	connection.SetReadLimit(64 << 10)
	message := `{"id":1,"method":"Browser.close"}`
	if err := connection.Write(ctx, websocket.MessageText, []byte(message)); err != nil {
		return err
	}
	for range 8 {
		_, data, err := connection.Read(ctx)
		if err != nil {
			return fmt.Errorf("browser close acknowledgement: %w", err)
		}
		var reply struct {
			ID    int             `json:"id"`
			Error json.RawMessage `json:"error"`
		}
		if json.Unmarshal(data, &reply) != nil {
			return fmt.Errorf("invalid browser close reply")
		}
		if reply.ID == 1 {
			if len(reply.Error) != 0 && string(reply.Error) != "null" {
				return fmt.Errorf("DevTools rejected owned browser shutdown")
			}
			return nil
		}
	}
	return fmt.Errorf("browser close reply exceeds event bound")
}

// Job/group cleanup has already completed. Windows can briefly retain a sharing
// lock after process exit; retry only that error, never a general access failure.
func removeRuntimeBrowserProfile(profile string) error {
	deadline := time.Now().Add(3 * time.Second)
	for {
		err := os.RemoveAll(profile)
		if !fileSharingViolation(err) || !time.Now().Before(deadline) {
			return err
		}
		time.Sleep(50 * time.Millisecond)
	}
}
