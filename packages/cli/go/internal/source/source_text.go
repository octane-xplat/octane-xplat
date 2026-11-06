package source

import (
	"fmt"
	"strings"
	"unicode/utf16"
)

// Continuation offsets count UTF-16 units, as the existing JSON contract does.
// Keep a split surrogate escaped in JSON instead of replacing source content.
type sourceText []uint16

func (units sourceText) MarshalJSON() ([]byte, error) {
	var out strings.Builder
	out.WriteByte('"')
	for index := 0; index < len(units); index++ {
		unit := units[index]
		switch unit {
		case '"', '\\':
			out.WriteByte('\\')
			out.WriteByte(byte(unit))
		case '\n':
			out.WriteString(`\n`)
		case '\r':
			out.WriteString(`\r`)
		case '\t':
			out.WriteString(`\t`)
		default:
			if unit < 32 {
				fmt.Fprintf(&out, `\u%04x`, unit)
			} else if utf16.IsSurrogate(rune(unit)) {
				if unit < 0xdc00 && index+1 < len(units) && units[index+1] >= 0xdc00 && units[index+1] <= 0xdfff {
					out.WriteRune(utf16.DecodeRune(rune(unit), rune(units[index+1])))
					index++
				} else {
					fmt.Fprintf(&out, `\u%04x`, unit)
				}
			} else {
				out.WriteRune(rune(unit))
			}
		}
	}
	out.WriteByte('"')
	return []byte(out.String()), nil
}

func TextUnits(text string) sourceText { return utf16.Encode([]rune(text)) }
func NumberOption(values map[string]any, key string, fallback float64) float64 {
	if value, ok := values[key].(float64); ok {
		return value
	}
	return fallback
}
func Page(content string, values map[string]any) map[string]any {
	units := TextUnits(content)
	offset, limit := NumberOption(values, "offset", 0), NumberOption(values, "limit", 24000)
	start, end := int(min(offset, float64(len(units)))), int(min(offset+limit, float64(len(units))))
	var next any
	if offset+limit < float64(len(units)) {
		next = offset + limit
	}
	line := 1
	for _, unit := range units[:start] {
		if unit == '\n' {
			line++
		}
	}
	endLine := line
	for _, unit := range units[start:end] {
		if unit == '\n' {
			endLine++
		}
	}
	return map[string]any{"content": sourceText(units[start:end]), "offset": offset, "nextOffset": next, "totalLength": len(units), "line": line, "endLine": endLine, "contentHash": Hash(content)}
}
