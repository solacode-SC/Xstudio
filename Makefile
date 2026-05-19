.PHONY: dev dev-down prod prod-down logs

GREEN := \033[0;32m
CYAN := \033[0;36m
YELLOW := \033[0;33m
RESET := \033[0m

dev:
	@echo "$(CYAN)▶ XSTUDIO DEV MODE (ports 3001/8001)$(RESET)"
	docker compose -f docker-compose.dev.yml up --build

dev-down:
	docker compose -f docker-compose.dev.yml down

prod:
	@echo "$(GREEN)▶ XSTUDIO PROD MODE (ports 3001/8001)$(RESET)"
	docker compose -f docker-compose.prod.yml up -d --build

prod-down:
	docker compose -f docker-compose.prod.yml down

logs:
	docker compose logs -f
