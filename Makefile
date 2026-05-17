.PHONY: up down restart rebuild logs clean reset

GREEN  := \033[0;32m
YELLOW := \033[0;33m
CYAN   := \033[0;36m
RESET  := \033[0m

up:
	@echo "$(GREEN)▶ Starting Xstudio...$(RESET)"
	docker compose up -d
	@echo "$(CYAN)→ Frontend: http://localhost:3000$(RESET)"
	@echo "$(CYAN)→ Backend:  http://localhost:8000$(RESET)"

down:
	@echo "$(YELLOW)■ Stopping Xstudio...$(RESET)"
	docker compose down

restart:
	@echo "$(YELLOW)↻ Restarting...$(RESET)"
	docker compose restart

rebuild:
	@echo "$(CYAN)⟳ Rebuilding containers...$(RESET)"
	docker compose down
	docker compose build --no-cache
	docker compose up -d

logs:
	docker compose logs -f

clean:
	@echo "$(YELLOW)✗ Removing containers...$(RESET)"
	docker compose down --remove-orphans

reset:
	@echo "$(YELLOW)⚠ Full reset — removing volumes + rebuild...$(RESET)"
	docker compose down -v --remove-orphans
	docker compose build --no-cache
	docker compose up -d
