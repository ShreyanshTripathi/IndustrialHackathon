#!/bin/bash
# One-time setup of a fresh Ubuntu VM on Oracle Cloud (run with sudo). Safe to run again.
# Same base as Synergy Match's setup, plus the timer that deletes the hackathon-licensed data afterwards.
set -euo pipefail

# Oracle's Ubuntu images block everything but SSH in iptables, on top of the cloud security list.
for port in 80 443; do
  iptables -C INPUT -p tcp --dport $port -j ACCEPT 2>/dev/null || iptables -I INPUT 6 -m state --state NEW -p tcp --dport $port -j ACCEPT
done
iptables -C INPUT -p udp --dport 443 -j ACCEPT 2>/dev/null || iptables -I INPUT 6 -p udp --dport 443 -j ACCEPT
DEBIAN_FRONTEND=noninteractive apt-get update -q
DEBIAN_FRONTEND=noninteractive apt-get install -yq docker.io docker-compose-v2 netfilter-persistent iptables-persistent unattended-upgrades rsync
netfilter-persistent save
systemctl enable --now docker

# Swap as a safety margin while the image builds (PyTorch, numba).
if [ ! -f /swapfile ]; then
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Security updates install themselves; SSH only with keys.
dpkg-reconfigure -f noninteractive unattended-upgrades
sed -i 's/^#\?PasswordAuthentication .*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload ssh || systemctl reload sshd || true

mkdir -p /opt/flame && chown "${SUDO_USER:-ubuntu}" /opt/flame

# Delete the regulation data after the hackathon (LICENSE-DATA.md). Runs at next boot if the VM was off then.
cat > /etc/systemd/system/flame-purge.service <<'UNIT'
[Unit]
Description=Delete Flame's hackathon-licensed regulation data

[Service]
Type=oneshot
Environment=FLAME_DIR=/opt/flame
ExecStart=/opt/flame/scripts/purge.sh --now
UNIT
cat > /etc/systemd/system/flame-purge.timer <<'UNIT'
[Unit]
Description=Delete Flame's regulation data after the hackathon

[Timer]
OnCalendar=2026-10-26 23:59:00
Persistent=true

[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now flame-purge.timer
echo "Server ready. Purge scheduled: $(systemctl list-timers flame-purge.timer --no-legend | awk '{print $1, $2, $3}')"
