# Deploying Flame on Oracle Cloud (free tier)

Same pattern as Synergy Match (`~/Workdir/synergydating/synergy-match/deploy/oracle`): Docker Compose with the app
behind Caddy (automatic HTTPS), a DuckDNS name, the `oracle_synergy` SSH key, `setup-server.sh` once, then
`deploy.sh` for every update. Differences: Flame needs its own **Ampere (ARM) VM** — it peaks at ~1.1 GB of memory,
more than Synergy's 1 GB micro VM has spare — the whole site sits behind a password, and a timer deletes the
hackathon-licensed regulation data on 2026-10-26 23:59.

## 1. Create the VM (Oracle console)
1. Compute → Instances → **Create instance**.
2. Image: **Canonical Ubuntu 24.04**. Shape: **Ampere → VM.Standard.A1.Flex**, **2 OCPUs, 12 GB** (Always Free allows
   4 OCPUs / 24 GB in total across A1 VMs). "Out of capacity": try another availability domain, or retry later.
3. Networking: the same VCN/public subnet as Synergy is fine; **assign a public IPv4 address**.
4. SSH keys: **Paste public key** → contents of `~/.ssh/oracle_synergy.pub`.
5. Boot volume: default (47 GB) is enough.
6. After it starts, note the **public IP**. In the subnet's **security list**, make sure ingress allows TCP 80, TCP 443
   and UDP 443 from 0.0.0.0/0 (already there if you reused Synergy's subnet).

## 2. A name for it
At duckdns.org (where `synergymatch` lives) add a subdomain, e.g. `flame-team08`, and point it at the new IP.
No DuckDNS: use `<ip with dashes>.sslip.io` (e.g. `129-151-1-2.sslip.io`).

## 3. Prepare the server (once)
```bash
scp -i ~/.ssh/oracle_synergy deploy/oracle/setup-server.sh ubuntu@<IP>:
ssh -i ~/.ssh/oracle_synergy ubuntu@<IP> 'sudo bash setup-server.sh'
```
Ends with `Server ready. Purge scheduled: Mon 2026-10-26 23:59:00 …`.

## 4. Secrets file (on the laptop)
```bash
deploy/oracle/make-env.sh flame-team08.duckdns.org
```
Takes `CLAUDE_KEY` and `ELEVENLABS_KEY` from the repo's `.env`, makes a site password and prints it. Check
`deploy/oracle/flame.env` (git ignores it).

## 5. Deploy (and every update)
```bash
deploy/oracle/deploy.sh <IP>
```
Builds the web client, copies code + data (~350 MB the first time) and `flame.env`, builds the image on the VM
(first build ~10 min: PyTorch CPU and the search model) and starts it. Ends with `Status: 401` = up, asking for
the password. Open `https://<domain>`, user `flame`, the printed password.

The data must exist on the laptop first: `data/` (corpus, graph, index), `regulations/`, `out/runs/` (see
docs/ui/RUN.md). Runs created on the server are kept across redeploys.

## Sunday: add the held-out run
On the laptop: `uv run python -m app.runs import out/heldout-front-bumper --title "Front bumper"` and
`uv run python -m pipeline.enrich out/runs/heldout-front-bumper`, then `deploy/oracle/deploy.sh <IP>` again.

## Useful
- Logs: `ssh -i ~/.ssh/oracle_synergy ubuntu@<IP> 'cd /opt/flame/deploy/oracle && sudo docker compose logs -f app'`
- Restart: `… 'cd /opt/flame/deploy/oracle && sudo docker compose restart app'`
- Purge timer: `… 'systemctl list-timers flame-purge.timer'`
- Delete the data now: `… 'sudo FLAME_DIR=/opt/flame /opt/flame/scripts/purge.sh --now'` (`--dry-run` lists first)
- VM unreachable after the hackathon: terminate the instance and its boot volume in the Oracle console.
