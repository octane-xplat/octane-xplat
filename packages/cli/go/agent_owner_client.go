package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"time"
)

func ownerHex(value string, length int) bool {
	if len(value) != length {
		return false
	}
	for _, c := range []byte(value) {
		if !(c >= '0' && c <= '9' || c >= 'a' && c <= 'f') {
			return false
		}
	}
	return true
}

type agentOwnerClient struct {
	adopted    bool
	descriptor agentOwnerDescriptor
	directory  string
}

func agentOwnerCacheParent() (string, error) {
	if configured := os.Getenv("XPLAT_MCP_CACHE"); configured != "" {
		return filepath.Abs(filepath.Join(configured, "cli-go"))
	}
	parent, err := os.UserCacheDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(parent, "octane-xplat", "cli-go"), nil
}
func agentOwnerDirectory(parent, project string) (string, error) {
	if parent == "" {
		return "", errors.New("native owner requires a cache parent")
	}
	project, err := knownOwnerProjectPath(project)
	if err != nil {
		return "", err
	}
	namespace, err := prospectiveHistoryPath(filepath.Join(parent, "owner-go-v1"))
	if err != nil {
		return "", err
	}
	if inside(project, namespace) {
		return "", errors.New("native owner cache must be outside the project")
	}
	return filepath.Join(namespace, fmt.Sprintf("%x", sha256.Sum256([]byte(filesystemKey(project))))), nil
}

