// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Deno Edge Functions are linted by the Supabase/Deno toolchain, not Expo's config.
    ignores: ['dist/*', 'supabase/functions/*', 'src/types/database.ts'],
  },
]);
