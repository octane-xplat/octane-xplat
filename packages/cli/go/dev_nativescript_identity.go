package main

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
func (capture *historyCapture) observeNativeScriptIdentity(line string, truncated bool) error {
	if truncated || len(line) > 8192 || !strings.Contains(line, "Successfully synced application") {
		return nil
	}
	capture.Lock()
	defer capture.Unlock()
	if capture.closed || (capture.session.Platform != "ios" && capture.session.Platform != "android") {
		return nil
	}
	match := nativeScriptSyncIdentity.FindStringSubmatch(strings.TrimSpace(runtimeANSI.ReplaceAllString(line, "")))
	if len(match) != 3 || len(match[1]) > 255 || (match[2] != capture.session.TargetID && strings.TrimSuffix(match[2], ".") != capture.session.TargetID) {
		return nil
	}
	if capture.session.Platform == "android" && !androidNativeAppID.MatchString(match[1]) {
		return nil
	}
	if current := capture.session.NativeIdentity; current != nil {
		if current.AppID == match[1] {
			return nil
		}
		return errors.New("NativeScript package identity changed within this capture; start a new dev session for fresh diagnostics")
	}
	capture.session.NativeIdentity = &devNativeIdentity{AppID: match[1], Processes: []devNativeProcess{}}
	return historyMetadata(capture.root, capture.session)
}
