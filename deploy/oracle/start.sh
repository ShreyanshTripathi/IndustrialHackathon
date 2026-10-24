#!/bin/sh
# Container start: make the writable data folders the app user's, then run the server without root.
set -e
mkdir -p /app/out/runs /app/data/llm_cache
chown -R flame /app/out /app/data/llm_cache
exec setpriv --reuid=flame --regid=flame --init-groups --inh-caps=-all \
  uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers
