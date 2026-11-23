#!/usr/bin/env bash
set -euo pipefail

tag="$1"
source_directory="$2"
archive=xplat-devtools-macos-universal.zip
if ! gh release view "$tag" >/dev/null 2>&1; then
  gh release create "$tag" --verify-tag --draft --title "$tag" --notes "" >&2
fi

# On a retry the previously uploaded archive is already the source of truth.
# Rebuilding it can change the checksum even at the same source revision.
state="$(gh release view "$tag" --json assets --jq ".assets[] | select(.name == \"$archive\") | .state")"
case "$state" in
  uploaded) ;;
  starter)
    gh release delete-asset "$tag" "$archive" --yes >&2
    ;;
  "") ;;
  *) printf 'Unexpected DevTools release asset state: %s\n' "$state" >&2; exit 1 ;;
esac
if [[ "$state" != uploaded ]]; then
  gh release upload "$tag" "$source_directory/$archive" >&2
fi

directory="$(mktemp -d)"
trap 'rm -rf "$directory"' EXIT
gh release download "$tag" --pattern "$archive" --dir "$directory" >&2
shasum -a 256 "$directory/$archive" | cut -d ' ' -f 1
