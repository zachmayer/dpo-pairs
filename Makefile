.PHONY: help
help:
	@echo "Usage:"
	@echo "  make help    Show this help message"
	@echo "  make test    Test the CSV and pairing logic in dpo.js"
	@echo "  make open    Open the page in the browser"

.PHONY: test
test:
	node --test dpo.test.js

.PHONY: open
open:
	open index.html
