#!/usr/bin/env bash
set -euo pipefail
echo "🔍 Duplicate file report (content-based) — start"
find . -type f ! -path "./.git/*" ! -path "./.netlify/*" -print0 \
| xargs -0 md5sum 2>/dev/null | sort | uniq -w32 -dD || true
echo "🔍 Duplicate file report — end"
