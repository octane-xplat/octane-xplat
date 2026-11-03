package main

import (
	"context"
	"crypto/tls"
	"crypto/x509"
	"errors"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
)

type httpRequest struct {
	URL, Method, Body, CA, Proxy string
	Headers                      map[string]string
	MaxBytes                     int64
}

func fetchHTTP(ctx context.Context, input httpRequest) (any, error) {
	if input.Method == "" {
		input.Method = "GET"
	}
	if input.MaxBytes == 0 {
		input.MaxBytes = 1 << 20
	}
	if input.MaxBytes < 1 || input.MaxBytes > 64<<20 {
		return nil, errors.New("invalid HTTP byte limit")
	}
	transport := http.DefaultTransport.(*http.Transport).Clone()
	defer transport.CloseIdleConnections()
	if input.CA != "" {
		data, err := os.ReadFile(input.CA)
		if err != nil {
			return nil, err
		}
		roots, err := x509.SystemCertPool()
		if err != nil {
			roots = x509.NewCertPool()
		}
		if !roots.AppendCertsFromPEM(data) {
			return nil, errors.New("invalid task CA")
		}
		transport.TLSClientConfig = &tls.Config{RootCAs: roots, MinVersion: tls.VersionTLS12}
	}
	if input.Proxy != "" {
		proxy, err := url.Parse(input.Proxy)
		if err != nil {
			return nil, err
		}
		transport.Proxy = http.ProxyURL(proxy)
	}
	request, err := http.NewRequestWithContext(ctx, input.Method, input.URL, strings.NewReader(input.Body))
	if err != nil {
		return nil, err
	}
	for key, value := range input.Headers {
		request.Header.Set(key, value)
	}
	response, err := (&http.Client{Transport: transport}).Do(request)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	body, err := io.ReadAll(io.LimitReader(response.Body, input.MaxBytes+1))
	if err != nil {
		return nil, err
	}
	if int64(len(body)) > input.MaxBytes {
		return nil, errors.New("HTTP response exceeds byte limit")
	}
	return map[string]any{"status": response.StatusCode, "headers": response.Header, "body": strings.TrimPrefix(strings.ToValidUTF8(string(body), "�"), "\ufeff"), "url": response.Request.URL.String()}, nil
}
