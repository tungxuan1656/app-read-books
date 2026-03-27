import expoConfig from 'eslint-config-expo/flat.js'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import reactCompiler from 'eslint-plugin-react-compiler'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import tailwind from 'eslint-plugin-tailwindcss'
import unicorn from 'eslint-plugin-unicorn'
import unusedImports from 'eslint-plugin-unused-imports'
import { defineConfig, globalIgnores } from 'eslint/config'
import { configs, parser } from 'typescript-eslint'

export default defineConfig([
  globalIgnores([
    'dist/*',
    'node_modules',
    '__tests__/',
    'coverage',
    '.expo',
    '.expo-shared',
    'android',
    'ios',
    '.vscode',
    'docs/',
    'cli/',
    'expo-env.d.ts',
  ]),
  expoConfig,
  eslintPluginPrettierRecommended,
  ...tailwind.configs['flat/recommended'],
  reactCompiler.configs.recommended,
  {
    plugins: {
      unicorn,
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      indent: 'off',
      semi: ['error', 'never'],
      'unicorn/filename-case': [
        'error',
        {
          case: 'kebabCase',
          ignore: ['/android', '/ios'],
        },
      ],
      'max-params': ['error', 5],
      'max-lines-per-function': 'off',

      // React rules
      'react/display-name': 'off',
      'react/no-inline-styles': 'off',
      'react/destructuring-assignment': 'off',
      'react/require-default-props': 'off',

      'react-compiler/react-compiler': 'off',

      // TypeScript rules
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',

      // React Hooks
      'react-hooks/exhaustive-deps': 'off',

      // Import rules
      'import/prefer-default-export': 'off',
      'import/no-cycle': ['error', { maxDepth: 1 }],

      // Simple import sort
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Unused imports
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // Tailwind CSS
      'tailwindcss/classnames-order': [
        'warn',
        {
          officialSorting: true,
        },
      ],
      'tailwindcss/no-custom-classname': 'off',

      // Prettier
      'prettier/prettier': 'warn',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'no-empty': 'off',
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: parser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
      },
    },
    rules: {
      ...configs.recommended.rules,
      '@typescript-eslint/comma-dangle': 'off',
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
          disallowTypeAnnotations: true,
        },
      ],
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    files: ['app/**/*.ts', 'app/**/*.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='fetch']",
          message:
            'Do not call fetch directly in app routes. Move network I/O to services.',
        },
      ],
    },
  },
])
