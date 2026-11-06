package cli

import "time"

import "github.com/octane-xplat/octane-xplat/packages/cli/go/internal/osfs"

func Object(value any) map[string]any { result, _ := value.(map[string]any); return result }
func ValueAt(value any, keys ...string) any {
	for _, key := range keys {
		value = Object(value)[key]
	}
	return value
}
func StringValue(value any) string { result, _ := value.(string); return result }
func JsonObject(path string) map[string]any {
	var value map[string]any
	if osfs.ReadJSON(path, &value) != nil {
		return nil
	}
	return value
}
func IsoNow() string { return time.Now().UTC().Format("2006-01-02T15:04:05.000Z") }
func RequestUUID() string {
	raw := osfs.Identity()
	return "req-" + raw[:8] + "-" + raw[8:12] + "-4" + raw[13:16] + "-a" + raw[17:20] + "-" + raw[20:]
}
