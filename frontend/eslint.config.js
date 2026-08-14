import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/*
 * The page rhythm has a name (--spacing-page, see styles.css), so writing
 * it as a number is a choice made by counting rather than by intent — and
 * a number nobody can grep is how spacing drifts. gap-10 / mt-10 / p-10
 * are the 40px utilities; use *-page.
 *
 * Matches the variant prefix (md:), the negative form (-mt-10) and the
 * important suffix (mt-10!), since all four spell the same 40.
 *
 * Deliberately narrow. The component-internal tier (gap-2/3/5) is still
 * numeric because it is a scale rather than one number, and --spacing
 * also feeds w-*, h-* and inset-*, where sizing an icon has nothing to do
 * with page rhythm. Widen this when that tier gets names too.
 */
const PAGE_RHYTHM_UTILITY = /(^|\s|:)-?(gap|gap-x|gap-y|m|mt|mb|ml|mr|mx|my|p|pt|pb|pl|pr|px|py)-10!?(\s|$)/

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: `Literal[value=/${PAGE_RHYTHM_UTILITY.source}/]`,
          message: 'Use the named page rhythm (gap-page, mt-page, p-page…) instead of the 40px number.',
        },
        {
          selector: `TemplateElement[value.raw=/${PAGE_RHYTHM_UTILITY.source}/]`,
          message: 'Use the named page rhythm (gap-page, mt-page, p-page…) instead of the 40px number.',
        },
      ],
    },
  },
])
