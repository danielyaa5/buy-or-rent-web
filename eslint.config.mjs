import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    '.next/**',
    '.next-e2e/**',
    'playwright-report/**',
    'test-results/**',
    'node_modules/**',
    'packages/**',
    'coverage/**',
    'next-env.d.ts',
  ]),
])
