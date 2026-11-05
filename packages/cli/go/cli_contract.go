package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"math/big"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf16"
)

type flagDescriptor struct {
	Flag    string          `json:"flag"`
	Short   string          `json:"short"`
	Key     string          `json:"key"`
	Type    string          `json:"type"`
	Desc    string          `json:"desc"`
	Values  []string        `json:"values"`
	Default json.RawMessage `json:"default"`
	Min     *float64        `json:"min"`
	Max     *float64        `json:"max"`
}
type positionalDescriptor struct {
	Name     string `json:"name"`
	Required bool   `json:"required"`
	Variadic bool   `json:"variadic,omitempty"`
	Min      *int   `json:"min"`
	Max      *int   `json:"max"`
}
type commandDescriptor struct {
	Name        string                 `json:"name"`
	Path        []string               `json:"path"`
	Summary     string                 `json:"summary"`
	Context     string                 `json:"context"`
	Flags       []flagDescriptor       `json:"flags"`
	Positionals []positionalDescriptor `json:"positionals"`
	Examples    []string               `json:"examples"`
}
type cliError struct {
	Retryable *bool  `json:"retryable,omitempty"`
	Code      string `json:"code"`
	Message   string `json:"message"`
	Recovery  any    `json:"recovery,omitempty"`
	Context   any    `json:"context,omitempty"`
	cause     error
}

func (e *cliError) Error() string { return e.Message }
func (e *cliError) Unwrap() error { return e.cause }

func requiresFailureEvidence(err error) bool {
	var devCleanup *devServerCleanupError
	if errors.As(err, &devCleanup) {
		return true
	}
	var mutation *workspaceMutationError
	if errors.As(err, &mutation) {
		return true
	}
	var clean *cleanFailure
	if errors.As(err, &clean) && (len(clean.Removed) > 0 || len(clean.Attempted) > 0) {
		return true
	}
	var cleanup *processCleanupError
	if errors.As(err, &cleanup) {
		return true
	}
	var publication *artifactPublicationError
	return errors.As(err, &publication) && (len(publication.Published) > 0 || len(publication.Retained) > 0)
}
func executionFailure(err error) *cliError {
	code := "execution_failure"
	if !requiresFailureEvidence(err) {
		if errors.Is(err, context.Canceled) {
			code = "cancelled"
		} else if errors.Is(err, context.DeadlineExceeded) {
			code = "timeout"
		}
	}
	return &cliError{Code: code, Message: err.Error(), cause: err}
}
func contextualFailure(ctx context.Context, failure *cliError) *cliError {
	if ctx.Err() == nil {
		return failure
	}
	if failure != nil && requiresFailureEvidence(failure) {
		return failure
	}
	return executionFailure(ctx.Err())
}
func invalid(message string, recovery ...string) *cliError {
	err := &cliError{Code: "invalid_selection", Message: message}
	if len(recovery) > 0 {
		err.Recovery = map[string]string{"action": recovery[0]}
	}
	return err
}
func errorExit(err *cliError) int {
	switch err.Code {
	case "invalid_selection", "ambiguous_selection", "not_found":
		return 2
	case "prerequisite_missing", "unavailable", "unsupported_capability", "target_busy":
		return 3
	case "permission_denied":
		return 4
	case "disconnected_runtime":
		return 6
	case "timeout":
		return 7
	case "cancelled":
		return 8
	default:
		return 5
	}
}

type parsedCommand struct {
	Values map[string]any `json:"values,omitempty"`
	Help   bool           `json:"help,omitempty"`
	Errors []*cliError    `json:"errors,omitempty"`
}

var decimalNumber = regexp.MustCompile(`^[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[eE][+-]?[0-9]+)?$`)

