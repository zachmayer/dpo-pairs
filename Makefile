.PHONY: help 
help:
	@echo "Usage:"
	@echo "  make help                   Show this help message"
	@echo "  make all                    install, lint, build, check links, and preview"
	@echo "  make install                Install all npm dependencies"
	@echo "  make lint                   Run all linters, fail on any warning"
	@echo "  make fix-lint               Run all linters with auto-fix options"
	@echo "  make build                  Build the site"
	@echo "  make dev                    Preview the site"
	@echo "  make copy-duckdb            Copy DuckDB files to the public directory"
	@echo "  make clean                  Delete node packages and lock"
	@echo "  make info                   Show package directory tree (excluding node_modules)"

.PHONY: all
all: install fix-lint lint build dev

.PHONY: install
install:
	npm install --no-audit --loglevel=error

.PHONY: fix-lint
fix-lint:
	npm run fix-lint

.PHONY: lint
lint:
	npm run lint

.PHONY: build
build:
	npm run build

.PHONY: dev
dev:
	npm run dev

.PHONY: copy-duckdb
copy-duckdb:
	npm run copy-duckdb

.PHONY: clean
clean:
	find . -name ".DS_Store" -delete
	rm -rf .next/
	rm -rf out/
	rm -rf dist/
	rm -rf node_modules/
	rm -rf package-lock.json
	npm cache clean --force

.PHONY: info
info:
	tree  -I 'node_modules' -I 'dist' -I 'out' --prune
