package main

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/url"
	"slices"
	"time"
)

// Source maps are optional enrichment of an already-confirmed app failure.
// Contact only observed loopback Vite engines, never URLs from runtime stacks.
func (service *devActions) resolveFailureStacks(parent context.Context, peer *devAppPeer, failures []json.RawMessage) ([]json.RawMessage, string) {
	stacks := make([]string, len(failures))
	records := make([]map[string]json.RawMessage, len(failures))
	for i, raw := range failures {
		var record map[string]json.RawMessage
		if json.Unmarshal(raw, &record) != nil || record == nil {
			continue
		}
		// App-supplied sourceStack is not evidence of Vite resolution.
		delete(record, "sourceStack")
		records[i] = record
		failures[i], _ = json.Marshal(record)
		var stack string
		if json.Unmarshal(record["stack"], &stack) == nil && len(stack) <= 8192 {
			stacks[i] = stack
		}
	}
	if len(failures) == 0 {
		return failures, "runtime-raw"
	}
	hub := service.server.apps
	hub.mu.Lock()
	grant := hub.grants[peer.target]
	if grant == nil {
		hub.mu.Unlock()
		return failures, "runtime-raw"
	}
	token, instance, target := grant.Token, grant.InstanceID, grant.TargetID
	origins := []string{}
	for origin := range grant.origins {
		if stackOrigin(origin) != nil {
			origins = append(origins, origin)
		}
	}
	hub.mu.Unlock()
	slices.Sort(origins)
	if len(origins) > 4 {
		origins = origins[:4]
	}
	ctx, cancel := context.WithTimeout(parent, 2*time.Second)
	defer cancel()
	mapped := false
	for _, origin := range origins {
		endpoint := stackOrigin(origin)
		body, _ := json.Marshal(map[string]any{"version": 1, "instanceId": instance, "targetId": target, "stacks": stacks})
		if len(body) > 32<<10 {
			break
		}
		request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint.String(), bytes.NewReader(body))
		if err != nil {
			continue
		}
		request.Header.Set("X-Xplat-Dev-Token", token)
		request.Header.Set("Content-Type", "application/json")
		transport := &http.Transport{Proxy: nil, ResponseHeaderTimeout: time.Second, MaxResponseHeaderBytes: 16 << 10}
		if endpoint.Hostname() == "localhost" {
			port := endpoint.Port()
			transport.DialContext = func(ctx context.Context, network, address string) (net.Conn, error) {
				return (&net.Dialer{}).DialContext(ctx, network, net.JoinHostPort("127.0.0.1", port))
			}
		}
		client := &http.Client{Transport: transport, CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
		response, err := client.Do(request)
		if err != nil {
			transport.CloseIdleConnections()
			continue
		}
		data, readErr := io.ReadAll(io.LimitReader(response.Body, (128<<10)+1))
		response.Body.Close()
		transport.CloseIdleConnections()
		var result struct {
			Version      int       `json:"version"`
			InstanceID   string    `json:"instanceId"`
			TargetID     string    `json:"targetId"`
			SourceStacks []*string `json:"sourceStacks"`
		}
		if readErr != nil || len(data) > 128<<10 || response.StatusCode != http.StatusOK || json.Unmarshal(data, &result) != nil || result.Version != 1 || result.InstanceID != instance || result.TargetID != target || len(result.SourceStacks) != len(stacks) {
			continue
		}
		for i, source := range result.SourceStacks {
			if records[i] == nil || stacks[i] == "" || source == nil || *source == stacks[i] || len(*source) > 16<<10 {
				continue
			}
			record := records[i]
			previous := record["sourceStack"]
			record["sourceStack"], _ = json.Marshal(*source)
			enriched, _ := json.Marshal(record)
			before := failures[i]
			failures[i] = enriched
			all, _ := json.Marshal(failures)
			if len(all) > 24<<10 {
				failures[i] = before
				if previous == nil {
					delete(record, "sourceStack")
				} else {
					record["sourceStack"] = previous
				}
				continue
			}
			mapped = true
		}
	}
	if mapped {
		return failures, "vite-current"
	}
	return failures, "runtime-raw"
}

func stackOrigin(raw string) *url.URL {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.User != nil || parsed.RawQuery != "" || parsed.Fragment != "" || parsed.Path != "" || parsed.Port() == "" || (parsed.Scheme != "http" && parsed.Scheme != "https") {
		return nil
	}
	host := parsed.Hostname()
	if host != "localhost" {
		ip := net.ParseIP(host)
		if ip == nil || !ip.IsLoopback() {
			return nil
		}
	}
	parsed.Path = "/__xplat_dev__/stacks"
	return parsed
}
