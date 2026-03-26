# Color and Typography Guide (React Native)

## 1) Source of Truth

- Use design tokens from `assets/app-colors.ts` and `constants/app-typo.ts`.
- Avoid hardcoded hex values and ad-hoc font sizes in screen/components.

## 2) Color Usage

- Prefer semantic usage:
  - background/surface
  - primary/action
  - error/warning/success
  - muted/secondary text
- Keep text/background contrast readable.

## 3) Typography Usage

- Use configured app font families from assets and store typography settings.
- Respect user typography settings (`font`, `fontSize`, `lineHeight`) in reading UI.
- Avoid isolated one-off font rules unless required by design.

## 4) Icon and Visual Consistency

- Reuse existing icon wrappers/components from `components/icon.tsx` and
  `components/vector-icon.tsx`.
- Keep icon sizes consistent within a screen section.

## 5) Checklist

- [ ] No random hardcoded colors for standard UI states.
- [ ] Typography comes from constants/store where applicable.
- [ ] Reading screen applies user-selected typography settings.
- [ ] Icons and text spacing are visually consistent.
