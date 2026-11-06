package history

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"regexp"
)

var DevANSI = regexp.MustCompile(`\x1b\[[0-?]*[ -/]*[@-~]`)

type DevNativeProcess struct {
	PID        int64  `json:"pid"`
	Executable string `json:"executable"`
	ObservedAt string `json:"observedAt"`
}
type DevNativeIdentity struct {
	AppID            string             `json:"appId"`
	Processes        []DevNativeProcess `json:"processes"`
	DroppedProcesses int                `json:"droppedProcesses,omitempty"`
}
type MacDevFrame struct {
	Protocol string `json:"protocol"`
	Version  int    `json:"version"`
	ID       string `json:"id"`
	OK       *bool  `json:"ok"`
	Data     struct {
		PID        int64  `json:"pid"`
		Executable string `json:"executable"`
		ObservedAt string `json:"observedAt"`
		DevNativeIdentity
	} `json:"data"`
	Error struct {
		Message string `json:"message"`
	} `json:"error"`
}

func (capture *Capture) ObserveMacDev(frame MacDevFrame) error {
	capture.Lock()
	defer capture.Unlock()
	if capture.closed {
		return errors.New("capture retired before native observation")
	}
	identity := frame.Data.DevNativeIdentity
	identity.Processes = append([]DevNativeProcess{}, identity.Processes...)
	capture.Session.NativeIdentity = &identity
	// Host spawn is not an application-readiness handshake.
	capture.Session.Detail = "macOS host spawned; application initialization is not inferred."
	// Keep launch history bounded independently of rotating human log records.
	for {
		data, err := json.Marshal(capture.Session)
		if err != nil {
			return err
		}
		if len(data) <= 64<<10 {
			break
		}
		if len(identity.Processes) <= 1 {
			return errors.New("native launch metadata exceeds 64 KiB")
		}
		identity.Processes = identity.Processes[1:]
		identity.DroppedProcesses++
	}
	return Metadata(capture.root, capture.Session)
}
func DiagnosticsHistoryParent() (string, error) {
	cache, err := os.UserCacheDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(cache, "octane-xplat", "cli-go"), nil
}
