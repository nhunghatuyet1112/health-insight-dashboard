import { defineConfig } from "vitest/config";
export default defineConfig({ test: { include: ["tests/assistant/**/*.test.ts"], environment: "node" } });
