#!/bin/bash
# Writes deploy/oracle/flame.env for <domain> with a fresh site password, taking the API keys from the repo's .env.
# Usage: deploy/oracle/make-env.sh <domain>
set -euo pipefail
DOMAIN="${1:?Usage: deploy/oracle/make-env.sh <domain>}"
HERE="$(cd "$(dirname "$0")" && pwd)"
OUT="$HERE/flame.env"
[ ! -e "$OUT" ] || { echo "$OUT already exists: edit it instead."; exit 1; }
LOCAL="$HERE/../../.env"
val() { grep -E "^$1\s*=" "$LOCAL" 2>/dev/null | head -1 | cut -d= -f2- | sed -E 's/^\s*"?//; s/"?\s*$//'; }
PASSWORD="$(python3 -c "import secrets;print(secrets.token_urlsafe(12))")"
umask 077
cat > "$OUT" <<ENV
DOMAIN=$DOMAIN
FLAME_PASSWORD=$PASSWORD
CLAUDE_KEY=$(val CLAUDE_KEY)
ELEVENLABS_KEY=$(val ELEVENLABS_KEY)
ELEVENLABS_VOICE_ID=$(val ELEVENLABS_VOICE_ID)
ENV
echo "Wrote $OUT. Site login: user 'flame', password: $PASSWORD"
grep -q "^CLAUDE_KEY=.\+" "$OUT" || echo "Note: CLAUDE_KEY is empty; add it to $OUT for new analyses and the assistant."
