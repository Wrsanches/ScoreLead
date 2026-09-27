#!/usr/bin/env bash
# Deploy a reproducible committed worker artifact without the web app's start command.
set -euo pipefail
case "${1:-}" in testing|production) environment="$1" ;; *) echo 'Usage: bash scripts/deploy-agents-worker.sh testing|production' >&2; exit 2 ;; esac
root="$(git rev-parse --show-toplevel)"
artifact="$(mktemp -d /tmp/scorelead-agents-deploy.XXXXXX)"
trap 'rm -rf "$artifact"' EXIT
# Only committed files: no .env.local, build output, credentials or local fixtures.
git -C "$root" archive HEAD | tar -x -C "$artifact"
cp "$artifact/railway.agents.json" "$artifact/railway.json"
railway up "$artifact" --path-as-root --project e9fd536c-e146-462d-8065-eb5089cf4e26 \
  --service agents-worker --environment "$environment" --detach \
  --message "Agents worker $(git -C "$root" rev-parse --short HEAD), execution controlled by environment"
