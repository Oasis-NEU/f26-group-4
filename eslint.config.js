// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

// The data layer's import rules (docs/data-layer.md, "The rules"):
//   - Only src/services/ (and the session hook) talk to Supabase.
//   - Screens and components get their data from the hooks in src/hooks/, not
//     from services. Importing a service's *types* is fine.
// When two blocks below match the same file, the later one replaces the
// earlier one's options, so the screens block repeats the Supabase rule.
const onlyServicesUseSupabase = {
  group: ['@/lib/supabase', '**/lib/supabase'],
  message: 'Only files in src/services/ talk to Supabase. Call a service from a hook in src/hooks/ instead (docs/data-layer.md).',
};

const screensUseHooks = {
  group: ['@/services/*', '**/services/*'],
  allowTypeImports: true,
  message: 'Screens and components get data from the hooks in src/hooks/, not from services (docs/data-layer.md). `import type` from a service is fine.',
};

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/services/**', 'src/hooks/use-session.tsx'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: [onlyServicesUseSupabase] }],
    },
  },
  {
    files: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { patterns: [onlyServicesUseSupabase, screensUseHooks] }],
    },
  },
]);
