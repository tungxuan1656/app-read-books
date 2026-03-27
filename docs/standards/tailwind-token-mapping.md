# Tailwind Token Mapping

## 1) Source References

- `assets/app-colors.ts`
- `assets/app-font.ts`
- `constants/app-typo.ts`
- `tailwind.config.js`
- `components/content-display.tsx`

## 2) App Color -> Tailwind Mapping

Notes:
- Semantic app colors are exposed to Tailwind via CSS vars in `tailwind.config.js`.
- For each token, use Tailwind utility by context: `bg-{token}`, `text-{token}`, `border-{token}`.
- `primary` is also available as `bg-primary` / `text-primary` / `border-primary`.

| App token | Hex | Tailwind semantic utility token | Closest Tailwind base color |
| --- | --- | --- | --- |
| `white` | `#ffffff` | `white` | `zinc-50` |
| `black` | `#1a1e22ff` | `black` | `zinc-900` |
| `bgMain` | `#ffffff` | `bgMain` | `zinc-50` |
| `bgExtra` | `#f6f8fa` | `bgExtra` | `slate-50` |
| `bgBlur` | `#eaeef2` | `bgBlur` | `slate-200` |
| `bgDisabled` | `#d0d7de` | `bgDisabled` | `gray-300` |
| `bgValidate` | `#ffcecb` | `bgValidate` | `red-200` |
| `bgActivate` | `#aceebb` | `bgActivate` | `emerald-200` |
| `bgFocus` | `#b6e3ff` | `bgFocus` | `sky-200` |
| `bgWarning` | `#ffd8b5` | `bgWarning` | `orange-200` |
| `bgGrayOpacity` | `#57606aFA` | `bgGrayOpacity` | `gray-600` |
| `strokeMain` | `#eaeef2` | `strokeMain` | `slate-200` |
| `strokeExtra` | `#d0d7de` | `strokeExtra` | `gray-300` |
| `strokeBold` | `#afb8c1` | `strokeBold` | `gray-400` |
| `textMain` | `#1a1e22ff` | `textMain` | `zinc-900` |
| `textExtra` | `#424a53` | `textExtra` | `gray-700` |
| `textBlur` | `#6e7781` | `textBlur` | `gray-500` |
| `textDisabled` | `#8c959f` | `textDisabled` | `zinc-400` |
| `textFocus` | `#0969da` | `textFocus` | `blue-600` |
| `textValidate` | `#fa4549` | `textValidate` | `red-500` |
| `textWarning` | `#e16f24` | `textWarning` | `orange-500` |
| `textActivate` | `#2da44e` | `textActivate` | `green-600` |
| `buttonMain` | `#1a1e22ff` | `buttonMain` | `zinc-900` |
| `buttonExtra` | `#424a53` | `buttonExtra` | `gray-700` |
| `buttonBlur` | `#6e7781` | `buttonBlur` | `gray-500` |
| `buttonFocus` | `#218bff` | `buttonFocus` | `blue-500` |
| `buttonValidate` | `#fa4549` | `buttonValidate` | `red-500` |
| `buttonDisabled` | `#8c959f` | `buttonDisabled` | `zinc-400` |
| `buttonActivate` | `#2da44e` | `buttonActivate` | `green-600` |
| `buttonWarning` | `#e16f24` | `buttonWarning` | `orange-500` |
| `buttonHighlight` | `#eac54f` | `buttonHighlight` | `amber-300` |
| `switchThumb` | `#ffffff` | `switchThumb` | `zinc-50` |
| `switchTrackTrue` | `#218bff` | `switchTrackTrue` | `blue-500` |
| `switchTrackFalse` | `#afb8c1` | `switchTrackFalse` | `gray-400` |
| `primary` | `#0969da` | `primary` | `blue-600` |

## 3) App Font Size -> Tailwind Size Mapping

`tailwind.config.js` already adds:

- `xss: 0.625rem` (10px)
- `ssm: 0.8125rem` (13px)

Mapping:

| AppFontSize token | px | Tailwind class |
| --- | --- | --- |
| `x_small` | 10 | `text-xss` |
| `small` | 12 | `text-xs` |
| `x_medium` | 13 | `text-ssm` |
| `medium` | 14 | `text-sm` |
| `large` | 16 | `text-base` |
| `x_large` | 18 | `text-lg` |
| `xx_large` | 20 | `text-xl` |
| `xxx_large` | 24 | `text-2xl` |
| `xxxx_large` | 32 | `text-3xl` |

## 4) AppTypo -> Tailwind Typography Mapping (Default Classes Only)

| AppTypo token | Tailwind size class | Weight mapping |
| --- | --- | --- |
| `title` (48px) | `text-5xl` | `font-bold` |
| `h1` (32px) | `text-3xl` | `bold -> font-bold`, `semiBold -> font-semibold`, `medium -> font-medium`, `regular -> font-normal` |
| `h2` (24px) | `text-2xl` | same weight mapping as above |
| `h3` (20px) | `text-xl` | same weight mapping as above |
| `h4` (18px) | `text-lg` | same weight mapping as above |
| `headline` (16px) | `text-base` | same weight mapping as above |
| `body` (14px) | `text-sm` | same weight mapping as above |
| `footnote` (13px) | `text-ssm` | same weight mapping as above |
| `caption` (12px) | `text-xs` | same weight mapping as above |
| `mini` (10px) | `text-xss` | same weight mapping as above |

## 5) Font Family Setup Mapping (Current + Recommendation)

Current state:
- Reading renderer (`components/content-display.tsx`) supports these families: `Arial`, `Georgia`, `Inter`, `Lato`, `Lora`, `Merriweather`, `Montserrat`, `MontserratAlternates`, `NotoSans`, `NotoSerif`, `OpenSans`, `PTSans`, `PTSerif`, `Raleway`, `Roboto`, `SpaceMono`, `TimesNewRoman`, `Verdana`, `WorkSans`.
- Tailwind config currently does not expose per-font `fontFamily` utilities.

Tailwind base grouping:
- `font-sans`: `Inter`, `Lato`, `Montserrat`, `MontserratAlternates`, `NotoSans`, `OpenSans`, `PTSans`, `Raleway`, `Roboto`, `Verdana`, `WorkSans`, `Arial`
- `font-serif`: `Lora`, `Merriweather`, `NotoSerif`, `PTSerif`, `TimesNewRoman`, `Georgia`
- `font-mono`: `SpaceMono`

If you want direct per-font Tailwind utilities, add them under `theme.extend.fontFamily` in `tailwind.config.js`.
