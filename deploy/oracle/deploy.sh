#!/bin/bash
# Deploys this checkout to the Oracle VM: builds the web client, copies code + data + flame.env, rebuilds, restarts.
# Usage: deploy/oracle/deploy.sh <server ip>
set -euo pipefail
HOST="${1:?Usage: deploy/oracle/deploy.sh <server ip>}"
KEY="${SSH_KEY:-$HOME/.ssh/oracle_synergy}"
USER_="${SSH_USER:-ubuntu}"   # "opc" on Oracle Linux images
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SSH="ssh -i $KEY -o StrictHostKeyChecking=accept-new"

[ -f "$ROOT/deploy/oracle/flame.env" ] || { echo "Missing deploy/oracle/flame.env (run deploy/oracle/make-env.sh <domain>)"; exit 1; }
for need in data/corpus.jsonl data/graph.json data/index/embeddings.npy regulations/index.json; do
  [ -e "$ROOT/$need" ] || { echo "Missing $need: build the data first (docs/ui/RUN.md)"; exit 1; }
done

(cd "$ROOT/web" && npm run build >/dev/null) && echo "Built the web client."

# Code, built client, data and the case/sub-goal examples; -L copies the regulations/ symlink's PDFs.
cd "$ROOT"
rsync -azL --delete --relative -e "$SSH" \
  --exclude '__pycache__' --exclude 'data/llm_cache' \
  ./pyproject.toml ./uv.lock ./Dockerfile ./.dockerignore ./app ./pipeline ./web/dist ./scripts ./deploy \
  ./data ./regulations ./cases ./subgoal \
  "$USER_@$HOST:/opt/flame/"
# runs are merged, not mirrored, so analyses made on the server survive a redeploy
rsync -az -e "$SSH" ./out/runs/ "$USER_@$HOST:/opt/flame/out/runs/"
# scp + chmod rather than rsync --chmod, which macOS's built-in rsync doesn't support
scp -q -i "$KEY" "$ROOT/deploy/oracle/flame.env" "$USER_@$HOST:/opt/flame/deploy/oracle/flame.env"
$SSH "$USER_@$HOST" "chmod 600 /opt/flame/deploy/oracle/flame.env"
$SSH "$USER_@$HOST" "cd /opt/flame/deploy/oracle && sudo docker compose up -d --build --remove-orphans && sudo docker image prune -f >/dev/null"
DOMAIN="$(grep ^DOMAIN= "$ROOT/deploy/oracle/flame.env" | cut -d= -f2)"
echo "Deployed. Status: $(curl -s --max-time 30 -o /dev/null -w '%{http_code}' "https://$DOMAIN/" || echo 'not reachable yet') (401 = up, asking for the password)"
