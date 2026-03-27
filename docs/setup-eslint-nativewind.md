# Guide chuẩn: Setup ESLint + TailwindCSS (NativeWind) cho React Native (Expo)

Mục tiêu: dùng tài liệu này để mang sang **project khác** và setup từ đầu, đảm bảo đúng cấu hình.

Phạm vi:

- React Native + Expo
- TypeScript
- ESLint Flat Config
- TailwindCSS + NativeWind v4

---

## 1. Yêu cầu môi trường

- Node.js `>= 20`
- pnpm `>= 10` (khuyến nghị dùng đúng major)
- Expo project đã tạo sẵn

Kiểm tra:

```bash
node -v
pnpm -v
```

---

## 2. Cài packages

### 2.1 Runtime packages

```bash
pnpm add nativewind tailwindcss@3.4.4 tailwind-merge tailwind-variants
```

### 2.2 Dev packages (ESLint + TypeScript + format)

```bash
pnpm add -D \
  eslint \
  @eslint/js \
  typescript-eslint \
  eslint-config-expo \
  eslint-config-prettier \
  eslint-plugin-prettier \
  eslint-plugin-tailwindcss \
  eslint-plugin-react \
  eslint-plugin-react-hooks \
  eslint-plugin-react-compiler \
  eslint-plugin-import \
  eslint-plugin-unicorn \
  eslint-plugin-unused-imports \
  eslint-plugin-simple-import-sort \
  eslint-import-resolver-typescript \
  @eslint/eslintrc \
  prettier \
  typescript
```

### 2.3 Bắt buộc cho NativeWind trong Expo

```bash
pnpm add -D babel-preset-expo
```

---

## 3. Cấu hình file (copy-paste)

## 3.1 `global.css`

Tạo file ở root project:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 3.2 `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Lưu ý:

- Nếu project không có `app/`, sửa `content` theo cấu trúc của bạn.
- `content` sai => className không generate.

## 3.3 `nativewind-env.d.ts`

Tạo file ở root:

```ts
/// <reference types="nativewind/types" />
```

## 3.4 `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins: ['react-native-reanimated/plugin'],
  }
}
```

## 3.5 `metro.config.js`

```js
const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')

const config = getDefaultConfig(__dirname)

module.exports = withNativeWind(config, {
  input: './global.css',
})
```

## 3.6 Import `global.css` ở entry

Trong file entry app (ví dụ `app/index.tsx`, `src/main.tsx`, hoặc file root component):

```ts
import '../global.css'
```

Import này là bắt buộc.

## 3.7 `eslint.config.mjs`

```js
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
    'coverage',
    '.expo',
    '.expo-shared',
    'android',
    'ios',
    '.vscode',
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
      semi: ['error', 'never'],
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'tailwindcss/classnames-order': [
        'warn',
        {
          officialSorting: true,
        },
      ],
      'tailwindcss/no-custom-classname': 'off',
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
      'import/no-named-as-default-member': 'off',
    },
  },
])
```

## 3.8 `tsconfig.json`

Đảm bảo file có TypeScript config hợp lệ. Tối thiểu:

```json
{
  "extends": "@react-native/typescript-config",
  "compilerOptions": {
    "strict": false
  },
  "exclude": ["node_modules"]
}
```

---

## 4. Scripts trong `package.json`

Thêm hoặc cập nhật:

```json
{
  "scripts": {
    "start": "npx expo start",
    "lint": "eslint ./app ./src --ext .js,.ts,.tsx,.jsx",
    "lint:fix": "eslint ./app ./src --ext .js,.ts,.tsx,.jsx --fix",
    "type-check": "tsc --noEmit"
  }
}
```

Nếu project chỉ có `app` hoặc chỉ có `src`, sửa path cho đúng.

---

## 5. Kiểm tra hoạt động sau setup

Chạy đúng thứ tự:

```bash
pnpm lint
pnpm type-check
npx expo start -c
```

Sau đó tạo test component:

```tsx
import { Text, View } from 'react-native'

export const NativeWindCheck = () => {
  return (
    <View className='flex-1 items-center justify-center bg-blue-500'>
      <Text className='text-lg font-bold text-white'>NativeWind OK</Text>
    </View>
  )
}
```

Nếu màu nền/text hiển thị đúng => NativeWind đã hoạt động.

---

## 6. Lỗi thường gặp và fix nhanh

### Lỗi A: className không có tác dụng

Kiểm tra:

- Có import `global.css` ở entry chưa
- `metro.config.js` có `withNativeWind` chưa
- `babel.config.js` có `'nativewind/babel'` chưa
- `tailwind.config.js` có `presets: [require('nativewind/preset')]` chưa

Sau đó chạy:

```bash
npx expo start -c
```

### Lỗi B: ESLint không nhận flat config

Kiểm tra:

- File đúng tên `eslint.config.mjs`
- Dùng lệnh `pnpm lint` từ root project
- Node version đủ mới

### Lỗi C: Lint báo parser/project lỗi TypeScript

Kiểm tra:

- `tsconfig.json` có tồn tại
- `parserOptions.project` trỏ đúng path

---

## 7. Checklist “đúng 100%”

- [ ] Cài đủ package ở mục 2
- [ ] Có đủ các file: `global.css`, `tailwind.config.js`, `babel.config.js`, `metro.config.js`, `eslint.config.mjs`, `nativewind-env.d.ts`
- [ ] Entry đã import `global.css`
- [ ] `pnpm lint` pass
- [ ] `pnpm type-check` pass
- [ ] `expo start -c` chạy được
- [ ] Component test dùng `className` render đúng style

Nếu tất cả mục trên đều đạt thì cấu hình đã đúng.
