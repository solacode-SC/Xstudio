.DEFAULT_GOAL := help
.PHONY: help dev dev-down prod prod-down vps-setup setup-vps nginx ssl pull restart update deploy status logs prod-logs clean

# ─────────────────────────────────────────────────────────────
# Xstudio Deployment Configuration
# ─────────────────────────────────────────────────────────────
DOMAIN        ?= xstudio.solaymanbuilds.com
EMAIL         ?= elmouden00den@gmail.com
BRANCH        ?= main
FRONTEND_PORT ?= 3001
BACKEND_PORT  ?= 8001

SUDO := $(shell [ "$$(id -u)" -eq 0 ] && echo "" || echo "sudo")

BOLD   := \033[1m
GREEN  := \033[0;32m
CYAN   := \033[0;36m
ORANGE := \033[38;5;202m
DIM    := \033[2m
RESET  := \033[0m

help:
	@echo ""
	@echo "$(BOLD)XSTUDIO // COMMAND INTERFACE$(RESET)"
	@echo "$(DIM)Domain: $(DOMAIN) | SSL Email: $(EMAIL)$(RESET)"
	@echo "──────────────────────────────────────────────────────────────"
	@echo "  $(CYAN)make dev$(RESET)          Start local hot-reload dev stack (3001 / 8001)"
	@echo "  $(CYAN)make dev-down$(RESET)     Stop local dev stack"
	@echo "  $(GREEN)make prod$(RESET)         Build & run detached production containers"
	@echo "  $(GREEN)make prod-down$(RESET)    Stop production containers"
	@echo "  $(ORANGE)make vps-setup$(RESET)    Full VPS setup (Docker + Nginx + SSL for $(DOMAIN))"
	@echo "  $(ORANGE)make update$(RESET)       Git pull latest code, rebuild & restart app"
	@echo "  $(ORANGE)make pull$(RESET)         Pull latest changes from origin/$(BRANCH)"
	@echo "  $(ORANGE)make restart$(RESET)      Restart running production containers & Nginx"
	@echo "  $(ORANGE)make nginx$(RESET)        Install/update Nginx config for $(DOMAIN)"
	@echo "  $(ORANGE)make ssl$(RESET)          Issue/renew Let's Encrypt SSL ($(EMAIL))"
	@echo "  $(CYAN)make status$(RESET)       Show container health & listening status"
	@echo "  $(CYAN)make logs$(RESET)         Tail live production/dev container logs"
	@echo "  $(CYAN)make clean$(RESET)        Prune dangling Docker images & build cache"
	@echo "──────────────────────────────────────────────────────────────"
	@echo ""

# ─────────────────────────────────────────────────────────────
# Local Development
# ─────────────────────────────────────────────────────────────
dev:
	@echo "$(CYAN)▶ XSTUDIO DEV WORKBENCH (http://localhost:$(FRONTEND_PORT))$(RESET)"
	docker compose -f docker-compose.dev.yml up --build

dev-down:
	docker compose -f docker-compose.dev.yml down

# ─────────────────────────────────────────────────────────────
# Production Stack
# ─────────────────────────────────────────────────────────────
prod:
	@echo "$(GREEN)▶ XSTUDIO PRODUCTION STACK (ports $(FRONTEND_PORT)/$(BACKEND_PORT))$(RESET)"
	docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

prod-down:
	docker compose -f docker-compose.prod.yml down

# ─────────────────────────────────────────────────────────────
# VPS Provisioning, SSL & Zero-Friction Updates
# ─────────────────────────────────────────────────────────────
vps-setup:
	@echo "$(ORANGE)▶ PROVISIONING VPS FOR $(DOMAIN) ($(EMAIL))$(RESET)"
	chmod +x deploy/vps-setup.sh
	DOMAIN="$(DOMAIN)" EMAIL="$(EMAIL)" FRONTEND_PORT="$(FRONTEND_PORT)" BACKEND_PORT="$(BACKEND_PORT)" bash deploy/vps-setup.sh

setup-vps: vps-setup

nginx:
	@echo "$(CYAN)▶ Configuring Nginx reverse proxy for $(DOMAIN)...$(RESET)"
	sed -e "s/__DOMAIN__/$(DOMAIN)/g" \
	    -e "s/__FRONTEND_PORT__/$(FRONTEND_PORT)/g" \
	    -e "s/__BACKEND_PORT__/$(BACKEND_PORT)/g" \
	    deploy/nginx/xstudio.conf | $(SUDO) tee /etc/nginx/sites-available/$(DOMAIN) >/dev/null
	$(SUDO) ln -sf /etc/nginx/sites-available/$(DOMAIN) /etc/nginx/sites-enabled/$(DOMAIN)
	$(SUDO) nginx -t && $(SUDO) systemctl reload nginx
	@echo "$(GREEN)✔ Nginx active for $(DOMAIN)$(RESET)"

ssl:
	@echo "$(ORANGE)▶ Issuing/Renewing Let's Encrypt SSL for $(DOMAIN) ($(EMAIL))...$(RESET)"
	$(SUDO) certbot --nginx -d $(DOMAIN) --non-interactive --agree-tos --email $(EMAIL) --redirect --keep-until-expiring
	$(SUDO) systemctl reload nginx
	@echo "$(GREEN)✔ HTTPS active at https://$(DOMAIN)$(RESET)"

pull:
	@echo "$(CYAN)▶ Pulling latest commits from origin/$(BRANCH)...$(RESET)"
	git pull origin $(BRANCH)

restart:
	@echo "$(ORANGE)▶ Restarting Xstudio production services...$(RESET)"
	docker compose -f docker-compose.prod.yml restart
	@if command -v nginx >/dev/null 2>&1 && [ -f "/etc/nginx/sites-enabled/$(DOMAIN)" ]; then \
		$(SUDO) nginx -t && $(SUDO) systemctl reload nginx; \
	fi
	@echo "$(GREEN)✔ Services restarted cleanly$(RESET)"

update:
	@echo "$(ORANGE)▶ XSTUDIO UPDATE: PULL + REBUILD + RESTART$(RESET)"
	git pull origin $(BRANCH)
	docker compose -f docker-compose.prod.yml up -d --build --remove-orphans
	docker compose -f docker-compose.prod.yml restart
	docker image prune -f
	@if command -v nginx >/dev/null 2>&1 && [ -f "/etc/nginx/sites-enabled/$(DOMAIN)" ]; then \
		$(SUDO) nginx -t && $(SUDO) systemctl reload nginx; \
	fi
	@echo "$(GREEN)✔ Xstudio updated and restarted successfully!$(RESET)"

deploy: update

status:
	@echo "$(CYAN)▶ Xstudio Container Status:$(RESET)"
	@docker compose -f docker-compose.prod.yml ps
	@echo ""
	@echo "$(CYAN)▶ Backend Engine Health:$(RESET)"
	@curl -fsS http://127.0.0.1:$(BACKEND_PORT)/api/health || echo "Backend not reachable on 127.0.0.1:$(BACKEND_PORT)"
	@echo ""

logs:
	docker compose -f docker-compose.prod.yml logs -f --tail=100

prod-logs: logs

clean:
	docker image prune -f
	docker builder prune -f
