#!/usr/bin/env bash
set -euo pipefail
ROOT=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
DEFAULT_BRANCH="$("${ROOT}/scripts/git-default-branch.sh")"
git fetch origin "${DEFAULT_BRANCH}" --depth=2 >/dev/null 2>&1 || true
git merge-base HEAD "origin/${DEFAULT_BRANCH}"