func contractWhitespace(r rune) bool {
	return r == '\t' || r == '\n' || r == '\v' || r == '\f' || r == '\r' || r == ' ' || r == 0xa0 || r == 0xfeff || r == 0x1680 || r >= 0x2000 && r <= 0x200a || r == 0x2028 || r == 0x2029 || r == 0x202f || r == 0x205f || r == 0x3000
}
func numericArgument(raw string) (float64, bool) {
	s := strings.TrimFunc(raw, contractWhitespace)
	if s == "" {
		return 0, true
	}
	if len(s) > 2 && s[0] == '0' && strings.ContainsAny(s[1:2], "xXoObB") {
		base := map[byte]int{'x': 16, 'X': 16, 'o': 8, 'O': 8, 'b': 2, 'B': 2}[s[1]]
		if strings.ContainsAny(s[2:], "+-_") {
			return 0, false
		}
		n, ok := new(big.Int).SetString(s[2:], base)
		if !ok {
			return 0, false
		}
		f, _ := new(big.Float).SetInt(n).Float64()
		return f, !math.IsInf(f, 0)
	}
	if !decimalNumber.MatchString(s) {
		return 0, false
	}
	f, err := strconv.ParseFloat(s, 64)
	if err != nil || math.IsInf(f, 0) || math.IsNaN(f) {
		return 0, false
	}
	if f == 0 {
		f = 0
	}
	return f, true
}
func numericText(value float64) string {
	if math.Abs(value) >= 1e-6 && math.Abs(value) < 1e21 || value == 0 {
		return strconv.FormatFloat(value, 'f', -1, 64)
	}
	text := strconv.FormatFloat(value, 'g', -1, 64)
	text = strings.ReplaceAll(text, "e+0", "e+")
	text = strings.ReplaceAll(text, "e-0", "e-")
	return text
}
func parseCommand(command commandDescriptor, argv []string) parsedCommand {
	values := map[string]any{}
	positionals := []string{}
	help := false
	declared := map[string]flagDescriptor{}
	for _, def := range command.Flags {
		declared[def.Flag] = def
		if def.Short != "" {
			declared[def.Short] = def
		}
	}
	fail := func(err *cliError) parsedCommand { return parsedCommand{Errors: []*cliError{err}} }
	for i := 0; i < len(argv); i++ {
		token := argv[i]
		if token == "--" {
			positionals = append(positionals, argv[i+1:]...)
			break
		}
		if !strings.HasPrefix(token, "-") {
			positionals = append(positionals, token)
			continue
		}
		name, raw, hasValue := strings.Cut(token, "=")
		name = strings.TrimPrefix(strings.TrimPrefix(name, "-"), "-")
		if name == "help" || name == "h" {
			help = true
			continue
		}
		def, ok := declared[name]
		if !ok {
			return fail(invalid(fmt.Sprintf("Unknown option --%s for `xplat %s`.", name, command.Name), fmt.Sprintf("Run `xplat %s --help` or `--schema` for its contract.", command.Name)))
		}
		if !hasValue && def.Type != "boolean" {
			if i+1 == len(argv) || (strings.HasPrefix(argv[i+1], "-") && argv[i+1] != "-") {
				return fail(invalid("--" + name + " expects a value."))
			}
			i++
			raw = argv[i]
			hasValue = true
		}
		key := def.Key
		if key == "" {
			key = def.Flag
		}
		switch def.Type {
		case "boolean":
			if hasValue {
				return fail(invalid("--" + def.Flag + " takes no value"))
			}
			values[key] = true
		case "integer":
			n, ok := numericArgument(raw)
			if !ok || math.Trunc(n) != n {
				return fail(invalid(fmt.Sprintf("--%s expects an integer, got %q", def.Flag, raw)))
			}
			if def.Min != nil && n < *def.Min {
				return fail(invalid(fmt.Sprintf("--%s must be >= %s, got %s", def.Flag, numericText(*def.Min), numericText(n))))
			}
			if def.Max != nil && n > *def.Max {
				return fail(invalid(fmt.Sprintf("--%s must be <= %s, got %s", def.Flag, numericText(*def.Max), numericText(n))))
			}
			values[key] = n
		case "enum":
			matched := false
			for _, allowed := range def.Values {
				if raw == allowed {
					matched = true
					break
				}
			}
			if !matched {
				return fail(invalid(fmt.Sprintf("--%s must be one of %s — got %q", def.Flag, strings.Join(def.Values, ", "), raw)))
			}
			values[key] = raw
		default:
			values[key] = raw
		}
	}
	if help {
		return parsedCommand{Values: values, Help: true}
	}
	for _, def := range command.Flags {
		key := def.Key
		if key == "" {
			key = def.Flag
		}
		if _, ok := values[key]; !ok && def.Default != nil {
			var value any
			_ = json.Unmarshal(def.Default, &value)
			values[key] = value
		}
	}
	required := []string{}
	for _, def := range command.Positionals {
		if def.Required {
			required = append(required, def.Name)
		}
	}
	if len(positionals) < len(required) {
		return fail(invalid(fmt.Sprintf("Missing required argument <%s> for `xplat %s`.", required[0], command.Name), fmt.Sprintf("Run `xplat %s --help` for usage.", command.Name)))
	}
	if len(positionals) > len(command.Positionals) && (len(command.Positionals) == 0 || !command.Positionals[len(command.Positionals)-1].Variadic) {
		return fail(invalid(fmt.Sprintf("Unexpected argument %q for `xplat %s`.", positionals[len(command.Positionals)], command.Name), fmt.Sprintf("Run `xplat %s --help` for usage.", command.Name)))
	}
	for at, def := range command.Positionals {
		if def.Variadic {
			values[def.Name] = []string{}
			if at < len(positionals) {
				values[def.Name] = append([]string{}, positionals[at:]...)
			}
			break
		}
		if at >= len(positionals) {
			continue
		}
		value := positionals[at]
		length := len(utf16.Encode([]rune(value)))
		if def.Min != nil && length < *def.Min {
			return fail(invalid(fmt.Sprintf("<%s> must be at least %d character(s).", def.Name, *def.Min)))
		}
		if def.Max != nil && length > *def.Max {
			return fail(invalid(fmt.Sprintf("<%s> must be at most %d characters.", def.Name, *def.Max)))
		}
		values[def.Name] = value
	}
	return parsedCommand{Values: values}
}
