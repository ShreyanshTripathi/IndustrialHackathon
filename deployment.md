# Deployment

How to put the Flame web app (FastAPI backend in `app/`, React client in `web/`) online on one Oracle Cloud
Always Free VM, with HTTPS and a site password. Details behind each step are in `deploy/README.md` and
`docs/ui/RUN.md`; the scripts are in `deploy/oracle/`.

**What runs where.** Docker Compose on the VM runs two containers: `app` (uvicorn on port 8000) and `caddy`
(HTTPS on 80/443, certificate obtained automatically). Code and the built client go into the image. The
regulation data (`data/`, `regulations/`, `cases/`, `subgoal/`, `out/`) is mounted from the host. That keeps it
out of the image, so a timer can delete it after the hackathon, as `LICENSE-DATA.md` requires.

## 0. Prerequisites (laptop)

- `uv`, Node.js with `npm`, `rsync`, `ssh`
- The SSH key `~/.ssh/oracle_synergy` (another key works via `SSH_KEY=<path>`)
- The hackathon kit at `industrial-ai-hackathon/` (regulation PDFs)
- `.env` in the repo root with `CLAUDE_KEY` (and optionally `ELEVENLABS_KEY`, `ELEVENLABS_VOICE_ID`); see
  `.env.template`. Never commit it.

## 1. Build the data (laptop, once)

```bash
ln -sfn industrial-ai-hackathon/regulations regulations
uv run python -m pipeline.ingest     # PDFs -> data/corpus.jsonl, ~2.5 min
uv run python -m pipeline.graph      # -> data/graph.json, ~5 s
uv run python -m pipeline.index      # -> data/index/ (BM25 + embeddings), ~5 min
```

`deploy.sh` refuses to run without `data/corpus.jsonl`, `data/graph.json`, `data/index/embeddings.npy` and
`regulations/index.json`.

## 2. Check it locally (optional)

```bash
cd web && npm install && npm run build && cd ..
uv run uvicorn app.main:app --port 8000     # http://127.0.0.1:8000
```

## 3. Create the VM (Oracle console)

1. Compute → Instances → **Create instance**.
2. Image **Canonical Ubuntu 24.04**. Shape **Ampere VM.Standard.A1.Flex, 2 OCPUs, 12 GB**. The app peaks at
   about 1.1 GB, more than a 1 GB micro VM has spare. On "Out of capacity", try another availability domain.
3. Networking: a public subnet, **assign a public IPv4 address**.
4. SSH keys: paste the contents of `~/.ssh/oracle_synergy.pub`.
5. Boot volume: the default 47 GB.
6. In the subnet's security list, allow ingress **TCP 80, TCP 443 and UDP 443** from `0.0.0.0/0`.
7. Note the **public IP**.

## 4. Give it a domain name

At duckdns.org, add a subdomain (e.g. `flame-team08`) and point it at the IP. Without DuckDNS, use
`<ip-with-dashes>.sslip.io` (e.g. `129-151-1-2.sslip.io`).

## 5. Prepare the server (once)

```bash
scp -i ~/.ssh/oracle_synergy deploy/oracle/setup-server.sh ubuntu@<IP>:
ssh -i ~/.ssh/oracle_synergy ubuntu@<IP> 'sudo bash setup-server.sh'
```

The script opens ports 80/443 in iptables and installs Docker. It also adds 4 GB of swap, turns on security
updates, allows SSH by key only, and schedules the data purge for 2026-10-26 23:59. It should end with
`Server ready. Purge scheduled: …`.

## 6. Make the secrets file (laptop, once)

```bash
deploy/oracle/make-env.sh <domain>       # e.g. flame-team08.duckdns.org
```

This writes `deploy/oracle/flame.env` (git ignores it) with `DOMAIN`, a fresh `FLAME_PASSWORD`, and the keys from
`.env`. **Save the printed password**: the site login is user `flame` plus that password. To change a value
later, edit `flame.env`; the script won't overwrite an existing one.

## 7. Deploy

```bash
deploy/oracle/deploy.sh <IP>
```

The script builds `web/dist` and copies code, data and `flame.env` to `/opt/flame/` (about 350 MB the first
time). It then builds the image on the VM and starts the containers. The first build takes about 10 minutes
(PyTorch CPU and the search model).

**Done when** it prints `Status: 401` (up, asking for the password). Open `https://<domain>` and log in.

## 8. Update after code changes

Commit or pull the changes, then run `deploy/oracle/deploy.sh <IP>` again. Runs created on the server are kept:
`out/runs/` is merged, not overwritten.

## 9. Add the held-out run (Sunday)

After the pipeline has produced `out/heldout-front-bumper/`:

```bash
uv run python -m app.runs import out/heldout-front-bumper --title "Front bumper"
uv run python -m pipeline.enrich out/runs/heldout-front-bumper
deploy/oracle/deploy.sh <IP>
```

## Operations

All of these run from the laptop. Prefix each with `ssh -i ~/.ssh/oracle_synergy ubuntu@<IP>`.

| Task | Command |
| --- | --- |
| Logs | `'cd /opt/flame/deploy/oracle && sudo docker compose logs -f app'` |
| Restart | `'cd /opt/flame/deploy/oracle && sudo docker compose restart app'` |
| Check the purge timer | `'systemctl list-timers flame-purge.timer'` |
| List what the purge deletes | `'sudo FLAME_DIR=/opt/flame /opt/flame/scripts/purge.sh --dry-run'` |
| Delete the data now | `'sudo FLAME_DIR=/opt/flame /opt/flame/scripts/purge.sh --now'` |

## Teardown (after the hackathon)

The purge timer deletes the regulation data automatically on 2026-10-26 at 23:59; if the VM is off then, it
runs at the next boot. To remove everything, terminate the instance **and its boot volume** in the Oracle
console, and delete the DuckDNS subdomain.

## Troubleshooting

- **`Missing deploy/oracle/flame.env`:** run step 6.
- **`Missing data/...`:** run step 1.
- **`not reachable yet` right after the first deploy:** Caddy may still be getting the certificate. Wait a
  minute and open the site; check that the domain points at the IP and that ports 80/443 are open (steps 3.6 and 5).
- **New analyses or the assistant fail:** `CLAUDE_KEY` is empty in `flame.env`. Fix it there and redeploy.
- **Images other than Ubuntu:** set `SSH_USER=opc` for Oracle Linux.
