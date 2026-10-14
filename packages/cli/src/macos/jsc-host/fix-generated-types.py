#!/usr/bin/env python3
"""Repair mechanical emitter quirks in objc-metadata-generator .d.ts output.

The generator's TSEmitter leaks a few constructs TypeScript cannot parse:
anonymous bitfield members (``  : number;``), C reserved words as identifiers
(``declare function delete``, ``in:`` params), ``volatile struct``/``const
struct`` qualifiers in member types, and ``Enum<typeof X::(unnamed at ...)>``
references to unnamed enums. Each fix is local and name-preserving, matching
the perl fixups upstream typings-gen.sh applies to the iOS output. Run after
every generation; the result must parse cleanly under tsc.
"""

import re
import sys
from pathlib import Path

# Anonymous bitfield/padding members have no name to call.
ANONYMOUS_MEMBER = re.compile(r"^\s*:\s*\w+;\s*$")
# `delete` cannot be spelled as a TS function name; the decl is dead surface.
DELETE_FUNCTION = re.compile(r"^declare function delete\(")
# `in` is reserved; as a parameter name it is positional, so rename is safe.
IN_PARAM = re.compile(r"\bin: ")
# C qualifiers that leak into member/field type positions.
VOLATILE_STRUCT = re.compile(r"\b(?:volatile|const)\s+struct\s+")
# Unnamed enums surface as C++ scoped paths that are not valid TS.
UNNAMED_ENUM = re.compile(r"interop\.Enum<typeof\s+[\w:]+::\(unnamed at [^>]*\)>")


def fix(text):
    lines = []
    for line in text.splitlines(keepends=True):
        if ANONYMOUS_MEMBER.match(line) or DELETE_FUNCTION.match(line):
            continue
        line = IN_PARAM.sub("in_: ", line)
        line = VOLATILE_STRUCT.sub("", line)
        line = UNNAMED_ENUM.sub("number", line)
        lines.append(line)
    return "".join(lines)


def main():
    count = 0
    for arg in sys.argv[1:]:
        path = Path(arg)
        original = path.read_text()
        fixed = fix(original)
        if fixed != original:
            path.write_text(fixed)
            count += 1
    print(f"fixed {count} files")


if __name__ == "__main__":
    main()