// A missing cache or descriptor means no owner. Malformed, inaccessible or stale
// ownership evidence is an error, not permission to start a replacement.
func lookupAgentOwner(ctx context.Context, parent, project string) (*agentOwnerClient, *cliError) {
	project, err := knownOwnerProjectPath(project)
	if err != nil {
		return nil, executionFailure(err)
	}
	directory, err := agentOwnerDirectory(parent, project)
	if err != nil {
		return nil, executionFailure(err)
	}
	if err = validatePrivateCache(filepath.Dir(directory)); os.IsNotExist(err) {
		return nil, nil
	} else if err != nil {
		return nil, executionFailure(err)
	}
	return connectAgentOwnerAt(ctx, directory, project)
}
func connectAgentOwnerAt(ctx context.Context, directory, project string) (*agentOwnerClient, *cliError) {
	project, err := knownOwnerProjectPath(project)
	if err != nil {
		return nil, executionFailure(err)
	}
	if err := ctx.Err(); err != nil {
		return nil, executionFailure(err)
	}
	if err := validatePrivateCache(directory); os.IsNotExist(err) {
		return nil, nil
	} else if err != nil {
		return nil, executionFailure(err)
	}
	root, err := os.OpenRoot(directory)
	if err != nil {
		return nil, executionFailure(err)
	}
	defer root.Close()
	data, err := historyFile(root, "owner.json", 64<<10)
	if os.IsNotExist(err) {
		return nil, nil
	}
	if err != nil {
		return nil, executionFailure(err)
	}
	var descriptor agentOwnerDescriptor
	if err = json.Unmarshal(data, &descriptor); err != nil {
		return nil, executionFailure(errors.New("invalid native owner descriptor JSON"))
	}
	if err = validateAgentOwnerDescriptor(descriptor, project); err != nil {
		return nil, executionFailure(err)
	}
	if descriptor.State != "running" {
		return nil, ownerDisconnected("Native owner cleanup is unknown; inspect retained resources before replacing it.")
	}
	client := &agentOwnerClient{descriptor: descriptor, directory: directory}
	response, failure := client.call(ctx, "host.ping", nil)
	if failure != nil {
		return nil, failure
	}
	var ping struct {
		Generation, Project, Implementation string
		Adopted                             *bool
		BinarySHA256, LaunchID              string
		ProtocolVersion                     int
	}
	if json.Unmarshal(response, &ping) != nil || ping.Generation != descriptor.Generation || ping.Project != project || ping.Implementation != "go" || ping.ProtocolVersion != agentOwnerProtocolVersion || ping.Adopted == nil || ping.BinarySHA256 != descriptor.BinarySHA256 || ping.LaunchID != descriptor.LaunchID {
		return nil, ownerDisconnected("Native owner readiness identity does not match its descriptor.")
	}
	client.adopted = *ping.Adopted
	return client, nil
}
func validateAgentOwnerDescriptor(descriptor agentOwnerDescriptor, project string) error {
	if descriptor.Protocol != "octane-agent-owner" || descriptor.Version != agentOwnerProtocolVersion || descriptor.Project != project || !ownerHex(descriptor.Generation, 32) || !ownerHex(descriptor.Token, 64) || descriptor.PID < 1 || (descriptor.State != "running" && descriptor.State != "cleanup-unknown") {
		return errors.New("invalid native owner project, protocol or generation")
	}
	if (descriptor.LaunchID != "" || descriptor.BinarySHA256 != "") && (!ownerHex(descriptor.LaunchID, 32) || !ownerHex(descriptor.BinarySHA256, 64)) {
		return errors.New("invalid native owner executable identity")
	}
	endpoint, err := url.Parse(descriptor.Address)
	if err != nil {
		return errors.New("invalid native owner loopback endpoint")
	}
	port, err := strconv.Atoi(endpoint.Port())
	if err != nil || port < 1 || port > 65535 || endpoint.Host != fmt.Sprintf("127.0.0.1:%d", port) || endpoint.Scheme != "http" || endpoint.User != nil || endpoint.Path != "/rpc" || endpoint.RawPath != "" || endpoint.RawQuery != "" || endpoint.ForceQuery || endpoint.Fragment != "" || endpoint.Opaque != "" {
		return errors.New("native owner endpoint must be an exact HTTP IPv4 loopback RPC address")
	}
	return nil
}
func ownerDisconnected(message string) *cliError {
	return &cliError{Code: "disconnected_runtime", Message: message, Recovery: map[string]string{"action": "Retry a read after the owner finishes retiring. Inspect unconfirmed ownership before starting a replacement."}}
}
func (client *agentOwnerClient) call(parent context.Context, method string, params map[string]any) (json.RawMessage, *cliError) {
	// Revalidate before sending a secret even if an internal caller altered a copy.
	if err := validateAgentOwnerDescriptor(client.descriptor, client.descriptor.Project); err != nil {
		return nil, executionFailure(err)
	}
	body, err := json.Marshal(agentOwnerRequest{Method: method, Params: params})
	if err != nil {
		return nil, executionFailure(err)
	}
	if len(body) > 1<<20 {
		return nil, invalid("Native owner request exceeds 1 MiB.")
	}
	budget, headers := 10*time.Second, 5*time.Second
	if method == "sessions.endOwned" || method == "sessions.end" {
		budget, headers = 30*time.Second, 30*time.Second
	}
	ctx, cancel := context.WithTimeout(parent, budget)
	defer cancel()
	request, err := http.NewRequestWithContext(ctx, "POST", client.descriptor.Address, bytes.NewReader(body))
	if err != nil {
		return nil, executionFailure(err)
	}
	request.Header.Set("Authorization", "Bearer "+client.descriptor.Token)
	request.Header.Set("X-Octane-Owner", client.descriptor.Generation)
	request.Header.Set("Content-Type", "application/json")
	transport := &http.Transport{Proxy: nil, ResponseHeaderTimeout: headers}
	defer transport.CloseIdleConnections()
	response, err := (&http.Client{Transport: transport, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}).Do(request)
	if err != nil {
		if ctx.Err() != nil {
			return nil, executionFailure(ctx.Err())
		}
		return nil, ownerDisconnected("The native owner did not answer; stored PIDs do not authorize takeover.")
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, ownerDisconnected("The native owner rejected RPC authentication or is retiring.")
	}
	data, err := io.ReadAll(io.LimitReader(response.Body, (16<<20)+1))
	if err != nil && ctx.Err() != nil {
		return nil, executionFailure(ctx.Err())
	}
	if err != nil || len(data) > 16<<20 {
		return nil, ownerDisconnected("The native owner reply is unavailable or exceeds 16 MiB.")
	}
	var envelope struct {
		OK         *bool           `json:"ok"`
		Generation string          `json:"generation"`
		Data       json.RawMessage `json:"data"`
		Error      *cliError       `json:"error"`
	}
	if json.Unmarshal(data, &envelope) != nil || envelope.OK == nil || envelope.Generation != client.descriptor.Generation {
		return nil, ownerDisconnected("The native owner reply has an invalid generation or envelope.")
	}
	if !*envelope.OK {
		if envelope.Error == nil || envelope.Error.Code == "" || envelope.Error.Message == "" {
			return nil, ownerDisconnected("The native owner returned an invalid error.")
		}
		return nil, envelope.Error
	}
	if len(envelope.Data) == 0 {
		return nil, ownerDisconnected("The native owner omitted its result.")
	}
	return envelope.Data, nil
}
