#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${DOMAIN:-xstudio.solaymanbuilds.com}"
EMAIL="${EMAIL:-elmouden00den@gmail.com}"
FRONTEND_PORT="${FRONTEND_PORT:-3001}"
BACKEND_PORT="${BACKEND_PORT:-8001}"

SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  SUDO="sudo"
fi

echo "========================================================"
echo "  XSTUDIO VPS PROVISIONING"
echo "  Domain : ${DOMAIN}"
echo "  Email  : ${EMAIL}"
echo "  Ports  : Frontend ${FRONTEND_PORT} | Backend ${BACKEND_PORT}"
echo "========================================================"

echo "[1/6] Installing system packages (Nginx, Certbot, UFW, Curl, Git)..."
${SUDO} apt-get update -y
${SUDO} apt-get install -y curl git ca-certificates gnupg nginx certbot python3-certbot-nginx ufw

if ! command -v docker >/dev/null 2>&1; then
  echo "[2/6] Installing Docker Engine & Compose plugin..."
  curl -fsSL https://get.docker.com | ${SUDO} sh
  ${SUDO} systemctl enable --now docker
  if [ -n "${SUDO}" ] && [ -n "${USER:-}" ]; then
    ${SUDO} usermod -aG docker "${USER}" || true
  fi
else
  echo "[2/6] Docker already installed: $(docker --version)"
fi

echo "[3/6] Configuring UFW firewall rules (SSH, HTTP, HTTPS)..."
${SUDO} ufw allow OpenSSH >/dev/null 2>&1 || true
${SUDO} ufw allow 'Nginx Full' >/dev/null 2>&1 || true

echo "[4/6] Writing Nginx reverse proxy config for ${DOMAIN}..."
NGINX_CONF="/etc/nginx/sites-available/${DOMAIN}"
sed \
  -e "s/__DOMAIN__/${DOMAIN}/g" \
  -e "s/__FRONTEND_PORT__/${FRONTEND_PORT}/g" \
  -e "s/__BACKEND_PORT__/${BACKEND_PORT}/g" \
  deploy/nginx/xstudio.conf | ${SUDO} tee "${NGINX_CONF}" >/dev/null

${SUDO} ln -sf "${NGINX_CONF}" "/etc/nginx/sites-enabled/${DOMAIN}"
${SUDO} nginx -t
${SUDO} systemctl enable --now nginx
${SUDO} systemctl reload nginx

echo "[5/6] Building and starting Xstudio production containers..."
if docker compose version >/dev/null 2>&1; then
  docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
else
  ${SUDO} docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
fi

echo "[6/6] Requesting Let's Encrypt TLS certificate via Certbot..."
${SUDO} certbot --nginx \
  -d "${DOMAIN}" \
  --non-interactive \
  --agree-tos \
  --email "${EMAIL}" \
  --redirect \
  --keep-until-expiring

${SUDO} systemctl enable --now certbot.timer || true
${SUDO} systemctl reload nginx

echo ""
echo "========================================================"
echo "  XSTUDIO IS LIVE AT: https://${DOMAIN}"
echo "  SSL Auto-Renewal  : Enabled (${EMAIL})"
echo "========================================================"
