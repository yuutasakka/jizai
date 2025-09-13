#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
BASE="$("${ROOT}/scripts/git-merge-base.sh")"
# パターン（拡張子など）を引数で渡せる
git diff --name-only "${BASE}"..HEAD -- "${@:-.}"