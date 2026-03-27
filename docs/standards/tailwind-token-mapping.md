# Tailwind Token Mapping

## 1) Source References

- `assets/app-colors.ts`
- `assets/app-font.ts`
- `constants/app-typo.ts`
- `assets/tailwindcss.js`
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

## 4) AppTypo -> Tailwind Typography Mapping

`assets/tailwindcss.js` provides ready-made utility classes.

| AppTypo token | Weight variants | Tailwind utility |
| --- | --- | --- |
| `title` | `700` | `typo-title` |
| `h1` | `bold / semiBold / medium / regular` | `typo-h1-bold`, `typo-h1-semibold`, `typo-h1-medium`, `typo-h1-regular` |
| `h2` | `bold / semiBold / medium / regular` | `typo-h2-bold`, `typo-h2-semibold`, `typo-h2-medium`, `typo-h2-regular` |
| `h3` | `bold / semiBold / medium / regular` | `typo-h3-bold`, `typo-h3-semibold`, `typo-h3-medium`, `typo-h3-regular` |
| `h4` | `bold / semiBold / medium / regular` | `typo-h4-bold`, `typo-h4-semibold`, `typo-h4-medium`, `typo-h4-regular` |
| `headline` | `bold / semiBold / medium / regular` | `typo-headline-bold`, `typo-headline-semibold`, `typo-headline-medium`, `typo-headline-regular` |
| `body` | `bold / semiBold / medium / regular` | `typo-body-bold`, `typo-body-semibold`, `typo-body-medium`, `typo-body-regular` |
| `footnote` | `bold / semiBold / medium / regular` | `typo-footnote-bold`, `typo-footnote-semibold`, `typo-footnote-medium`, `typo-footnote-regular` |
| `caption` | `bold / semiBold / medium / regular` | `typo-caption-bold`, `typo-caption-semibold`, `typo-caption-medium`, `typo-caption-regular` |
| `mini` | `bold / semiBold / medium / regular` | `typo-mini-bold`, `typo-mini-semibold`, `typo-mini-medium`, `typo-mini-regular` |

Weight equivalence:
- `regular` -> `font-normal`
- `medium` -> `font-medium`
- `semiBold` -> `font-semibold`
- `bold` -> `font-bold`

## 5) Font Family Setup Mapping (Current + Recommendation)

Current state:
- Reading renderer (`components/content-display.tsx`) supports these families: `Arial`, `Georgia`, `Inter`, `Lato`, `Lora`, `Merriweather`, `Montserrat`, `MontserratAlternates`, `NotoSans`, `NotoSerif`, `OpenSans`, `PTSans`, `PTSerif`, `Raleway`, `Roboto`, `SpaceMono`, `TimesNewRoman`, `Verdana`, `WorkSans`.
- Tailwind config currently does not expose per-font `fontFamily` utilities.

Tailwind base grouping:
- `font-sans`: `Inter`, `Lato`, `Montserrat`, `MontserratAlternates`, `NotoSans`, `OpenSans`, `PTSans`, `Raleway`, `Roboto`, `Verdana`, `WorkSans`, `Arial`
- `font-serif`: `Lora`, `Merriweather`, `NotoSerif`, `PTSerif`, `TimesNewRoman`, `Georgia`
- `font-mono`: `SpaceMono`

If you want direct per-font Tailwind utilities, add them under `theme.extend.fontFamily` in `tailwind.config.js`.
