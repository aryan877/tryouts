.PHONY: judge test

judge:
	bun install --frozen-lockfile
	bun apps/stack/src/judge.ts

test:
	bun run test
