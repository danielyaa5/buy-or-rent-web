import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    coverage: { provider: 'v8', include: ['src/lib/**/*.ts'], exclude: ['src/lib/**/*.test.ts'], reporter: ['text', 'json-summary', 'html'], thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 } },
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
  },
})
