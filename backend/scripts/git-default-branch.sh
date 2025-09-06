#!/usr/bin/env bash
set -euo pipefail

# リモートのデフォルトブランチ名を取得（main/master 等）
DEFAULT_BRANCH=$(git remote show origin 2>/dev/null | sed -n '/HEAD branch/s/.*: //p' || true)

# 未解決なら fetch → 自動設定
if [ -z "${DEFAULT_BRANCH:-}" ]; then
  git fetch origin --prune >/dev/null 2>&1 || true
  git remote set-head origin -a >/dev/null 2>&1 || true
  DEFAULT_BRANCH=$(git remote show origin 2>/dev/null | sed -n '/HEAD branch/s/.*: //p' || true)
fi

# それでも無ければ main→master の順でフォールバック
if [ -z "${DEFAULT_BRANCH:-}" ]; then
  if git ls-remote --exit-code --heads origin main >/dev/null 2>&1; then
    DEFAULT_BRANCH=main
  elif git ls-remote --exit-code --heads origin master >/dev/null 2>&1; then
    DEFAULT_BRANCH=master
  else
    echo "ERROR: could not resolve remote default branch (origin)" >&2
    exit 1
  fi
fi

echo "${DEFAULT_BRANCH}"