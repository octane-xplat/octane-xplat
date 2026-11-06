package history

import (
	"errors"
	"regexp"
	"strings"
)

var mobileNativeAppID = regexp.MustCompile(`^[A-Za-z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)+$`)
var androidNativeAppID = regexp.MustCompile(`^[A-Za-z]\w*(?:\.\w+)+$`)
var androidNativeDeviceID = regexp.MustCompile(`^[A-Za-z0-9._:-]+$`)
var nativeScriptSyncIdentity = regexp.MustCompile(`^Successfully synced application ([A-Za-z][A-Za-z0-9_-]*(?:\.[A-Za-z0-9_-]+)+) on device (\S+)$`)

// SDK sync output identifies a package/device pair, not app readiness, a PID or
// authority to terminate an app. Keep the selected device fixed for this capture.
func (capture *Capture) ObserveNativeScriptIdentity(line string, truncated bool) error {
	if truncated || len(line) > 8192 || !strings.Contains(line, "Successfully synced application") {
		return nil
	}
	capture.Lock()
	defer capture.Unlock()
	if capture.closed || (capture.Session.Platform != "ios" && capture.Session.Platform != "android") {
		return nil
	}
	match := nativeScriptSyncIdentity.FindStringSubmatch(strings.TrimSpace(DevANSI.ReplaceAllString(line, "")))
	if len(match) != 3 || len(match[1]) > 255 || (match[2] != capture.Session.TargetID && strings.TrimSuffix(match[2], ".") != capture.Session.TargetID) {
		return nil
	}
	if capture.Session.Platform == "android" && !androidNativeAppID.MatchString(match[1]) {
		return nil
	}
	if current := capture.Session.NativeIdentity; current != nil {
		if current.AppID == match[1] {
			return nil
		}
		return errors.New("NativeScript package identity changed within this capture; start a new dev session for fresh diagnostics")
	}
	capture.Session.NativeIdentity = &DevNativeIdentity{AppID: match[1], Processes: []DevNativeProcess{}}
	return Metadata(capture.root, capture.Session)
}
